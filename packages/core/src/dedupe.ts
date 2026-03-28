import type { FeedFreshness, FeedItem } from "@bnuz-feed/contracts";

import { getRawOccurrences, mergeRawOccurrences } from "./rawOccurrences";

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

function normalizeText(value: string | undefined): string {
  return (value ?? "").trim().replace(/\s+/g, " ");
}

function createLooseUrlKey(value: string): string {
  try {
    const url = new URL(value);
    const normalizedSearch = [...url.searchParams.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, itemValue]) => `${key}=${itemValue}`)
      .join("&");

    return [
      url.hostname.toLowerCase(),
      url.pathname.replace(/\/{2,}/g, "/"),
      normalizedSearch ? `?${normalizedSearch}` : "",
    ].join("");
  } catch {
    return value
      .trim()
      .replace(/^https?:\/\//i, "")
      .replace(/\/{2,}/g, "/");
  }
}

function createAliasKey(item: FeedItem): string | null {
  const normalizedTitle = normalizeText(item.title).toLowerCase();
  const normalizedUrl = createLooseUrlKey(item.url);

  if (!normalizedTitle || !normalizedUrl) {
    return null;
  }

  return `${normalizedUrl}|${normalizedTitle}`;
}

function mergeItems(left: FeedItem, right: FeedItem): FeedItem {
  const preferred = pickPreferredItem(left, right);
  const mergedSourceIds = [...new Set([...left.sourceIds, ...right.sourceIds])];
  const rawOccurrences = mergeRawOccurrences(getRawOccurrences(left), getRawOccurrences(right));
  const rawCount = rawOccurrences.reduce((total, occurrence) => total + occurrence.count, 0);

  return {
    ...preferred,
    sourceIds: mergedSourceIds,
    rawCount,
    rawOccurrences,
  };
}

function cloneItem(item: FeedItem): FeedItem {
  const rawOccurrences = getRawOccurrences(item);
  const rawCount = rawOccurrences.reduce((total, occurrence) => total + occurrence.count, 0);

  return {
    ...item,
    sourceIds: [...item.sourceIds],
    rawCount,
    rawOccurrences,
  };
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
  const byId = new Map<string, FeedItem>();

  for (const item of items) {
    const existing = byId.get(item.id);

    if (!existing) {
      byId.set(item.id, cloneItem(item));
      continue;
    }

    byId.set(item.id, mergeItems(existing, item));
  }

  const byAlias = new Map<string, FeedItem>();

  for (const item of byId.values()) {
    const aliasKey = createAliasKey(item) ?? item.id;
    const existing = byAlias.get(aliasKey);

    if (!existing) {
      byAlias.set(aliasKey, cloneItem(item));
      continue;
    }

    byAlias.set(aliasKey, mergeItems(existing, item));
  }

  return sortFeedItems([...byAlias.values()]);
}
