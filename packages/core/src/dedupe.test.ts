import { describe, expect, it } from "vitest";

import type { FeedItem } from "@bnuz-feed/contracts";

import { dedupeFeedItems, sortFeedItems } from "./dedupe";
import { splitFeedItemsBySource } from "./rawOccurrences";

function createItem(overrides: Partial<FeedItem>): FeedItem {
  return {
    id: "item-1",
    sourceId: "source-a",
    sourceIds: ["source-a"],
    title: "示例标题",
    url: "https://example.com/story.htm",
    publishedAt: "2026-03-29",
    channel: "通知公告",
    summary: "summary",
    fetchedAt: "2026-03-29T00:00:00.000Z",
    freshness: "live",
    ...overrides,
  };
}

describe("dedupeFeedItems", () => {
  it("merges items with identical ids", () => {
    const items = dedupeFeedItems([
      createItem({
        id: "same-id",
        sourceId: "source-a",
        sourceIds: ["source-a"],
        freshness: "cache",
      }),
      createItem({
        id: "same-id",
        sourceId: "source-b",
        sourceIds: ["source-b"],
        freshness: "live",
      }),
    ]);

    expect(items).toHaveLength(1);
    expect(items[0]?.freshness).toBe("live");
    expect(items[0]?.sourceIds.sort()).toEqual(["source-a", "source-b"]);
    expect(items[0]?.rawCount).toBe(2);
    expect(items[0]?.rawOccurrences).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ sourceId: "source-a", count: 1 }),
        expect.objectContaining({ sourceId: "source-b", count: 1 }),
      ]),
    );
  });

  it("merges items with different ids when normalized url and title are the same", () => {
    const items = dedupeFeedItems([
      createItem({
        id: "older-item",
        sourceId: "source-a",
        sourceIds: ["source-a"],
        publishedAt: "2026-03-28",
        fetchedAt: "2026-03-28T00:00:00.000Z",
      }),
      createItem({
        id: "newer-item",
        sourceId: "source-b",
        sourceIds: ["source-b"],
        publishedAt: undefined,
        fetchedAt: "2026-03-29T00:00:00.000Z",
      }),
    ]);

    expect(items).toHaveLength(1);
    expect(items[0]?.id).toBe("older-item");
    expect(items[0]?.sourceIds.sort()).toEqual(["source-a", "source-b"]);
    expect(items[0]?.rawCount).toBe(2);
  });

  it("treats http and https variants of the same article as duplicates", () => {
    const items = dedupeFeedItems([
      createItem({
        id: "http-item",
        url: "http://www.bnuzh.edu.cn//xqtt/story.htm",
      }),
      createItem({
        id: "https-item",
        sourceId: "source-b",
        sourceIds: ["source-b"],
        url: "https://www.bnuzh.edu.cn/xqtt/story.htm",
      }),
    ]);

    expect(items).toHaveLength(1);
    expect(items[0]?.sourceIds.sort()).toEqual(["source-a", "source-b"]);
  });

  it("does not merge different items that share only the same url", () => {
    const items = dedupeFeedItems([
      createItem({
        id: "notice-a",
        title: "通知 A",
        url: "https://one.bnuzh.edu.cn/up/view?m=pim",
      }),
      createItem({
        id: "notice-b",
        sourceId: "source-b",
        sourceIds: ["source-b"],
        title: "通知 B",
        url: "https://one.bnuzh.edu.cn/up/view?m=pim",
      }),
    ]);

    expect(items).toHaveLength(2);
  });

  it("tracks repeated raw records from the same source", () => {
    const items = dedupeFeedItems([
      createItem({
        id: "repeat-a",
        rawCount: 1,
        rawOccurrences: [{ sourceId: "source-a", channel: "閫氱煡鍏憡", count: 1 }],
      }),
      createItem({
        id: "repeat-b",
        rawCount: 1,
        rawOccurrences: [{ sourceId: "source-a", channel: "閫氱煡鍏憡", count: 1 }],
      }),
    ]);

    expect(items).toHaveLength(1);
    expect(items[0]?.rawCount).toBe(2);
    expect(items[0]?.rawOccurrences).toEqual([
      { sourceId: "source-a", channel: "閫氱煡鍏憡", count: 2 },
    ]);
  });

  it("does not downgrade live data when a cached duplicate has a later date", () => {
    const items = dedupeFeedItems([
      createItem({ freshness: "live", publishedAt: "2026-03-28" }),
      createItem({ freshness: "cache", publishedAt: "2026-03-30" }),
    ]);
    expect(items[0]?.freshness).toBe("live");
  });

  it("merges retry revisions without recounting already observed occurrences", () => {
    const items = dedupeFeedItems([
      createItem({ rawOccurrences: [{ sourceId: "source-a", channel: "news", count: 2 }] }),
      createItem({ rawOccurrences: [
        { sourceId: "source-a", channel: "news", count: 1 },
        { sourceId: "source-a", channel: "announcements", count: 1 },
      ] }),
    ], "max");
    expect(items[0]?.rawCount).toBe(3);
  });

  it("keeps URL ports and escaped query values distinct", () => {
    const items = dedupeFeedItems([
      createItem({ id: "one", url: "https://example.com/story?a=x%26b%3Dy" }),
      createItem({ id: "two", url: "https://example.com/story?a=x&b=y" }),
      createItem({ id: "three", url: "https://example.com:8080/story?a=x&b=y" }),
    ]);
    expect(items).toHaveLength(3);
  });

  it("sorts invalid dates consistently without changing the input array", () => {
    const items = [
      createItem({ id: "invalid", publishedAt: "invalid" }),
      createItem({ id: "valid", publishedAt: "2026-04-01" }),
    ];
    expect(sortFeedItems(items).map((item) => item.id)).toEqual(["valid", "invalid"]);
    expect(items[0]?.id).toBe("invalid");
  });

  it("does not invent a year when sorting month-day dates", () => {
    const items = [
      createItem({ id: "partial", publishedAt: "12-30", fetchedAt: "2026-10-12T01:00:00Z" }),
      createItem({ id: "undated", publishedAt: undefined, fetchedAt: "2026-10-12T02:00:00Z" }),
      createItem({ id: "dated", publishedAt: "2000-01-01" }),
    ];
    expect(sortFeedItems(items).map((item) => item.id)).toEqual(["dated", "undated", "partial"]);
  });

  it("splits occurrences by their source and retains the source's channel", () => {
    const item = createItem({
      sourceIds: ["source-a", "source-b"],
      rawOccurrences: [
        { sourceId: "source-a", channel: "news", count: 2 },
        { sourceId: "source-b", channel: "announcements", count: 1 },
      ],
    });
    const grouped = splitFeedItemsBySource([item]);
    expect(grouped.get("source-a")?.[0]).toMatchObject({ channel: "news", rawCount: 2 });
    expect(grouped.get("source-b")?.[0]).toMatchObject({ channel: "announcements", rawCount: 1 });
    expect(dedupeFeedItems([...grouped.values()].flat())[0]?.rawCount).toBe(3);
  });
});
