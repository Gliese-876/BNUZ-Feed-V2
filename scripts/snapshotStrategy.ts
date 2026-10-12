import { dedupeFeedItems, splitFeedItemsBySource } from "@bnuz-feed/core";
import type { FeedSnapshot, SourceDescriptor, SourceId } from "@bnuz-feed/contracts";

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

export function getUnhealthySourceIds(
  snapshot: FeedSnapshot,
  sourceIds = Object.keys(snapshot.sourceHealth),
): SourceId[] {
  return sourceIds.filter((sourceId) => snapshot.sourceHealth[sourceId]?.status !== "live");
}

export function mergeSourceSnapshots(
  baseSnapshot: FeedSnapshot,
  nextSnapshot: FeedSnapshot,
  sourceIds: SourceId[],
): FeedSnapshot {
  if (sourceIds.length === 0) {
    return baseSnapshot;
  }

  const mergedItemsBySource = splitFeedItemsBySource(baseSnapshot.items);
  const nextItemsBySource = splitFeedItemsBySource(nextSnapshot.items);
  const sourceHealth = { ...baseSnapshot.sourceHealth };

  for (const sourceId of sourceIds) {
    mergedItemsBySource.set(sourceId, nextItemsBySource.get(sourceId) ?? []);
    const health = nextSnapshot.sourceHealth[sourceId];
    if (health) {
      sourceHealth[sourceId] = health;
    } else {
      delete sourceHealth[sourceId];
    }
  }

  return {
    version: Math.max(baseSnapshot.version, nextSnapshot.version),
    updatedAt: nextSnapshot.updatedAt,
    origin: nextSnapshot.origin,
    items: dedupeFeedItems([...mergedItemsBySource.values()].flat()),
    sourceHealth,
  };
}

export async function executeSnapshotStrategy(options: SnapshotStrategyOptions): Promise<FeedSnapshot> {
  const sources = options.sources.filter((source) => source.enabled);
  if (sources.length === 0) {
    throw new Error("Snapshot requires at least one enabled source.");
  }

  const sourceIds = sources.map((source) => source.id);
  let pendingSources = sources;
  let snapshot: FeedSnapshot | undefined;

  for (let round = 1; round <= options.roundLimit; round += 1) {
    const nodeSnapshot = await options.runPhase("node", pendingSources, options.nodeMaxAttempts);
    snapshot = snapshot
      ? mergeSourceSnapshots(snapshot, nodeSnapshot, pendingSources.map((source) => source.id))
      : nodeSnapshot;
    let unhealthySourceIds = getUnhealthySourceIds(snapshot, sourceIds);
    let browserAttempted = false;

    if (unhealthySourceIds.length > 0 && options.browserMaxAttempts > 0) {
      const unhealthyIds = new Set(unhealthySourceIds);
      const retrySources = sources.filter((source) => unhealthyIds.has(source.id));

      if (retrySources.length > 0) {
        browserAttempted = true;
        const browserSnapshot = await options.runPhase("browser", retrySources, options.browserMaxAttempts);
        snapshot = mergeSourceSnapshots(snapshot, browserSnapshot, retrySources.map((source) => source.id));
        unhealthySourceIds = getUnhealthySourceIds(snapshot, sourceIds);
      }
    }

    options.onRoundComplete?.({
      round,
      snapshot,
      unhealthySourceIds,
      browserAttempted,
    });

    if (unhealthySourceIds.length === 0) {
      return snapshot;
    }

    const unhealthyIds = new Set(unhealthySourceIds);
    pendingSources = sources.filter((source) => unhealthyIds.has(source.id));
  }

  throw new Error(`Snapshot did not converge within ${options.roundLimit} rounds.`);
}
