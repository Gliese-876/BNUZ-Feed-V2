import type { FeedFreshness, FeedItem, FeedItemOccurrence } from "@bnuz-feed/contracts";

import { getRawOccurrences, mergeRawOccurrences } from "./rawOccurrences";

const freshnessRank: Record<FeedFreshness, number> = {
  snapshot: 0,
  cache: 1,
  live: 2,
};

function pickPreferredItem(left: FeedItem, right: FeedItem): FeedItem {
  if (left.freshness !== right.freshness) {
    return freshnessRank[right.freshness] > freshnessRank[left.freshness] ? right : left;
  }

  const leftPublished = timestamp(left.publishedAt);
  const rightPublished = timestamp(right.publishedAt);

  if (rightPublished > leftPublished) {
    return right;
  }

  return rightPublished === leftPublished && right.fetchedAt > left.fetchedAt ? right : left;
}

function timestamp(value: string | undefined): number {
  if (value && /^(?:--)?\d{1,2}[-/]\d{1,2}$/.test(value.trim())) return 0;
  const parsed = value ? Date.parse(value) : NaN;
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeText(value: string | undefined): string {
  return (value ?? "").trim().replace(/\s+/g, " ");
}

function createLooseUrlKey(value: string): string {
  try {
    const url = new URL(value);
    url.searchParams.sort();
    const normalizedSearch = url.searchParams.toString();

    return [
      url.host.toLowerCase(),
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

function mergeItems(left: FeedItem, right: FeedItem, occurrenceMode: "sum" | "max"): FeedItem {
  const preferred = pickPreferredItem(left, right);
  const mergedSourceIds = [...new Set([...left.sourceIds, ...right.sourceIds])];
  const leftOccurrences = getRawOccurrences(left);
  const rightOccurrences = getRawOccurrences(right);
  const rawOccurrences = occurrenceMode === "sum"
    ? mergeRawOccurrences(leftOccurrences, rightOccurrences)
    : mergeOccurrenceRevisions(leftOccurrences, rightOccurrences);
  const rawCount = rawOccurrences.reduce((total, occurrence) => total + occurrence.count, 0);

  return {
    ...preferred,
    sourceIds: mergedSourceIds,
    rawCount,
    rawOccurrences,
  };
}

function mergeOccurrenceRevisions(
  left: FeedItemOccurrence[],
  right: FeedItemOccurrence[],
): FeedItemOccurrence[] {
  const occurrences = new Map<string, FeedItemOccurrence>();
  for (const occurrence of [...left, ...right]) {
    const key = `${occurrence.sourceId}\u0000${occurrence.channel ?? ""}`;
    const previous = occurrences.get(key);
    if (!previous || previous.count < occurrence.count) {
      occurrences.set(key, occurrence);
    }
  }
  return [...occurrences.values()];
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
  return items
    .map((item) => ({ item, published: timestamp(item.publishedAt) }))
    .sort((left, right) =>
      right.published - left.published || right.item.fetchedAt.localeCompare(left.item.fetchedAt),
    )
    .map(({ item }) => item);
}

export function dedupeFeedItems(
  items: FeedItem[],
  occurrenceMode: "sum" | "max" = "sum",
): FeedItem[] {
  const byId = new Map<string, FeedItem>();

  for (const item of items) {
    const existing = byId.get(item.id);

    if (!existing) {
      byId.set(item.id, cloneItem(item));
      continue;
    }

    byId.set(item.id, mergeItems(existing, item, occurrenceMode));
  }

  const byAlias = new Map<string, FeedItem>();

  for (const item of byId.values()) {
    const aliasKey = createAliasKey(item) ?? item.id;
    const existing = byAlias.get(aliasKey);

    if (!existing) {
      byAlias.set(aliasKey, item);
      continue;
    }

    byAlias.set(aliasKey, mergeItems(existing, item, occurrenceMode));
  }

  return sortFeedItems([...byAlias.values()]);
}
