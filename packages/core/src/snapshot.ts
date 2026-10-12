import type { FeedFreshness, FeedSnapshot, SourceHealth } from "@bnuz-feed/contracts";

import { getRawOccurrences } from "./rawOccurrences";

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
    items: snapshot.items.map((item) => {
      const rawOccurrences = getRawOccurrences(item);
      return {
        ...item,
        sourceIds: [...item.sourceIds],
        rawCount: rawOccurrences.reduce((total, occurrence) => total + occurrence.count, 0),
        rawOccurrences,
      };
    }),
    sourceHealth: Object.fromEntries(
      Object.entries(snapshot.sourceHealth).map(([sourceId, value]) => [sourceId, { ...value }]),
    ) as Record<string, SourceHealth>,
  };
}

export function withFreshness(snapshot: FeedSnapshot, freshness: FeedFreshness): FeedSnapshot {
  const cloned = cloneSnapshot(snapshot);
  cloned.origin = freshness;
  for (const item of cloned.items) {
    item.freshness = freshness;
  }
  return cloned;
}
