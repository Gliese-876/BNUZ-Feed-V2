import { describe, expect, it } from "vitest";
import type { FeedItem, FeedSnapshot } from "@bnuz-feed/contracts";
import { retainCampusSources } from "./retain-campus-sources";

const oldTime = "2026-10-11T00:00:00Z";
const newTime = "2026-10-12T00:00:00Z";
function item(id: string, sourceId: string, fetchedAt: string): FeedItem {
  return { id, title: id, url: `https://example.com/${id}`, sourceId, sourceIds: [sourceId], fetchedAt, freshness: "live" };
}
function snapshot(sourceId: string, fetchedAt: string, items: FeedItem[]): FeedSnapshot {
  return { version: 1, origin: "live", updatedAt: fetchedAt, items, sourceHealth: {
    [sourceId]: { sourceId, status: "live", checkedAt: fetchedAt, lastSuccessAt: fetchedAt, itemCount: items.length },
  } };
}

describe("campus-only snapshot retention", () => {
  it("retains campus data and its timestamps without retaining stale public records", () => {
    const previous = snapshot("campus", oldTime, [item("campus-only", "campus", oldTime), item("old-public", "public", oldTime)]);
    const refreshed = snapshot("public", newTime, [item("new-public", "public", newTime)]);
    const result = retainCampusSources(refreshed, previous, ["campus"]);
    expect(result.updatedAt).toBe(newTime);
    expect(result.items.map((entry) => entry.id).sort()).toEqual(["campus-only", "new-public"]);
    expect(result.items.find((entry) => entry.sourceId === "campus")).toMatchObject({ freshness: "snapshot", fetchedAt: oldTime });
    expect(result.sourceHealth.campus).toMatchObject({ status: "snapshot", checkedAt: oldTime, lastSuccessAt: oldTime, itemCount: 1 });
    expect(previous.sourceHealth.campus?.status).toBe("live");
  });

  it("merges shared articles without duplicating public occurrences on repeated refreshes", () => {
    const shared = { ...item("shared", "public", oldTime), sourceIds: ["public", "campus"], rawCount: 3,
      rawOccurrences: [{ sourceId: "public", count: 1 }, { sourceId: "campus", count: 2 }] };
    const previous = snapshot("campus", oldTime, [shared]);
    const refreshed = snapshot("public", newTime, [item("shared", "public", newTime)]);
    const first = retainCampusSources(refreshed, previous, ["campus"]);
    const result = retainCampusSources(refreshed, first, ["campus"]);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({ sourceIds: ["public", "campus"], rawCount: 3, freshness: "live", fetchedAt: newTime });
    expect(result.sourceHealth.campus?.lastSuccessAt).toBe(oldTime);
    expect(result.sourceHealth.campus?.itemCount).toBe(2);
  });

  it("rejects missing, empty, failed, or undated campus data", () => {
    const refreshed = snapshot("public", newTime, [item("public", "public", newTime)]);
    for (const previous of [
      snapshot("other", oldTime, [item("other", "other", oldTime)]),
      snapshot("campus", oldTime, []),
      { ...snapshot("campus", oldTime, [item("campus", "campus", oldTime)]), sourceHealth: {
        campus: { sourceId: "campus", status: "partial" as const, checkedAt: oldTime, itemCount: 1 },
      } },
      snapshot("campus", "invalid", [item("campus", "campus", oldTime)]),
    ]) expect(() => retainCampusSources(refreshed, previous, ["campus"])).toThrow("no valid previous snapshot");
  });

  it("refuses to conceal a refreshed source by overwriting it with old data", () => {
    const value = snapshot("campus", oldTime, [item("campus", "campus", oldTime)]);
    expect(() => retainCampusSources(value, value, ["campus"])).toThrow("both refreshed and retained");
  });
});
