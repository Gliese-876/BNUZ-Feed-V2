import { describe, expect, it } from "vitest";

import type { FeedItem } from "@bnuz-feed/contracts";

import { buildChannelKey, buildItemStats, countVisibleRawItems } from "./sourceCatalog";

const items: FeedItem[] = [
  {
    id: "item-1",
    sourceId: "source-a",
    sourceIds: ["source-a", "source-b"],
    title: "鏁欏姟閫氱煡",
    channel: "閫氱煡鍏憡",
    url: "https://example.com/1",
    fetchedAt: "2026-03-29T00:00:00.000Z",
    freshness: "snapshot",
    rawCount: 3,
    rawOccurrences: [
      { sourceId: "source-a", channel: "閫氱煡鍏憡", count: 2 },
      { sourceId: "source-b", channel: "閫氱煡鍏憡", count: 1 },
    ],
  },
  {
    id: "item-2",
    sourceId: "source-a",
    sourceIds: ["source-a"],
    title: "鏂伴椈閫熼€?",
    channel: "鏂伴椈閫熼€?",
    url: "https://example.com/2",
    fetchedAt: "2026-03-29T00:00:00.000Z",
    freshness: "snapshot",
    rawCount: 1,
    rawOccurrences: [{ sourceId: "source-a", channel: "鏂伴椈閫熼€?", count: 1 }],
  },
];

describe("sourceCatalog counters", () => {
  it("uses pre-deduplication counts for source and channel totals", () => {
    const stats = buildItemStats(items);

    expect(stats.sourceCounts["source-a"]).toBe(3);
    expect(stats.sourceCounts["source-b"]).toBe(1);
    expect(stats.channelCounts[buildChannelKey("source-a", "閫氱煡鍏憡")]).toBe(2);
    expect(stats.channelCounts[buildChannelKey("source-b", "閫氱煡鍏憡")]).toBe(1);
    expect(stats.channelCounts[buildChannelKey("source-a", "鏂伴椈閫熼€?")]).toBe(1);
  });

  it("counts visible raw items against the active source and channel filters", () => {
    const rawCount = countVisibleRawItems(
      items,
      new Set(["source-a"]),
      new Set([buildChannelKey("source-a", "閫氱煡鍏憡")]),
    );

    expect(rawCount).toBe(2);
  });
});
