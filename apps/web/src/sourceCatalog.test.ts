import { describe, expect, it } from "vitest";

import type { FeedItem } from "@bnuz-feed/contracts";

import { buildChannelKey, buildItemStats, countVisibleRawItems } from "./sourceCatalog";

const items: FeedItem[] = [
  {
    id: "item-1",
    sourceId: "source-a",
    sourceIds: ["source-a", "source-b"],
    title: "教务通知",
    channel: "通知公告",
    url: "https://example.com/1",
    fetchedAt: "2026-03-29T00:00:00.000Z",
    freshness: "snapshot",
    rawCount: 3,
    rawOccurrences: [
      { sourceId: "source-a", channel: "通知公告", count: 2 },
      { sourceId: "source-b", channel: "通知公告", count: 1 },
    ],
  },
  {
    id: "item-2",
    sourceId: "source-a",
    sourceIds: ["source-a"],
    title: "新闻速递",
    channel: "新闻速递",
    url: "https://example.com/2",
    fetchedAt: "2026-03-29T00:00:00.000Z",
    freshness: "snapshot",
    rawCount: 1,
    rawOccurrences: [{ sourceId: "source-a", channel: "新闻速递", count: 1 }],
  },
];

describe("sourceCatalog counters", () => {
  it("uses pre-deduplication counts for source and channel totals", () => {
    const stats = buildItemStats(items);

    expect(stats.sourceCounts["source-a"]).toBe(3);
    expect(stats.sourceCounts["source-b"]).toBe(1);
    expect(stats.channelCounts[buildChannelKey("source-a", "通知公告")]).toBe(2);
    expect(stats.channelCounts[buildChannelKey("source-b", "通知公告")]).toBe(1);
    expect(stats.channelCounts[buildChannelKey("source-a", "新闻速递")]).toBe(1);
  });

  it("counts visible raw items against the active source and channel filters", () => {
    const rawCount = countVisibleRawItems(
      items,
      new Set(["source-a"]),
      new Set([buildChannelKey("source-a", "通知公告")]),
    );

    expect(rawCount).toBe(2);
  });
});
