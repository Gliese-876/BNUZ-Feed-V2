import type {
  AggregationService,
  FeedItem,
  FeedSnapshot,
  FeedSource,
  Repository,
  SourceId,
} from "@bnuz-feed/contracts";

import { dedupeFeedItems } from "./dedupe";
import { createSourceScopedItem } from "./rawOccurrences";
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
  let itemsBySource = new Map<SourceId, FeedItem[]>();

  function explodeSnapshotItems(snapshot: FeedSnapshot): Map<SourceId, FeedItem[]> {
    const nextItemsBySource = new Map<SourceId, FeedItem[]>();

    for (const item of snapshot.items) {
      const sourceIds = item.sourceIds.length > 0 ? item.sourceIds : [item.sourceId];

      for (const sourceId of sourceIds) {
        const sourceItems = nextItemsBySource.get(sourceId) ?? [];
        sourceItems.push(createSourceScopedItem(item, sourceId));
        nextItemsBySource.set(sourceId, sourceItems);
      }
    }

    return nextItemsBySource;
  }

  function syncSourceItems(snapshot: FeedSnapshot) {
    itemsBySource = explodeSnapshotItems(snapshot);
  }

  function buildMergedSnapshot(
    baseSnapshot: FeedSnapshot | null,
    nextSnapshot: FeedSnapshot,
    sourceIds?: SourceId[],
  ): FeedSnapshot {
    if (!baseSnapshot || !sourceIds || sourceIds.length === 0) {
      syncSourceItems(nextSnapshot);
      return cloneSnapshot(nextSnapshot);
    }

    const mergedItemsBySource = new Map(itemsBySource);
    for (const sourceId of sourceIds) {
      mergedItemsBySource.delete(sourceId);
    }

    const partialItemsBySource = explodeSnapshotItems(nextSnapshot);
    for (const [sourceId, sourceItems] of partialItemsBySource) {
      mergedItemsBySource.set(sourceId, sourceItems);
    }

    itemsBySource = mergedItemsBySource;

    return {
      version: Math.max(baseSnapshot.version, nextSnapshot.version),
      updatedAt: nextSnapshot.updatedAt,
      origin: nextSnapshot.origin,
      items: dedupeFeedItems([...mergedItemsBySource.values()].flat()),
        sourceHealth: {
          ...baseSnapshot.sourceHealth,
          ...nextSnapshot.sourceHealth,
        },
    };
  }

  function emit() {
    for (const listener of listeners) {
      listener();
    }
  }

  function isEffectivelyEmpty(snapshot: FeedSnapshot): boolean {
    return snapshot.items.length === 0;
  }

  async function applySnapshot(snapshot: FeedSnapshot, persist = false): Promise<FeedSnapshot> {
    currentSnapshot = cloneSnapshot(snapshot);
    syncSourceItems(currentSnapshot);

    if (persist) {
      await options.repository.save(currentSnapshot);
    }

    emit();
    return currentSnapshot;
  }

  async function loadPrimary(): Promise<FeedSnapshot | null> {
    if (!options.primary.bootstrap) {
      return null;
    }

    const snapshot = await options.primary.bootstrap();
    if (!snapshot) {
      return null;
    }

    return applySnapshot(snapshot, true);
  }

  async function loadFallback(): Promise<FeedSnapshot | null> {
    if (!options.fallback) {
      return null;
    }

    const snapshot = (await options.fallback.bootstrap?.()) ?? (await options.fallback.refresh());
    return applySnapshot(snapshot, true);
  }

  return {
    async bootstrap() {
      if (currentSnapshot) {
        return cloneSnapshot(currentSnapshot);
      }

      const cached = await options.repository.load();

      if (cached) {
        const cachedSnapshot = withFreshness(cached, "cache");

        if (!isEffectivelyEmpty(cachedSnapshot)) {
          currentSnapshot = cachedSnapshot;
          syncSourceItems(currentSnapshot);
          emit();
          return cloneSnapshot(currentSnapshot);
        }

        try {
          const primarySnapshot = await loadPrimary();
          if (primarySnapshot) {
            return cloneSnapshot(primarySnapshot);
          }
        } catch {
          // Fall back to the cached snapshot when the primary source is unavailable.
        }

        currentSnapshot = cachedSnapshot;
        syncSourceItems(currentSnapshot);
        emit();
        return cloneSnapshot(currentSnapshot);
      }

      try {
        const primarySnapshot = await loadPrimary();
        if (primarySnapshot) {
          return cloneSnapshot(primarySnapshot);
        }
      } catch {
        // Fall through to the configured fallback source.
      }

      const fallbackSnapshot = await loadFallback();
      return fallbackSnapshot ? cloneSnapshot(fallbackSnapshot) : null;
    },

    async refresh(sourceIds?: SourceId[]) {
      try {
        const liveSnapshot = await options.primary.refresh(sourceIds);
        currentSnapshot = buildMergedSnapshot(currentSnapshot, liveSnapshot, sourceIds);
        await options.repository.save(currentSnapshot);
        emit();
        return cloneSnapshot(currentSnapshot);
      } catch (error) {
        if (currentSnapshot) {
          return cloneSnapshot(currentSnapshot);
        }

        const fallbackSnapshot = await loadFallback();
        if (fallbackSnapshot) {
          return cloneSnapshot(fallbackSnapshot);
        }

        throw error;
      }
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
