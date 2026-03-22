import type { FeedItem } from "@bnuz-feed/contracts";

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
    const channelLabel = item.channel?.trim() || defaultChannelLabel;
    const sourceNames = item.sourceIds
      .map((sourceId) => sourceNamesById[sourceId] ?? sourceId)
      .join(" ");
    const searchableText = [item.title, item.summary, channelLabel, sourceNames]
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
      const selected = entry.item.sourceIds.some(
        (sourceId) =>
          selectedSourceSet.has(sourceId) &&
          selectedChannelSet.has(buildChannelKey(sourceId, entry.channelLabel)),
      );

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
