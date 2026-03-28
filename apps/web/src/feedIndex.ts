import type { FeedItem } from "@bnuz-feed/contracts";
import { getRawOccurrences } from "@bnuz-feed/core";

import { buildChannelKey, defaultChannelLabel } from "./sourceCatalog";

export interface IndexedFeedItem {
  item: FeedItem;
  channelLabel: string;
  searchableText: string;
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
    const channelLabel = channelLabels[0] ?? defaultChannelLabel;
    const searchableText = [item.title, item.summary, channelLabels.join(" "), sourceNames]
      .filter((value) => typeof value === "string" && value.trim().length > 0)
      .join(" ")
      .toLowerCase();

    return {
      item,
      channelLabel,
      searchableText,
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

  return indexedItems
    .filter((entry) => {
      const selected = getRawOccurrences(entry.item).some((occurrence) => {
        if (!selectedSourceSet.has(occurrence.sourceId)) {
          return false;
        }

        return selectedChannelSet.has(
          buildChannelKey(occurrence.sourceId, occurrence.channel ?? defaultChannelLabel),
        );
      });

      if (!selected) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return entry.searchableText.includes(normalizedQuery);
    })
    .map((entry) => entry.item);
}
