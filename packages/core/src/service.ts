import type { AggregationService, FeedSnapshot, FeedSource, Repository, SourceId } from "@bnuz-feed/contracts";

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

  function emit() {
    for (const listener of listeners) {
      listener();
    }
  }

  async function loadFallback(): Promise<FeedSnapshot | null> {
    if (!options.fallback) {
      return null;
    }

    const snapshot = (await options.fallback.bootstrap?.()) ?? (await options.fallback.refresh());

    currentSnapshot = cloneSnapshot(snapshot);
    emit();
    return currentSnapshot;
  }

  return {
    async bootstrap() {
      if (currentSnapshot) {
        return cloneSnapshot(currentSnapshot);
      }

      const cached = await options.repository.load();

      if (cached) {
        currentSnapshot = withFreshness(cached, "cache");
        emit();
        return cloneSnapshot(currentSnapshot);
      }

      return loadFallback();
    },

    async refresh(sourceIds?: SourceId[]) {
      try {
        const liveSnapshot = await options.primary.refresh(sourceIds);
        currentSnapshot = cloneSnapshot(liveSnapshot);
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
