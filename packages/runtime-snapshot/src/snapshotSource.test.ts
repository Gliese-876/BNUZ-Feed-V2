import { describe, expect, it, vi } from "vitest";

import { createSnapshotSource } from "./snapshotSource";

describe("createSnapshotSource", () => {
  it("normalizes snapshot payloads into snapshot freshness", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          version: 1,
          updatedAt: "2026-03-15T10:00:00.000Z",
          items: [
            {
              id: "item-1",
              sourceId: "notice",
              title: "Hello",
              url: "https://notice/item-1",
              fetchedAt: "2026-03-15T10:00:00.000Z",
            },
          ],
          sourceHealth: {},
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          notice: {
            sourceId: "notice",
            status: "snapshot",
            checkedAt: "2026-03-15T10:00:00.000Z",
            itemCount: 1,
          },
        }),
      });

    const source = createSnapshotSource({
      feedSnapshotUrl: "/data/feed-snapshot.json",
      sourceHealthUrl: "/data/source-health.json",
      fetchFn: fetchFn as unknown as typeof fetch,
    });

    const snapshot = await source.refresh();

    expect(snapshot.origin).toBe("snapshot");
    expect(snapshot.items[0]?.freshness).toBe("snapshot");
    expect(snapshot.sourceHealth.notice?.status).toBe("snapshot");
  });
});
