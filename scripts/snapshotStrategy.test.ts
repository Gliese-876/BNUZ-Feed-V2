import { describe, expect, it, vi } from "vitest";

import type { FeedSnapshot, SourceDescriptor } from "@bnuz-feed/contracts";

import { executeSnapshotStrategy, mergeSourceSnapshots } from "./snapshotStrategy";

function createSource(id: string): SourceDescriptor {
  return {
    id,
    name: id,
    entryUrls: [`https://${id}.example.com`],
    parserKey: "test",
    enabled: true,
    capabilities: {
      browserFetch: true,
      snapshotFallback: true,
    },
  };
}

function createSnapshot(
  sourceStates: Array<{ id: string; status: FeedSnapshot["sourceHealth"][string]["status"]; itemCount?: number }>,
  updatedAt = "2026-03-29T00:00:00.000Z",
): FeedSnapshot {
  const items = sourceStates.flatMap(({ id, itemCount = 1, status }) =>
    status === "live"
      ? Array.from({ length: itemCount }, (_, index) => ({
          id: `${id}-${index}`,
          sourceId: id,
          sourceIds: [id],
          title: `${id}-${index}`,
          url: `https://${id}.example.com/${index}`,
          fetchedAt: updatedAt,
          freshness: "live" as const,
        }))
      : [],
  );

  return {
    version: 1,
    updatedAt,
    origin: "live",
    items,
    sourceHealth: Object.fromEntries(
      sourceStates.map(({ id, status, itemCount = status === "live" ? 1 : 0 }) => [
        id,
        {
          sourceId: id,
          status,
          checkedAt: updatedAt,
          itemCount,
        },
      ]),
    ),
  };
}

describe("mergeSourceSnapshots", () => {
  it("replaces only the targeted sources while preserving the others", () => {
    const base = createSnapshot([
      { id: "alpha", status: "live" },
      { id: "beta", status: "partial", itemCount: 0 },
    ]);
    const patch = createSnapshot([{ id: "beta", status: "live", itemCount: 2 }], "2026-03-29T00:01:00.000Z");

    const merged = mergeSourceSnapshots(base, patch, ["beta"]);

    expect(merged.items.map((item) => item.sourceId)).toEqual(["beta", "beta", "alpha"]);
    expect(merged.sourceHealth.alpha?.status).toBe("live");
    expect(merged.sourceHealth.beta?.status).toBe("live");
  });
});

describe("executeSnapshotStrategy", () => {
  it("uses browser completion only for unhealthy sources and stops after a healthy round", async () => {
    const sources = [createSource("alpha"), createSource("beta")];
    const runPhase = vi
      .fn()
      .mockResolvedValueOnce(
        createSnapshot([
          { id: "alpha", status: "live" },
          { id: "beta", status: "partial", itemCount: 0 },
        ]),
      )
      .mockResolvedValueOnce(createSnapshot([{ id: "beta", status: "live", itemCount: 2 }], "2026-03-29T00:01:00.000Z"));

    const snapshot = await executeSnapshotStrategy({
      sources,
      nodeMaxAttempts: 10,
      browserMaxAttempts: 5,
      roundLimit: 3,
      runPhase,
    });

    expect(snapshot.sourceHealth.alpha?.status).toBe("live");
    expect(snapshot.sourceHealth.beta?.status).toBe("live");
    expect(runPhase).toHaveBeenNthCalledWith(1, "node", sources, 10);
    expect(runPhase).toHaveBeenNthCalledWith(2, "browser", [sources[1]], 5);
  });

  it("restarts the full round when browser completion still leaves unhealthy sources", async () => {
    const sources = [createSource("alpha")];
    const runPhase = vi
      .fn()
      .mockResolvedValueOnce(createSnapshot([{ id: "alpha", status: "partial", itemCount: 0 }]))
      .mockResolvedValueOnce(createSnapshot([{ id: "alpha", status: "partial", itemCount: 0 }], "2026-03-29T00:01:00.000Z"))
      .mockResolvedValueOnce(createSnapshot([{ id: "alpha", status: "live" }], "2026-03-29T00:02:00.000Z"));

    const snapshot = await executeSnapshotStrategy({
      sources,
      nodeMaxAttempts: 10,
      browserMaxAttempts: 5,
      roundLimit: 3,
      runPhase,
    });

    expect(snapshot.sourceHealth.alpha?.status).toBe("live");
    expect(runPhase).toHaveBeenNthCalledWith(1, "node", sources, 10);
    expect(runPhase).toHaveBeenNthCalledWith(2, "browser", sources, 5);
    expect(runPhase).toHaveBeenNthCalledWith(3, "node", sources, 10);
  });

  it("fails after three full rounds without a healthy snapshot", async () => {
    const sources = [createSource("alpha")];
    const runPhase = vi.fn().mockResolvedValue(
      createSnapshot([{ id: "alpha", status: "partial", itemCount: 0 }]),
    );

    await expect(
      executeSnapshotStrategy({
        sources,
        nodeMaxAttempts: 10,
        browserMaxAttempts: 5,
        roundLimit: 3,
        runPhase,
      }),
    ).rejects.toThrow("Snapshot did not converge within 3 full rounds.");

    expect(runPhase).toHaveBeenCalledTimes(6);
  });
});
