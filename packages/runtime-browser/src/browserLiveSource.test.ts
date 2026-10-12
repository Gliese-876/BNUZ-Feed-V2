// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";

import type { SourceDescriptor } from "@bnuz-feed/contracts";
import { createDefaultNormalizer } from "@bnuz-feed/core";

import { createBrowserLiveSource } from "./browserLiveSource";

afterEach(() => vi.unstubAllGlobals());

describe("createBrowserLiveSource", () => {
  it("runs DOM parsers on the window and only fetches selected sources", async () => {
    const sources: SourceDescriptor[] = ["notice", "news"].map((id) => ({
      id, name: id, entryUrls: [`https://${id}.example.com`], parserKey: "html", enabled: true,
      capabilities: { browserFetch: true, snapshotFallback: true },
    }));
    const fetchFn = vi.fn<typeof fetch>(async (url) => ({
      ok: true, url: String(url), headers: { get: () => "text/html" },
      text: async () => "<h1>Announcement</h1>",
    } as unknown as Response));
    vi.stubGlobal("fetch", fetchFn);
    const worker = vi.fn(() => { throw new Error("Worker should not run DOM parsers"); });
    vi.stubGlobal("Worker", worker);

    const source = createBrowserLiveSource({
      sources,
      parserRegistry: { get: () => ({ parse: async (page) => [{
        sourceId: page.sourceId,
        rawTitle: new DOMParser().parseFromString(page.bodyText, "text/html").querySelector("h1")!.textContent!,
        rawUrl: page.requestUrl,
      }] }) },
      normalizer: createDefaultNormalizer(),
      requestOptions: { concurrency: 1, timeoutMs: 1000 },
    });
    const snapshot = await source.refresh(["news"]);
    expect(snapshot.items).toHaveLength(1);
    expect(snapshot.items[0]).toMatchObject({ sourceId: "news", title: "Announcement" });
    expect(fetchFn).toHaveBeenCalledOnce();
    expect(fetchFn.mock.calls[0]?.[0]).toBe("https://news.example.com");
    expect(worker).not.toHaveBeenCalled();
  });
});
