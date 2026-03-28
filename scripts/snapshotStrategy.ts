import { dedupeFeedItems } from "@bnuz-feed/core";
import type { FeedItem, FeedSnapshot, SourceDescriptor, SourceId } from "@bnuz-feed/contracts";

export type SnapshotPhase = "node" | "browser";

export interface SnapshotRoundResult {
  round: number;
  snapshot: FeedSnapshot;
  unhealthySourceIds: SourceId[];
  browserAttempted: boolean;
}

export interface SnapshotStrategyOptions {
  sources: SourceDescriptor[];
  nodeMaxAttempts: number;
  browserMaxAttempts: number;
  roundLimit: number;
  runPhase: (phase: SnapshotPhase, sources: SourceDescriptor[], maxAttempts: number) => Promise<FeedSnapshot>;
  onRoundComplete?: (result: SnapshotRoundResult) => void;
}

function explodeSnapshotItems(snapshot: FeedSnapshot): Map<SourceId, FeedItem[]> {
  const itemsBySource = new Map<SourceId, FeedItem[]>();

  for (const item of snapshot.items) {
    const sourceIds = item.sourceIds.length > 0 ? item.sourceIds : [item.sourceId];

    for (const sourceId of sourceIds) {
      const sourceItems = itemsBySource.get(sourceId) ?? [];
      sourceItems.push({
        ...item,
        sourceId,
        sourceIds: [sourceId],
      });
      itemsBySource.set(sourceId, sourceItems);
    }
  }

  return itemsBySource;
}

export function getUnhealthySourceIds(snapshot: FeedSnapshot): SourceId[] {
  return Object.values(snapshot.sourceHealth)
    .filter((entry) => entry.status !== "live")
    .map((entry) => entry.sourceId);
}

export function mergeSourceSnapshots(
  baseSnapshot: FeedSnapshot,
  nextSnapshot: FeedSnapshot,
  sourceIds: SourceId[],
): FeedSnapshot {
  if (sourceIds.length === 0) {
    return nextSnapshot;
  }

  const mergedItemsBySource = explodeSnapshotItems(baseSnapshot);

  for (const sourceId of sourceIds) {
    mergedItemsBySource.delete(sourceId);
  }

  const nextItemsBySource = explodeSnapshotItems(nextSnapshot);
  for (const [sourceId, sourceItems] of nextItemsBySource) {
    mergedItemsBySource.set(sourceId, sourceItems);
  }

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

export async function executeSnapshotStrategy(options: SnapshotStrategyOptions): Promise<FeedSnapshot> {
  for (let round = 1; round <= options.roundLimit; round += 1) {
    const nodeSnapshot = await options.runPhase("node", options.sources, options.nodeMaxAttempts);
    let roundSnapshot = nodeSnapshot;
    let unhealthySourceIds = getUnhealthySourceIds(roundSnapshot);
    let browserAttempted = false;

    if (unhealthySourceIds.length > 0 && options.browserMaxAttempts > 0) {
      browserAttempted = true;
      const retrySources = options.sources.filter((source) => unhealthySourceIds.includes(source.id));

      if (retrySources.length > 0) {
        const browserSnapshot = await options.runPhase("browser", retrySources, options.browserMaxAttempts);
        roundSnapshot = mergeSourceSnapshots(roundSnapshot, browserSnapshot, retrySources.map((source) => source.id));
        unhealthySourceIds = getUnhealthySourceIds(roundSnapshot);
      }
    }

    options.onRoundComplete?.({
      round,
      snapshot: roundSnapshot,
      unhealthySourceIds,
      browserAttempted,
    });

    if (unhealthySourceIds.length === 0) {
      return roundSnapshot;
    }
  }

  throw new Error(`Snapshot did not converge within ${options.roundLimit} full rounds.`);
}
