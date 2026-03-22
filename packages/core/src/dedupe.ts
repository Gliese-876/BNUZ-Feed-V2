import type { FeedFreshness, FeedItem } from "@bnuz-feed/contracts";

const freshnessRank: Record<FeedFreshness, number> = {
  snapshot: 0,
  cache: 1,
  live: 2,
};

function pickPreferredItem(left: FeedItem, right: FeedItem): FeedItem {
  if (freshnessRank[right.freshness] > freshnessRank[left.freshness]) {
    return right;
  }

  const leftPublished = left.publishedAt ? Date.parse(left.publishedAt) : Number.NEGATIVE_INFINITY;
  const rightPublished = right.publishedAt ? Date.parse(right.publishedAt) : Number.NEGATIVE_INFINITY;

  if (rightPublished > leftPublished) {
    return right;
  }

  return left;
}

export function sortFeedItems(items: FeedItem[]): FeedItem[] {
  return [...items].sort((left, right) => {
    const leftPublished = left.publishedAt ? Date.parse(left.publishedAt) : 0;
    const rightPublished = right.publishedAt ? Date.parse(right.publishedAt) : 0;

    if (leftPublished !== rightPublished) {
      return rightPublished - leftPublished;
    }

    return right.fetchedAt.localeCompare(left.fetchedAt);
  });
}

export function dedupeFeedItems(items: FeedItem[]): FeedItem[] {
  const map = new Map<string, FeedItem>();

  for (const item of items) {
    const existing = map.get(item.id);

    if (!existing) {
      map.set(item.id, {
        ...item,
        sourceIds: [...item.sourceIds],
      });
      continue;
    }

    const preferred = pickPreferredItem(existing, item);
    const mergedSourceIds = [...new Set([...existing.sourceIds, ...item.sourceIds])];

    map.set(item.id, {
      ...preferred,
      sourceIds: mergedSourceIds,
    });
  }

  return sortFeedItems([...map.values()]);
}
