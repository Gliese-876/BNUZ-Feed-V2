import { describe, expect, it, vi } from "vitest";

import type {
  FeedItem,
  Normalizer,
  ParserRegistry,
  RawPage,
  SourceDescriptor,
  SourceRecord,
} from "@bnuz-feed/contracts";

import { executeBrowserRefresh } from "./runRefresh";

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
});
