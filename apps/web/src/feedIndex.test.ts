import { describe, expect, it } from "vitest";

import type { FeedItem } from "@bnuz-feed/contracts";

import { buildFeedIndex, filterFeedIndex } from "./feedIndex";

const items: FeedItem[] = [
  {
    id: "item-1",
    sourceId: "source-a",
    sourceIds: ["source-a"],
    title: "教务通知",
    summary: "选课安排说明",
    channel: "通知公告",
    url: "https://example.com/1",
    fetchedAt: "2026-03-22T00:00:00.000Z",
    freshness: "snapshot",
  },
  {
    id: "item-2",
    sourceId: "source-b",
    sourceIds: ["source-b"],
    title: "国际交流讲座",
    summary: "海外交换经验分享",
    channel: "活动预告",
    url: "https://example.com/2",
    fetchedAt: "2026-03-22T00:00:00.000Z",
    freshness: "snapshot",
  },
];

describe("feedIndex", () => {
  it("builds a lowercase searchable index with source names", () => {
    const indexedItems = buildFeedIndex(items, {
      "source-a": "教务部",
      "source-b": "国际交流与合作办公室",
    });

    expect(indexedItems[0]?.searchableText).toContain("教务部");
    expect(indexedItems[1]?.searchableText).toContain("国际交流讲座");
  });

  it("filters indexed items by selection and keyword", () => {
    const indexedItems = buildFeedIndex(items, {
      "source-a": "教务部",
      "source-b": "国际交流与合作办公室",
    });

    const selectedSourceSet = new Set(["source-b"]);
    const selectedChannelSet = new Set(["source-b::活动预告"]);

    const filteredItems = filterFeedIndex(
      indexedItems,
      selectedSourceSet,
      selectedChannelSet,
      "交换",
    );

    expect(filteredItems).toHaveLength(1);
    expect(filteredItems[0]?.id).toBe("item-2");
  });
});
