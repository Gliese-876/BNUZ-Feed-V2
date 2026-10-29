import type { FeedItem, FeedSnapshot } from "@bnuz-feed/contracts";
import { splitFeedItemsBySource } from "@bnuz-feed/core";

/** Compare source-scoped content, not the winning public alias's generated ID. */
export function retainedSourceContent(snapshot: FeedSnapshot, sourceId: string, campusIds: readonly string[]): string[] {
  const sharedIds = new Map(snapshot.items.filter((item) => item.sourceIds.includes(sourceId) &&
    item.sourceIds.some((id) => !campusIds.includes(id))).map((item) => [item.id, [...item.sourceIds].sort()]));
  const items = splitFeedItemsBySource(snapshot.items).get(sourceId) ?? [];
  return items.map(({ fetchedAt: _fetchedAt, freshness: _freshness, ...item }: FeedItem) => {
    if (!sharedIds.has(item.id)) return JSON.stringify(item);
    // The deduper intentionally merges HTTP/HTTPS aliases. Its preferred public
    // record may change each fetch; all remaining source-scoped fields must match.
    const { id: _derivedId, ...content } = item;
    return JSON.stringify({ ...content, url: content.url.replace(/^https?:\/\//i, "//"), sharedSourceIds: sharedIds.get(item.id) });
  }).sort();
}
