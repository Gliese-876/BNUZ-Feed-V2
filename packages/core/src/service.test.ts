import { describe, expect, it, vi } from "vitest";

import type { FeedSnapshot, FeedSource, Repository } from "@bnuz-feed/contracts";

import { createLayeredAggregationService } from "./service";

function createItem(sourceId: string, id: string, freshness: FeedSnapshot["origin"]) {
  return {
    id,
    sourceId,
    sourceIds: [sourceId],
    title: id,
    url: `https://${sourceId}/${id}`,
    fetchedAt: "2026-03-15T10:00:00.000Z",
    freshness,
  };
}

function createSnapshot(
  origin: FeedSnapshot["origin"],
  items = [createItem("notice", "item-1", origin)],
): FeedSnapshot {
  return {
    version: 1,
    updatedAt: "2026-03-15T10:00:00.000Z",
    origin,
    items,
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

  it("merges partial refreshes without dropping untouched sources", async () => {
    const cachedSnapshot = createSnapshot("live", [
      createItem("notice", "notice-old", "live"),
      createItem("news", "news-stable", "live"),
    ]);
    const partialSnapshot = {
      ...createSnapshot("live", [createItem("notice", "notice-new", "live")]),
      sourceHealth: {
        notice: {
          sourceId: "notice",
          status: "live",
          checkedAt: "2026-03-16T10:00:00.000Z",
          itemCount: 1,
        },
      },
    } satisfies FeedSnapshot;

    const repository: Repository = {
      load: vi.fn().mockResolvedValue(cachedSnapshot),
      save: vi.fn().mockResolvedValue(undefined),
    };
    const primary: FeedSource = {
      refresh: vi.fn().mockResolvedValue(partialSnapshot),
    };

    const service = createLayeredAggregationService({ primary, repository });

    await service.bootstrap();
    const snapshot = await service.refresh(["notice"]);

    expect(snapshot.items.map((item) => item.id).sort()).toEqual(["news-stable", "notice-new"]);
    expect(snapshot.items.find((item) => item.id === "news-stable")?.freshness).toBe("cache");
    expect(snapshot.sourceHealth.notice?.status).toBe("live");
  });
});
