import { describe, expect, it, vi } from "vitest";

import { createSnapshotSource } from "./snapshotSource";

describe("createSnapshotSource", () => {
  it("uses embedded health without downloading a sidecar from a different snapshot", async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue({
      ok: true,
      json: async () => ({ items: [], sourceHealth: {
        notice: { status: "snapshot", checkedAt: "2026-03-15", itemCount: 1 },
      } }),
    } as Response);
    const source = createSnapshotSource({
      feedSnapshotUrl: "/feed.json", sourceHealthUrl: "/health.json", fetchFn,
    });
    const snapshot = await source.refresh();
    expect(fetchFn).toHaveBeenCalledOnce();
    expect(snapshot.sourceHealth.notice?.itemCount).toBe(1);
  });

  it("supports a snapshot without a health sidecar and ignores null records", async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue({
      ok: true,
      json: async () => ({ items: [null], sourceHealth: { invalid: null } }),
    } as Response);
    const snapshot = await createSnapshotSource({ feedSnapshotUrl: "/feed.json", fetchFn }).refresh();
    expect(snapshot.items).toEqual([]);
    expect(snapshot.sourceHealth).toEqual({});
    expect(fetchFn).toHaveBeenCalledOnce();
  });

  it("reports an invalid top-level payload as a snapshot failure", async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue({ ok: true, json: async () => null } as Response);
    await expect(createSnapshotSource({ feedSnapshotUrl: "/feed.json", fetchFn }).refresh())
      .rejects.toMatchObject({ code: "SNAPSHOT_FAILED" });
  });

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
