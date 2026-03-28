import type { FeedItem, FeedItemOccurrence, SourceId } from "@bnuz-feed/contracts";

function normalizeOccurrenceCount(value: number | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 1;
  }

  return Math.max(1, Math.floor(value));
}

export function normalizeOccurrenceChannel(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

export function createRawOccurrence(
  sourceId: SourceId,
  channel?: string,
  count = 1,
): FeedItemOccurrence {
  return {
    sourceId,
    channel: normalizeOccurrenceChannel(channel),
    count: normalizeOccurrenceCount(count),
  };
}

export function cloneRawOccurrences(
  occurrences: FeedItemOccurrence[] | undefined,
): FeedItemOccurrence[] | undefined {
  if (!occurrences || occurrences.length === 0) {
    return undefined;
  }

  return occurrences.map((occurrence) => ({
    sourceId: occurrence.sourceId,
    channel: normalizeOccurrenceChannel(occurrence.channel),
    count: normalizeOccurrenceCount(occurrence.count),
  }));
}

export function mergeRawOccurrences(
  ...occurrenceGroups: Array<FeedItemOccurrence[] | undefined>
): FeedItemOccurrence[] {
  const merged = new Map<string, FeedItemOccurrence>();

  for (const occurrences of occurrenceGroups) {
    if (!occurrences) {
      continue;
    }

    for (const occurrence of occurrences) {
      const normalized = createRawOccurrence(
        occurrence.sourceId,
        occurrence.channel,
        occurrence.count,
      );
      const key = `${normalized.sourceId}\u0000${normalized.channel ?? ""}`;
      const existing = merged.get(key);

      if (existing) {
        existing.count += normalized.count;
        continue;
      }

      merged.set(key, normalized);
    }
  }

  return [...merged.values()];
}

export function getRawOccurrences(item: FeedItem): FeedItemOccurrence[] {
  if (item.rawOccurrences && item.rawOccurrences.length > 0) {
    return mergeRawOccurrences(item.rawOccurrences);
  }

  const sourceIds = item.sourceIds.length > 0 ? item.sourceIds : [item.sourceId];

  if (sourceIds.length <= 1) {
    return [createRawOccurrence(sourceIds[0] ?? item.sourceId, item.channel, item.rawCount ?? 1)];
  }

  return sourceIds.map((sourceId) => createRawOccurrence(sourceId, item.channel, 1));
}

export function getRawCount(item: FeedItem): number {
  return getRawOccurrences(item).reduce((total, occurrence) => total + occurrence.count, 0);
}

export function sumRawItemCounts(items: FeedItem[]): number {
  return items.reduce((total, item) => total + getRawCount(item), 0);
}

export function createSourceScopedItem(item: FeedItem, sourceId: SourceId): FeedItem {
  const rawOccurrences = getRawOccurrences(item).filter(
    (occurrence) => occurrence.sourceId === sourceId,
  );

  return {
    ...item,
    sourceId,
    sourceIds: [sourceId],
    rawCount: rawOccurrences.reduce((total, occurrence) => total + occurrence.count, 0),
    rawOccurrences,
  };
}
