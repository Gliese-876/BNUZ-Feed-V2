import type { FeedSnapshot } from "@bnuz-feed/contracts";
import { dedupeFeedItems, splitFeedItemsBySource, sumRawItemCounts } from "@bnuz-feed/core";

/** Preserve campus data without presenting a public CI run as a successful campus refresh. */
export function retainCampusSources(
  refreshed: FeedSnapshot,
  previous: FeedSnapshot,
  sourceIds: readonly string[],
): FeedSnapshot {
  const previousItems = splitFeedItemsBySource(previous.items);
  const sourceHealth = { ...refreshed.sourceHealth };
  const retainedItems = sourceIds.flatMap((sourceId) => {
    const health = previous.sourceHealth[sourceId];
    const items = previousItems.get(sourceId);
    const lastSuccessAt = health?.lastSuccessAt ?? health?.checkedAt;
    if (!health || !["live", "snapshot"].includes(health.status) || !items?.length ||
      !lastSuccessAt || !Number.isFinite(Date.parse(lastSuccessAt))) {
      throw new Error(`Campus source ${sourceId} has no valid previous snapshot.`);
    }
    if (refreshed.sourceHealth[sourceId]) {
      throw new Error(`Campus source ${sourceId} was both refreshed and retained.`);
    }
    sourceHealth[sourceId] = {
      ...health, status: "snapshot", lastSuccessAt, itemCount: sumRawItemCounts(items),
      message: `Campus network only. Retained data from ${lastSuccessAt}.`,
      errorCode: undefined,
    };
    return items.map((item) => ({ ...item, freshness: "snapshot" as const }));
  });
  return { ...refreshed, sourceHealth, items: dedupeFeedItems([...refreshed.items, ...retainedItems]) };
}
