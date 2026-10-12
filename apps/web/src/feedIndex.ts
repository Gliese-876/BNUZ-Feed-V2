import type { FeedItem } from "@bnuz-feed/contracts";
import { getRawOccurrences } from "@bnuz-feed/core";

import { buildChannelKey, defaultChannelLabel } from "./sourceCatalog";

export interface IndexedFeedItem {
  item: FeedItem;
  searchableText: string;
  selections: { sourceId: string; channelKey: string }[];
}

export function buildFeedIndex(
  items: FeedItem[],
  sourceNamesById: Record<string, string>,
): IndexedFeedItem[] {
  return items.map((item) => {
    const rawOccurrences = getRawOccurrences(item);
    const channelLabels = [
      ...new Set(rawOccurrences.map((occurrence) => occurrence.channel?.trim() || defaultChannelLabel)),
    ];
    const sourceNames = [
      ...new Set(
        rawOccurrences.map((occurrence) => sourceNamesById[occurrence.sourceId] ?? occurrence.sourceId),
      ),
    ].join(" ");
    const searchableText = [item.title, item.summary, channelLabels.join(" "), sourceNames]
      .filter((value) => typeof value === "string" && value.trim().length > 0)
      .join(" ")
      .toLowerCase();

    return {
      item,
      searchableText,
      selections: rawOccurrences.map(({ sourceId, channel }) => ({
        sourceId,
        channelKey: buildChannelKey(sourceId, channel ?? defaultChannelLabel),
      })),
    };
  });
}

export function filterFeedIndex(
  indexedItems: IndexedFeedItem[],
  selectedSourceSet: ReadonlySet<string>,
  selectedChannelSet: ReadonlySet<string>,
  query: string,
): FeedItem[] {
  if (selectedSourceSet.size === 0 || selectedChannelSet.size === 0) {
    return [];
  }

  const normalizedQuery = query.trim().toLowerCase();

  const result: FeedItem[] = [];
  for (const entry of indexedItems) {
    if (normalizedQuery && !entry.searchableText.includes(normalizedQuery)) continue;
    if (entry.selections.some(({ sourceId, channelKey }) =>
      selectedSourceSet.has(sourceId) && selectedChannelSet.has(channelKey),
    )) result.push(entry.item);
  }
  return result;
}
