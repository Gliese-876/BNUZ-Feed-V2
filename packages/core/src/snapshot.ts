import type { FeedFreshness, FeedSnapshot, SourceHealth } from "@bnuz-feed/contracts";

export function createEmptySnapshot(origin: FeedFreshness): FeedSnapshot {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    origin,
    items: [],
    sourceHealth: {},
  };
}

export function cloneSnapshot(snapshot: FeedSnapshot): FeedSnapshot {
  return {
    ...snapshot,
    items: snapshot.items.map((item) => ({
      ...item,
      sourceIds: [...item.sourceIds],
    })),
    sourceHealth: Object.fromEntries(
      Object.entries(snapshot.sourceHealth).map(([sourceId, value]) => [sourceId, { ...value }]),
    ) as Record<string, SourceHealth>,
  };
}

export function withFreshness(snapshot: FeedSnapshot, freshness: FeedFreshness): FeedSnapshot {
  return {
    ...cloneSnapshot(snapshot),
    origin: freshness,
    items: snapshot.items.map((item) => ({
      ...item,
      freshness,
      sourceIds: [...item.sourceIds],
    })),
  };
}
