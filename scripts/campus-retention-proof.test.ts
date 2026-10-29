import { describe, expect, it } from "vitest";
import type { FeedItem, FeedSnapshot } from "@bnuz-feed/contracts";
import { retainedSourceContent } from "./campus-retention-proof";

const item: FeedItem = { id: "http-id", sourceId: "public", sourceIds: ["public", "campus"],
  title: "Notice", url: "http://example.edu/notice.htm", publishedAt: "2026-10-12", channel: "Public",
  fetchedAt: "2026-10-12T00:00:00Z", freshness: "live", rawCount: 3,
  rawOccurrences: [{ sourceId: "public", channel: "Public", count: 1 },
    { sourceId: "campus", channel: "Campus", count: 2 }] };
const snapshot = (value: FeedItem): FeedSnapshot => ({ version: 1, origin: "live", updatedAt: value.fetchedAt,
  items: [value], sourceHealth: {} });
const proof = (value: FeedItem) => retainedSourceContent(snapshot(value), "campus", ["campus"]);

describe("campus retained content proof", () => {
  it("accepts only presentation alias drift for already shared public/campus records", () => {
    expect(proof({ ...item, id: "https-id", url: "https://example.edu/notice.htm",
      fetchedAt: "2026-10-29T00:00:00Z", freshness: "snapshot" })).toEqual(proof(item));
  });
  it.each([
    { title: "Changed notice" }, { url: "https://example.edu/other.htm" },
    { url: "https://other.edu/notice.htm" }, { url: "https://example.edu/notice.htm?changed=1" },
    { publishedAt: "2026-10-13" }, { summary: "Changed summary" }, { sourceIds: ["other-public", "campus"] },
    { rawOccurrences: [{ sourceId: "public", channel: "Public", count: 1 }, { sourceId: "campus", channel: "Campus", count: 3 }] },
    { rawOccurrences: [{ sourceId: "public", channel: "Public", count: 1 }, { sourceId: "campus", channel: "Other", count: 2 }] },
  ])("rejects changed source content or occurrence data: %j", (change) => {
    expect(proof({ ...item, ...change })).not.toEqual(proof(item));
  });
  it("does not normalize IDs or URLs for exclusive campus items", () => {
    const exclusive = { ...item, sourceId: "campus", sourceIds: ["campus"], rawCount: 2,
      rawOccurrences: [{ sourceId: "campus", channel: "Campus", count: 2 }] };
    expect(proof({ ...exclusive, id: "new-id" })).not.toEqual(proof(exclusive));
    expect(proof({ ...exclusive, url: "https://example.edu/notice.htm" })).not.toEqual(proof(exclusive));
  });
  it("rejects a formerly exclusive campus item newly relabeled as shared", () => {
    const exclusive = { ...item, sourceId: "campus", sourceIds: ["campus"], rawCount: 2,
      rawOccurrences: [{ sourceId: "campus", channel: "Campus", count: 2 }] };
    expect(proof(item)).not.toEqual(proof(exclusive));
  });
});
