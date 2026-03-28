import { describe, expect, it, vi } from "vitest";

import type {
  FeedItem,
  Normalizer,
  ParserRegistry,
  RawPage,
  SourceDescriptor,
  SourceRecord,
} from "@bnuz-feed/contracts";

import { executeBrowserRefresh, executeBrowserRefreshUntilStable } from "./runRefresh";

function createSource(id: string, targetCount: number): SourceDescriptor {
  return {
    id,
    name: id,
    entryUrls: [`https://${id}.example.com`],
    fetchTargets: Array.from({ length: targetCount }, (_, index) => ({
      id: `${id}-${index}`,
      url: `https://${id}.example.com/${index}`,
    })),
    parserKey: "test-parser",
    enabled: true,
    capabilities: {
      browserFetch: true,
      snapshotFallback: true,
    },
  };
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("executeBrowserRefresh", () => {
  it("limits nested fetch and parse concurrency during refresh", async () => {
    const sources = [createSource("alpha", 4), createSource("beta", 4)];
    let activeFetches = 0;
    let maxFetches = 0;
    let activeParses = 0;
    let maxParses = 0;

    const fetchFn = vi.fn<typeof fetch>(async (input) => {
      activeFetches += 1;
      maxFetches = Math.max(maxFetches, activeFetches);
      await wait(10);
      activeFetches -= 1;

      return {
        ok: true,
        url: String(input),
        headers: {
          get: () => "text/html",
        },
        text: async () => "<html></html>",
      } as unknown as Response;
    });

    const parserRegistry: ParserRegistry = {
      get() {
        return {
          async parse(page: RawPage): Promise<SourceRecord[]> {
            activeParses += 1;
            maxParses = Math.max(maxParses, activeParses);
            await wait(10);
            activeParses -= 1;

            return [
              {
                sourceId: page.sourceId,
                rawId: page.requestId,
                rawTitle: `Title ${page.requestId}`,
                rawUrl: page.requestUrl,
              },
            ];
          },
        };
      },
    };

    const normalizer: Normalizer = {
      normalize(record: SourceRecord): FeedItem {
        return {
          id: `${record.sourceId}-${record.rawId}`,
          sourceId: record.sourceId,
          sourceIds: [record.sourceId],
          title: record.rawTitle,
          url: record.rawUrl,
          fetchedAt: new Date().toISOString(),
          freshness: "live",
        };
      },
    };

    const snapshot = await executeBrowserRefresh({
      sources,
      parserRegistry,
      normalizer,
      requestOptions: {
        concurrency: 2,
        targetConcurrency: 2,
        timeoutMs: 1000,
      },
      fetchFn,
    });

    expect(snapshot.items).toHaveLength(8);
    expect(maxFetches).toBeLessThanOrEqual(4);
    expect(maxParses).toBeLessThanOrEqual(4);
  });

  it("keeps successful pages when another target in the same source fails", async () => {
    const source: SourceDescriptor = {
      ...createSource("alpha", 2),
      fetchTargets: [
        { id: "alpha-0", url: "https://alpha.example.com/0" },
        { id: "alpha-1", url: "https://alpha.example.com/1" },
      ],
    };

    const fetchFn = vi.fn<typeof fetch>(async (input) => {
      const url = String(input);

      if (url.endsWith("/1")) {
        return {
          ok: false,
          status: 404,
          url,
          headers: { get: () => "text/html" },
          text: async () => "missing",
        } as unknown as Response;
      }

      return {
        ok: true,
        url,
        headers: { get: () => "text/html" },
        text: async () => "<html></html>",
      } as unknown as Response;
    });

    const parserRegistry: ParserRegistry = {
      get() {
        return {
          async parse(page: RawPage): Promise<SourceRecord[]> {
            return [
              {
                sourceId: page.sourceId,
                rawId: page.requestId,
                rawTitle: `Title ${page.requestId}`,
                rawUrl: page.requestUrl,
              },
            ];
          },
        };
      },
    };

    const normalizer: Normalizer = {
      normalize(record: SourceRecord): FeedItem {
        return {
          id: `${record.sourceId}-${record.rawId}`,
          sourceId: record.sourceId,
          sourceIds: [record.sourceId],
          title: record.rawTitle,
          url: record.rawUrl,
          fetchedAt: new Date().toISOString(),
          freshness: "live",
        };
      },
    };

    const snapshot = await executeBrowserRefresh({
      sources: [source],
      parserRegistry,
      normalizer,
      requestOptions: {
        concurrency: 1,
        targetConcurrency: 1,
        timeoutMs: 1000,
      },
      fetchFn,
    });

    expect(snapshot.items).toHaveLength(1);
    expect(snapshot.sourceHealth.alpha?.status).toBe("partial");
    expect(snapshot.sourceHealth.alpha?.itemCount).toBe(1);
  });
});

describe("executeBrowserRefreshUntilStable", () => {
  it("retries only the failed sources and preserves successful results", async () => {
    const sources = [createSource("alpha", 1), createSource("beta", 1)];
    const requestCounts = new Map<string, number>();

    const fetchFn = vi.fn<typeof fetch>(async (input) => {
      const url = String(input);
      const nextCount = (requestCounts.get(url) ?? 0) + 1;
      requestCounts.set(url, nextCount);

      if (url.includes("alpha") && nextCount === 1) {
        throw new Error("temporary network failure");
      }

      return {
        ok: true,
        url,
        headers: {
          get: () => "text/html",
        },
        text: async () => "<html></html>",
      } as unknown as Response;
    });

    const parserRegistry: ParserRegistry = {
      get() {
        return {
          async parse(page: RawPage): Promise<SourceRecord[]> {
            return [
              {
                sourceId: page.sourceId,
                rawId: page.requestId,
                rawTitle: `Title ${page.requestId}`,
                rawUrl: page.requestUrl,
              },
            ];
          },
        };
      },
    };

    const normalizer: Normalizer = {
      normalize(record: SourceRecord): FeedItem {
        return {
          id: `${record.sourceId}-${record.rawId}`,
          sourceId: record.sourceId,
          sourceIds: [record.sourceId],
          title: record.rawTitle,
          url: record.rawUrl,
          fetchedAt: new Date().toISOString(),
          freshness: "live",
        };
      },
    };

    const snapshot = await executeBrowserRefreshUntilStable({
      sources,
      parserRegistry,
      normalizer,
      requestOptions: {
        concurrency: 2,
        targetConcurrency: 1,
        timeoutMs: 1000,
      },
      stabilization: {
        maxAttempts: 2,
        retryDelayMs: 0,
      },
      fetchFn,
    });

    expect(snapshot.items).toHaveLength(2);
    expect(snapshot.sourceHealth.alpha?.status).toBe("live");
    expect(snapshot.sourceHealth.beta?.status).toBe("live");
    expect(requestCounts.get("https://alpha.example.com/0")).toBe(2);
    expect(requestCounts.get("https://beta.example.com/0")).toBe(1);
  });

  it("stops retrying when the maximum attempt count is reached", async () => {
    const sources = [createSource("alpha", 1)];
    let fetchAttempts = 0;

    const fetchFn = vi.fn<typeof fetch>(async () => {
      fetchAttempts += 1;
      throw new Error("still failing");
    });

    const parserRegistry: ParserRegistry = {
      get() {
        return {
          async parse(): Promise<SourceRecord[]> {
            return [];
          },
        };
      },
    };

    const normalizer: Normalizer = {
      normalize(record: SourceRecord): FeedItem {
        return {
          id: `${record.sourceId}-${record.rawId}`,
          sourceId: record.sourceId,
          sourceIds: [record.sourceId],
          title: record.rawTitle,
          url: record.rawUrl,
          fetchedAt: new Date().toISOString(),
          freshness: "live",
        };
      },
    };

    const snapshot = await executeBrowserRefreshUntilStable({
      sources,
      parserRegistry,
      normalizer,
      requestOptions: {
        concurrency: 1,
        targetConcurrency: 1,
        timeoutMs: 1000,
      },
      stabilization: {
        maxAttempts: 3,
        retryDelayMs: 0,
      },
      fetchFn,
    });

    expect(fetchAttempts).toBe(3);
    expect(snapshot.items).toHaveLength(0);
    expect(snapshot.sourceHealth.alpha?.status).toBe("network_error");
  });
});
