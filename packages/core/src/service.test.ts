import { describe, expect, it, vi } from "vitest";

import type { FeedSnapshot, FeedSource, Repository } from "@bnuz-feed/contracts";

import { createLayeredAggregationService } from "./service";

function createSnapshot(origin: FeedSnapshot["origin"]): FeedSnapshot {
  return {
    version: 1,
    updatedAt: "2026-03-15T10:00:00.000Z",
    origin,
    items: [
      {
        id: "item-1",
        sourceId: "notice",
        sourceIds: ["notice"],
        title: "A",
        url: "https://notice/item-1",
        fetchedAt: "2026-03-15T10:00:00.000Z",
        freshness: origin,
      },
    ],
    sourceHealth: {},
  };
}

describe("createLayeredAggregationService", () => {
  it("hydrates from cache before refresh", async () => {
    const repository: Repository = {
      load: vi.fn().mockResolvedValue(createSnapshot("live")),
      save: vi.fn().mockResolvedValue(undefined),
    };
    const primary: FeedSource = {
      refresh: vi.fn().mockResolvedValue(createSnapshot("live")),
    };

    const service = createLayeredAggregationService({ primary, repository });
    const snapshot = await service.bootstrap();

    expect(snapshot?.origin).toBe("cache");
    expect(snapshot?.items[0]?.freshness).toBe("cache");
  });

  it("falls back when no cache exists and primary refresh fails", async () => {
    const repository: Repository = {
      load: vi.fn().mockResolvedValue(null),
      save: vi.fn().mockResolvedValue(undefined),
    };
    const primary: FeedSource = {
      refresh: vi.fn().mockRejectedValue(new Error("boom")),
    };
    const fallback: FeedSource = {
      bootstrap: vi.fn().mockResolvedValue(createSnapshot("snapshot")),
      refresh: vi.fn().mockResolvedValue(createSnapshot("snapshot")),
    };

    const service = createLayeredAggregationService({ primary, repository, fallback });
    const snapshot = await service.refresh();

    expect(snapshot.origin).toBe("snapshot");
  });
});
