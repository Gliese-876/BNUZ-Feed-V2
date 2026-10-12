import { describe, expect, it, vi } from "vitest";
import { selectPublishSnapshot } from "./prepare-publish-snapshot";

function snapshot(updatedAt: string) {
  return {
    version: 1, updatedAt, origin: "live",
    items: [{ id: "one", title: "Campus notice", url: "https://example.com/one", sourceId: "alpha" }],
    sourceHealth: { alpha: { sourceId: "alpha", status: "live", itemCount: 1 } },
  };
}
const oldTime = "2026-10-11T00:00:00Z";
const newTime = "2026-10-12T00:00:00Z";

describe("publish snapshot selection", () => {
  it("accepts explicit campus snapshots while rejecting an undated retained source", async () => {
    const campusId = "0eb7d5617b434e70baf90c78007fbe01";
    const value = { ...snapshot(newTime), items: [...snapshot(newTime).items, {
      id: "campus", title: "Campus notice", url: "https://ssb.bnuzh.edu.cn/notice.htm", sourceId: campusId,
    }], sourceHealth: { ...snapshot(newTime).sourceHealth,
      [campusId]: { sourceId: campusId, status: "snapshot", itemCount: 1, lastSuccessAt: oldTime },
    } };
    const result = await selectPublishSnapshot({ repositorySnapshot: value, sourceIds: ["alpha", campusId] });
    expect(result.snapshot).toBe(value);
    value.sourceHealth[campusId]!.lastSuccessAt = "invalid";
    await expect(selectPublishSnapshot({ repositorySnapshot: value, sourceIds: ["alpha", campusId] })).rejects.toThrow("No healthy snapshot");
  });

  it("uses newer published data so a code release does not roll back the feed", async () => {
    const published = snapshot(newTime);
    const result = await selectPublishSnapshot({ repositorySnapshot: snapshot(oldTime), sourceIds: ["alpha"], loadPublishedSnapshot: async () => published });
    expect(result.source).toBe("published");
    expect(result.snapshot).toBe(published);
  });

  it("keeps the repository snapshot when it is newer or equally recent", async () => {
    for (const updatedAt of [oldTime, newTime]) {
      const result = await selectPublishSnapshot({ repositorySnapshot: snapshot(newTime), sourceIds: ["alpha"], loadPublishedSnapshot: async () => snapshot(updatedAt) });
      expect(result.source).toBe("repository");
    }
  });

  it("allows a code release when published data is unreachable", async () => {
    const loadPublishedSnapshot = vi.fn().mockRejectedValue(new Error("Network unavailable"));
    const result = await selectPublishSnapshot({ repositorySnapshot: snapshot(newTime), sourceIds: ["alpha"], loadPublishedSnapshot });
    expect(result.source).toBe("repository");
    expect(result.warnings).toContain("published: Network unavailable");
  });

  it("rejects newer data with a missing source or a partial source", async () => {
    for (const sourceHealth of [{}, { alpha: { sourceId: "alpha", status: "partial", itemCount: 1 } }]) {
      const result = await selectPublishSnapshot({ repositorySnapshot: snapshot(oldTime), sourceIds: ["alpha"], loadPublishedSnapshot: async () => ({ ...snapshot(newTime), sourceHealth }) });
      expect(result.source).toBe("repository");
      expect(result.warnings).toHaveLength(1);
    }
    const result = await selectPublishSnapshot({ repositorySnapshot: { ...snapshot(oldTime), sourceHealth: { alpha: { sourceId: "alpha", status: "live", itemCount: 1 }, beta: { sourceId: "beta", status: "live", itemCount: 1 } } }, sourceIds: ["alpha", "beta"], loadPublishedSnapshot: async () => snapshot(newTime) });
    expect(result.source).toBe("repository");
  });

  it("recovers invalid repository data from a healthy published snapshot", async () => {
    const result = await selectPublishSnapshot({ repositorySnapshot: null, sourceIds: ["alpha"], loadPublishedSnapshot: async () => snapshot(newTime) });
    expect(result.source).toBe("published");
  });

  it("fails when neither candidate is healthy, including invalid timestamps", async () => {
    await expect(selectPublishSnapshot({ repositorySnapshot: snapshot("invalid"), sourceIds: ["alpha"], loadPublishedSnapshot: async () => ({ items: [] }) })).rejects.toThrow("No healthy snapshot");
  });

  it("works without a previously published site", async () => {
    const result = await selectPublishSnapshot({ repositorySnapshot: snapshot(newTime), sourceIds: ["alpha"] });
    expect(result).toMatchObject({ source: "repository", warnings: [] });
  });

  it("rejects malformed feed entries even when their health metadata says live", async () => {
    const value = snapshot(newTime);
    value.items[0]!.url = "javascript:alert(1)";
    await expect(selectPublishSnapshot({ repositorySnapshot: value, sourceIds: ["alpha"] })).rejects.toThrow("malformed feed items");
  });
});
