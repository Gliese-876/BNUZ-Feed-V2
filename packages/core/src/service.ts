import {
  AggregationError,
  type AggregationService,
  type FeedSnapshot,
  type FeedSource,
  type Repository,
  type SourceId,
} from "@bnuz-feed/contracts";

import { dedupeFeedItems } from "./dedupe";
import { splitFeedItemsBySource } from "./rawOccurrences";
import { cloneSnapshot, withFreshness } from "./snapshot";

export interface LayeredAggregationServiceOptions {
  primary: FeedSource;
  repository: Repository;
  fallback?: FeedSource;
}

export function createLayeredAggregationService(
  options: LayeredAggregationServiceOptions,
): AggregationService {
  const listeners = new Set<() => void>();
  let currentSnapshot: FeedSnapshot | null = null;
  let pending = Promise.resolve();
  let bootstrapping: Promise<FeedSnapshot | null> | null = null;

  // Bootstrap and refresh must commit in request order, including partial refreshes.
  function enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const result = pending.then(operation);
    pending = result.then(() => undefined, () => undefined);
    return result;
  }

  async function applySnapshot(snapshot: FeedSnapshot, persist = false): Promise<FeedSnapshot> {
    currentSnapshot = cloneSnapshot(snapshot);
    if (persist) {
      try {
        await options.repository.save(currentSnapshot);
      } catch {
        // Cache availability must not turn a successful fetch into a failed refresh.
      }
    }
    for (const listener of listeners) {
      listener();
    }
    return cloneSnapshot(currentSnapshot);
  }

  async function loadFallback(): Promise<FeedSnapshot | null> {
    const fallback = options.fallback;
    if (!fallback) {
      return null;
    }
    const snapshot = (await fallback.bootstrap?.()) ?? (await fallback.refresh());
    return applySnapshot(snapshot, true);
  }

  async function bootstrap(): Promise<FeedSnapshot | null> {
    if (currentSnapshot) {
      return cloneSnapshot(currentSnapshot);
    }

    let cached: FeedSnapshot | null = null;
    try {
      cached = await options.repository.load();
    } catch {
      // Continue with the source when the cache cannot be read.
    }
    if (cached?.items.length) {
      return applySnapshot(withFreshness(cached, "cache"));
    }

    let primaryFailure: { error: unknown } | undefined;
    try {
      const snapshot = await options.primary.bootstrap?.();
      if (snapshot) {
        return applySnapshot(snapshot, true);
      }
    } catch (error) {
      primaryFailure = { error };
      // Continue with the cached snapshot or fallback source.
    }
    if (cached) {
      return applySnapshot(withFreshness(cached, "cache"));
    }
    const fallbackSnapshot = await loadFallback();
    if (!fallbackSnapshot && primaryFailure) {
      throw primaryFailure.error;
    }
    return fallbackSnapshot;
  }

  function mergeSnapshot(nextSnapshot: FeedSnapshot, sourceIds?: SourceId[]): FeedSnapshot {
    if (currentSnapshot && !sourceIds?.length && nextSnapshot.origin !== "live" &&
      Date.parse(nextSnapshot.updatedAt) < Date.parse(currentSnapshot.updatedAt)) {
      // An offline/CDN response must not replace newer readable data.
      return currentSnapshot;
    }
    if (!currentSnapshot || (!sourceIds?.length && nextSnapshot.origin !== "live")) {
      return nextSnapshot;
    }

    const previousItems = splitFeedItemsBySource(currentSnapshot.items);
    const nextItems = splitFeedItemsBySource(nextSnapshot.items);
    const partial = Boolean(sourceIds?.length);
    const mergedItems = partial ? new Map(previousItems) : new Map(nextItems);

    for (const sourceId of sourceIds ?? []) {
      mergedItems.delete(sourceId);
    }
    for (const [sourceId, items] of nextItems) {
      mergedItems.set(sourceId, items);
    }

    // A failed target should update health without erasing the last readable data.
    for (const [sourceId, health] of Object.entries(nextSnapshot.sourceHealth)) {
      const previous = previousItems.get(sourceId);
      if (!previous?.length || ["live", "snapshot", "cache"].includes(health.status)) {
        continue;
      }
      mergedItems.set(sourceId, dedupeFeedItems([...previous, ...(nextItems.get(sourceId) ?? [])], "max"));
    }

    return {
      ...nextSnapshot,
      version: Math.max(currentSnapshot.version, nextSnapshot.version),
      items: dedupeFeedItems([...mergedItems.values()].flat()),
      sourceHealth: partial
        ? { ...currentSnapshot.sourceHealth, ...nextSnapshot.sourceHealth }
        : nextSnapshot.sourceHealth,
    };
  }

  return {
    bootstrap() {
      if (currentSnapshot) {
        return Promise.resolve(cloneSnapshot(currentSnapshot));
      }
      bootstrapping ??= enqueue(bootstrap).finally(() => {
        bootstrapping = null;
      });
      return bootstrapping;
    },

    refresh(sourceIds) {
      return enqueue(async () => {
        try {
          const snapshot = await options.primary.refresh(sourceIds);
          const health = Object.values(snapshot.sourceHealth);
          if (
            snapshot.items.length === 0 &&
            health.length > 0 &&
            health.every((entry) => !["live", "cache", "snapshot"].includes(entry.status))
          ) {
            throw new AggregationError("FETCH_FAILED", "No source returned readable feed data.");
          }
          const merged = mergeSnapshot(snapshot, sourceIds);
          return merged === currentSnapshot ? cloneSnapshot(merged) : applySnapshot(merged, true);
        } catch (error) {
          if (currentSnapshot) {
            throw error;
          }
          const fallbackSnapshot = await loadFallback();
          if (fallbackSnapshot) {
            return fallbackSnapshot;
          }
          throw error;
        }
      });
    },

    getSnapshot() {
      return currentSnapshot ? cloneSnapshot(currentSnapshot) : null;
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
