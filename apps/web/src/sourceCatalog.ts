import type { FeedItem, SourceDescriptor } from "@bnuz-feed/contracts";
import { getRawOccurrences } from "@bnuz-feed/core";
import { publicBnuzhSources } from "@bnuz-feed/source-registry/catalog";

export const defaultChannelLabel = "全部内容";

export interface SourceChannelNode {
  label: string;
}

export interface SourceCatalogNode {
  id: string;
  name: string;
  fetchTargetCount: number;
  searchText: string;
  channels: SourceChannelNode[];
}

export interface FeedItemStats {
  sourceCounts: Record<string, number>;
  channelCounts: Record<string, number>;
}

function normalizeChannelLabel(value: string | undefined): string {
  return value?.trim() || defaultChannelLabel;
}

function buildSourceChannels(source: SourceDescriptor): SourceChannelNode[] {
  const labels = new Set((source.fetchTargets ?? []).map((target) =>
    normalizeChannelLabel(target.channel),
  ));
  return [...labels].map((label) => ({ label }));
}

export function buildChannelKey(sourceId: string, channelLabel: string): string {
  return `${sourceId}::${normalizeChannelLabel(channelLabel)}`;
}

export function buildItemStats(items: FeedItem[]): FeedItemStats {
  const sourceCounts: Record<string, number> = {};
  const channelCounts: Record<string, number> = {};

  for (const item of items) {
    for (const occurrence of getRawOccurrences(item)) {
      sourceCounts[occurrence.sourceId] = (sourceCounts[occurrence.sourceId] ?? 0) + occurrence.count;
      const channelKey = buildChannelKey(
        occurrence.sourceId,
        occurrence.channel ?? defaultChannelLabel,
      );
      channelCounts[channelKey] = (channelCounts[channelKey] ?? 0) + occurrence.count;
    }
  }

  return { sourceCounts, channelCounts };
}

export function countVisibleRawItems(
  items: FeedItem[],
  selectedSourceSet: ReadonlySet<string>,
  selectedChannelSet: ReadonlySet<string>,
): number {
  let total = 0;

  for (const item of items) {
    for (const occurrence of getRawOccurrences(item)) {
      if (!selectedSourceSet.has(occurrence.sourceId)) {
        continue;
      }

      const channelKey = buildChannelKey(
        occurrence.sourceId,
        occurrence.channel ?? defaultChannelLabel,
      );

      if (!selectedChannelSet.has(channelKey)) {
        continue;
      }

      total += occurrence.count;
    }
  }

  return total;
}

export const sourceCatalog: SourceCatalogNode[] = publicBnuzhSources.map((source) => {
  const channels = buildSourceChannels(source);

  return {
    id: source.id,
    name: source.name,
    fetchTargetCount: source.fetchTargets?.length ?? source.entryUrls.length,
    searchText: [source.name, channels.map((channel) => channel.label).join(" ")]
      .join(" ")
      .toLowerCase(),
    channels,
  };
});

export const totalSourceChannelCount = sourceCatalog.reduce(
  (total, source) => total + source.channels.length,
  0,
);

export const sourceCatalogById = Object.fromEntries(
  sourceCatalog.map((source) => [source.id, source]),
) as Record<string, SourceCatalogNode>;
