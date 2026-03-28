import { describe, expect, it, vi } from "vitest";

import { createHostScopedFetch, parseBrowserHostList } from "./snapshotFetch";

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
