import { describe, expect, it } from "vitest";

import type { FeedItem } from "@bnuz-feed/contracts";

import { dedupeFeedItems } from "./dedupe";

function createItem(overrides: Partial<FeedItem>): FeedItem {
  return {
    id: "same-item",
    sourceId: "source-a",
    sourceIds: ["source-a"],
    title: "通知",
    url: "https://notice.example/item-1",
    fetchedAt: "2026-03-15T10:00:00.000Z",
    freshness: "live",
    ...overrides,
  };
}

describe("dedupeFeedItems", () => {
  it("merges duplicate items and keeps source lineage", () => {
    const merged = dedupeFeedItems([
      createItem({ sourceId: "source-a", sourceIds: ["source-a"], freshness: "cache" }),
      createItem({ sourceId: "source-b", sourceIds: ["source-b"], freshness: "live" }),
    ]);

    expect(merged).toHaveLength(1);
    expect(merged[0]?.sourceIds).toEqual(["source-a", "source-b"]);
    expect(merged[0]?.freshness).toBe("live");
  });
});
