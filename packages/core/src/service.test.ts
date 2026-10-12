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
  it("does not roll readable data back to an older offline or CDN snapshot", async () => {
    const cached = { ...createSnapshot("snapshot"), updatedAt: "2026-03-16T10:00:00Z" };
    const older = createSnapshot("snapshot", [createItem("notice", "old", "snapshot")]);
    const newer = { ...createSnapshot("snapshot", [createItem("notice", "new", "snapshot")]), updatedAt: "2026-03-17T10:00:00Z" };
    const repository = { load: vi.fn().mockResolvedValue(cached), save: vi.fn() };
    const service = createLayeredAggregationService({
      primary: { refresh: vi.fn().mockResolvedValueOnce(older).mockResolvedValueOnce(newer) }, repository,
    });
    await service.bootstrap();
    const listener = vi.fn();
    service.subscribe(listener);
    expect((await service.refresh()).updatedAt).toBe(cached.updatedAt);
    expect(service.getSnapshot()?.items[0]?.id).toBe("item-1");
    expect(repository.save).not.toHaveBeenCalled();
    expect(listener).not.toHaveBeenCalled();
    expect((await service.refresh()).updatedAt).toBe(newer.updatedAt);
    expect(repository.save).toHaveBeenCalledOnce();
    expect(listener).toHaveBeenCalledOnce();
  });

  it("coalesces bootstrap and commits a following refresh after cache hydration", async () => {
    let loadCache!: (snapshot: FeedSnapshot) => void;
    const repository: Repository = {
      load: vi.fn(() => new Promise<FeedSnapshot>((resolve) => { loadCache = resolve; })),
      save: vi.fn().mockResolvedValue(undefined),
    };
    const primary: FeedSource = {
      refresh: vi.fn().mockResolvedValue(createSnapshot("live", [createItem("notice", "new", "live")])),
    };
    const service = createLayeredAggregationService({ primary, repository });
    const first = service.bootstrap();
    const second = service.bootstrap();
    const refreshed = service.refresh();
    await Promise.resolve();
    expect(repository.load).toHaveBeenCalledTimes(1);
    expect(primary.refresh).not.toHaveBeenCalled();
    loadCache(createSnapshot("cache"));
    await Promise.all([first, second, refreshed]);
    expect(service.getSnapshot()?.items[0]?.id).toBe("new");
  });

  it("notifies subscribers about successful data even when cache writes fail", async () => {
    const service = createLayeredAggregationService({
      primary: { refresh: vi.fn().mockResolvedValue(createSnapshot("live")) },
      repository: {
        load: vi.fn().mockResolvedValue(null),
        save: vi.fn().mockRejectedValue(new Error("quota exceeded")),
      },
    });
    const listener = vi.fn();
    service.subscribe(listener);
    expect((await service.refresh()).items).toHaveLength(1);
    expect(listener).toHaveBeenCalledOnce();
  });

  it("keeps readable cache while reporting a failed refresh to the caller", async () => {
    const failure = new Error("offline");
    const service = createLayeredAggregationService({
      primary: { refresh: vi.fn().mockRejectedValue(failure) },
      repository: {
        load: vi.fn().mockResolvedValue(createSnapshot("cache")),
        save: vi.fn(),
      },
    });
    await service.bootstrap();
    await expect(service.refresh()).rejects.toBe(failure);
    expect(service.getSnapshot()?.items).toHaveLength(1);
  });

  it("reports bootstrap failure when neither cache nor fallback is available", async () => {
    const failure = new Error("snapshot unavailable");
    const service = createLayeredAggregationService({
      primary: { bootstrap: vi.fn().mockRejectedValue(failure), refresh: vi.fn() },
      repository: { load: vi.fn().mockRejectedValue(new Error("cache blocked")), save: vi.fn() },
    });
    await expect(service.bootstrap()).rejects.toBe(failure);
  });

  it("retains cached items for failed sources while updating their health", async () => {
    const snapshot: FeedSnapshot = {
      ...createSnapshot("live", [createItem("news", "news-new", "live")]),
      sourceHealth: { notice: {
        sourceId: "notice", status: "timeout", checkedAt: "2026-03-16", itemCount: 0,
      } },
    };
    const service = createLayeredAggregationService({
      primary: { refresh: vi.fn().mockResolvedValue(snapshot) },
      repository: { load: vi.fn().mockResolvedValue(createSnapshot("cache")), save: vi.fn() },
    });
    await service.bootstrap();
    const refreshed = await service.refresh();
    expect(refreshed.items).toHaveLength(2);
    expect(refreshed.items.find((item) => item.sourceId === "notice")?.freshness).toBe("cache");
    expect(refreshed.sourceHealth.notice?.status).toBe("timeout");
  });

  it("falls back on direct refresh when every source returns only errors", async () => {
    const failed: FeedSnapshot = {
      ...createSnapshot("live", []),
      sourceHealth: { notice: {
        sourceId: "notice", status: "cors", checkedAt: "2026-03-16", itemCount: 0,
      } },
    };
    const fallback = { refresh: vi.fn().mockResolvedValue(createSnapshot("snapshot")) };
    const service = createLayeredAggregationService({
      primary: { refresh: vi.fn().mockResolvedValue(failed) },
      repository: { load: vi.fn().mockResolvedValue(null), save: vi.fn() },
      fallback,
    });
    const refreshed = await service.refresh();
    expect(refreshed.origin).toBe("snapshot");
    expect(refreshed.items).toHaveLength(1);
    expect(fallback.refresh).toHaveBeenCalledOnce();
  });

  it("preserves the cached timestamp and reports failure when all sources fail", async () => {
    const cached = createSnapshot("cache");
    const failed: FeedSnapshot = {
      ...createSnapshot("live", []), updatedAt: "2026-03-16T10:00:00.000Z",
      sourceHealth: { notice: {
        sourceId: "notice", status: "cors", checkedAt: "2026-03-16", itemCount: 0,
      } },
    };
    const repository = { load: vi.fn().mockResolvedValue(cached), save: vi.fn() };
    const service = createLayeredAggregationService({
      primary: { refresh: vi.fn().mockResolvedValue(failed) }, repository,
    });
    await service.bootstrap();
    await expect(service.refresh()).rejects.toMatchObject({ code: "FETCH_FAILED" });
    expect(service.getSnapshot()?.updatedAt).toBe(cached.updatedAt);
    expect(service.getSnapshot()?.items).toHaveLength(1);
    expect(repository.save).not.toHaveBeenCalled();
  });

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

  it("bootstraps from the primary source when cache is empty", async () => {
    const snapshot = createSnapshot("snapshot");
    const repository: Repository = {
      load: vi.fn().mockResolvedValue(null),
      save: vi.fn().mockResolvedValue(undefined),
    };
    const primary: FeedSource = {
      bootstrap: vi.fn().mockResolvedValue(snapshot),
      refresh: vi.fn().mockResolvedValue(snapshot),
    };

    const service = createLayeredAggregationService({ primary, repository });
    const bootstrappedSnapshot = await service.bootstrap();

    expect(primary.bootstrap).toHaveBeenCalledTimes(1);
    expect(repository.save).toHaveBeenCalledTimes(1);
    expect(vi.mocked(repository.save).mock.calls[0]?.[0]).toMatchObject(snapshot);
    expect(bootstrappedSnapshot?.origin).toBe("snapshot");
  });

  it("replaces an empty cached snapshot with the primary source", async () => {
    const snapshot = createSnapshot("snapshot");
    const repository: Repository = {
      load: vi.fn().mockResolvedValue(createSnapshot("cache", [])),
      save: vi.fn().mockResolvedValue(undefined),
    };
    const primary: FeedSource = {
      bootstrap: vi.fn().mockResolvedValue(snapshot),
      refresh: vi.fn().mockResolvedValue(snapshot),
    };

    const service = createLayeredAggregationService({ primary, repository });
    const bootstrappedSnapshot = await service.bootstrap();

    expect(primary.bootstrap).toHaveBeenCalledTimes(1);
    expect(repository.save).toHaveBeenCalledTimes(1);
    expect(vi.mocked(repository.save).mock.calls[0]?.[0]).toMatchObject(snapshot);
    expect(bootstrappedSnapshot?.items).toHaveLength(snapshot.items.length);
    expect(bootstrappedSnapshot?.origin).toBe("snapshot");
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
