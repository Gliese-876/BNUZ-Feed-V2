import { beforeEach, describe, expect, it, vi } from "vitest";

import { createHostScopedFetch, createSnapshotFetch, parseBrowserHostList } from "./snapshotFetch";

const playwright = vi.hoisted(() => ({ launch: vi.fn() }));
vi.mock("playwright", () => ({ chromium: { launch: playwright.launch } }));

function createPage() {
  return {
    goto: vi.fn(async () => ({
      status: () => 200,
      url: () => "https://www.bnuzh.edu.cn/final.htm",
      allHeaders: async () => ({ "content-type": "text/html" }),
    })),
    content: vi.fn(async () => "<html>rendered</html>"),
    close: vi.fn(async () => undefined),
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((fulfill) => { resolve = fulfill; });
  return { promise, resolve };
}

beforeEach(() => vi.resetAllMocks());

describe("parseBrowserHostList", () => {
  it("normalizes, trims, and deduplicates host names", () => {
    expect(parseBrowserHostList(" www.bnuzh.edu.cn,WWW.BNUZH.EDU.CN, notice.bnuzh.edu.cn ")).toEqual([
      "www.bnuzh.edu.cn",
      "notice.bnuzh.edu.cn",
    ]);
  });

  it("returns an empty list when the input is missing", () => {
    expect(parseBrowserHostList(undefined)).toEqual([]);
  });
});

describe("createHostScopedFetch", () => {
  it("routes matching hosts to the browser fetcher", async () => {
    const nativeFetch = vi.fn<typeof fetch>(async () => new Response("native"));
    const browserFetch = vi.fn<typeof fetch>(async () => new Response("browser"));
    const fetchFn = createHostScopedFetch(nativeFetch, browserFetch, ["www.bnuzh.edu.cn"]);

    const response = await fetchFn("https://www.bnuzh.edu.cn/xqtt/index.htm");

    expect(browserFetch).toHaveBeenCalledTimes(1);
    expect(nativeFetch).not.toHaveBeenCalled();
    await expect(response.text()).resolves.toBe("browser");
  });

  it("falls back to the native fetcher for other hosts", async () => {
    const nativeFetch = vi.fn<typeof fetch>(async () => new Response("native"));
    const browserFetch = vi.fn<typeof fetch>(async () => new Response("browser"));
    const fetchFn = createHostScopedFetch(nativeFetch, browserFetch, ["www.bnuzh.edu.cn"]);

    const response = await fetchFn("https://notice.bnuzh.edu.cn/index.htm");

    expect(nativeFetch).toHaveBeenCalledTimes(1);
    expect(browserFetch).not.toHaveBeenCalled();
    await expect(response.text()).resolves.toBe("native");
  });
});

describe("createSnapshotFetch", () => {
  const options = { browserHosts: ["www.bnuzh.edu.cn"], browserTimeoutMs: 5000 };
  const url = "https://www.bnuzh.edu.cn/index.htm";

  it("shares one browser launch across concurrent fetches and closes each page", async () => {
    const pages = [createPage(), createPage()];
    const browser = { newPage: vi.fn().mockResolvedValueOnce(pages[0]).mockResolvedValueOnce(pages[1]), close: vi.fn() };
    playwright.launch.mockResolvedValue(browser);
    const handle = await createSnapshotFetch(options);

    const responses = await Promise.all([handle.fetchFn(url), handle.fetchFn(url)]);

    expect(playwright.launch).toHaveBeenCalledTimes(1);
    expect(responses[0]).toBeInstanceOf(Response);
    expect(responses[0]?.url).toBe("https://www.bnuzh.edu.cn/final.htm");
    await expect(responses[0]?.text()).resolves.toBe("<html>rendered</html>");
    pages.forEach((page) => expect(page.close).toHaveBeenCalledTimes(1));
    await Promise.all([handle.dispose(), handle.dispose()]);
    expect(browser.close).toHaveBeenCalledTimes(1);
  });

  it("honors an already aborted Request signal without launching a browser", async () => {
    const controller = new AbortController();
    controller.abort();
    const handle = await createSnapshotFetch(options);

    await expect(handle.fetchFn(new Request(url, { signal: controller.signal }))).rejects.toMatchObject({ name: "AbortError" });
    expect(playwright.launch).not.toHaveBeenCalled();
    await handle.dispose();
  });

  it("aborts during browser startup and disposes the browser once startup finishes", async () => {
    const browser = { newPage: vi.fn(), close: vi.fn() };
    const launch = deferred<typeof browser>();
    playwright.launch.mockReturnValue(launch.promise);
    const controller = new AbortController();
    const handle = await createSnapshotFetch(options);
    const request = handle.fetchFn(url, { signal: controller.signal });
    await vi.waitFor(() => expect(playwright.launch).toHaveBeenCalledTimes(1));

    controller.abort();
    await expect(request).rejects.toMatchObject({ name: "AbortError" });
    const disposed = handle.dispose();
    launch.resolve(browser);
    await disposed;

    expect(browser.newPage).not.toHaveBeenCalled();
    expect(browser.close).toHaveBeenCalledTimes(1);
  });

  it("closes a page that finishes opening after the request was aborted", async () => {
    const page = createPage();
    const opening = deferred<typeof page>();
    const browser = { newPage: vi.fn().mockReturnValue(opening.promise), close: vi.fn() };
    playwright.launch.mockResolvedValue(browser);
    const handle = await createSnapshotFetch(options);
    const controller = new AbortController();
    const request = handle.fetchFn(url, { signal: controller.signal });
    await vi.waitFor(() => expect(browser.newPage).toHaveBeenCalledTimes(1));

    controller.abort();
    await expect(request).rejects.toMatchObject({ name: "AbortError" });
    opening.resolve(page);
    await vi.waitFor(() => expect(page.close).toHaveBeenCalledTimes(1));

    expect(page.goto).not.toHaveBeenCalled();
    await handle.dispose();
  });

  it("honors aborts during navigation and cleans up the page", async () => {
    const page = createPage();
    page.goto.mockReturnValue(new Promise(() => undefined));
    playwright.launch.mockResolvedValue({ newPage: async () => page, close: vi.fn() });
    const handle = await createSnapshotFetch(options);
    const controller = new AbortController();
    const request = handle.fetchFn(new Request(url, { signal: controller.signal }));
    await vi.waitFor(() => expect(page.goto).toHaveBeenCalledTimes(1));

    controller.abort();
    await expect(request).rejects.toMatchObject({ name: "AbortError" });
    expect(page.close).toHaveBeenCalled();
    await handle.dispose();
  });

  it("retries a failed browser launch and rejects requests after disposal", async () => {
    const page = createPage();
    const browser = { newPage: async () => page, close: vi.fn() };
    playwright.launch.mockRejectedValueOnce(new Error("launch failed")).mockResolvedValueOnce(browser);
    const handle = await createSnapshotFetch(options);

    await expect(handle.fetchFn(url)).rejects.toThrow("launch failed");
    await expect(handle.fetchFn(url)).resolves.toHaveProperty("status", 200);
    await handle.dispose();
    await expect(handle.fetchFn(url)).rejects.toThrow("disposed");
    expect(playwright.launch).toHaveBeenCalledTimes(2);
  });
});
