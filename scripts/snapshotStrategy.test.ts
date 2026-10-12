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

  it("keeps raw occurrence counts scoped to their sources when replacing a shared item", () => {
    const base = createSnapshot([{ id: "alpha", status: "live" }, { id: "beta", status: "live" }]);
    base.items = [{
      ...base.items[0]!,
      sourceIds: ["alpha", "beta"],
      rawCount: 5,
      rawOccurrences: [{ sourceId: "alpha", count: 2 }, { sourceId: "beta", count: 3 }],
    }];
    const patch = createSnapshot([{ id: "beta", status: "live" }]);
    patch.items = [{
      ...patch.items[0]!,
      url: base.items[0]!.url,
      title: base.items[0]!.title,
      rawCount: 4,
      rawOccurrences: [{ sourceId: "beta", count: 4 }],
    }];

    const merged = mergeSourceSnapshots(base, patch, ["beta"]);

    expect(merged.items).toHaveLength(1);
    expect(merged.items[0]?.rawCount).toBe(6);
    expect(merged.items[0]?.rawOccurrences).toEqual(expect.arrayContaining([
      { sourceId: "alpha", count: 2 }, { sourceId: "beta", count: 4 },
    ]));
  });

  it("ignores unrequested sources in a patch and treats an empty replacement list as a no-op", () => {
    const base = createSnapshot([{ id: "alpha", status: "live" }]);
    const patch = createSnapshot([{ id: "beta", status: "live" }, { id: "gamma", status: "live" }]);

    expect(mergeSourceSnapshots(base, patch, [])).toBe(base);
    const merged = mergeSourceSnapshots(base, patch, ["beta"]);
    expect(Object.keys(merged.sourceHealth)).toEqual(["alpha", "beta"]);
    expect(merged.items.flatMap((item) => item.sourceIds)).not.toContain("gamma");
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

  it("retries only unhealthy sources in later rounds and retains successful source data", async () => {
    const sources = [createSource("alpha"), createSource("beta")];
    const runPhase = vi
      .fn()
      .mockResolvedValueOnce(createSnapshot([{ id: "alpha", status: "live" }, { id: "beta", status: "partial" }]))
      .mockResolvedValueOnce(createSnapshot([{ id: "beta", status: "partial" }], "2026-03-29T00:01:00.000Z"))
      .mockResolvedValueOnce(createSnapshot([{ id: "beta", status: "live" }], "2026-03-29T00:02:00.000Z"));

    const snapshot = await executeSnapshotStrategy({
      sources,
      nodeMaxAttempts: 10,
      browserMaxAttempts: 5,
      roundLimit: 3,
      runPhase,
    });

    expect(snapshot.sourceHealth.alpha?.status).toBe("live");
    expect(snapshot.sourceHealth.beta?.status).toBe("live");
    expect(snapshot.items.map((item) => item.id)).toEqual(["beta-0", "alpha-0"]);
    expect(runPhase).toHaveBeenNthCalledWith(1, "node", sources, 10);
    expect(runPhase).toHaveBeenNthCalledWith(2, "browser", [sources[1]], 5);
    expect(runPhase).toHaveBeenNthCalledWith(3, "node", [sources[1]], 10);
  });

  it("fails after three rounds without a healthy snapshot", async () => {
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
    ).rejects.toThrow("Snapshot did not converge within 3 rounds.");

    expect(runPhase).toHaveBeenCalledTimes(6);
  });

  it("does not accept missing expected source health as a healthy snapshot", async () => {
    const runPhase = vi.fn().mockResolvedValue(createSnapshot([]));

    await expect(executeSnapshotStrategy({
      sources: [createSource("alpha")],
      nodeMaxAttempts: 1,
      browserMaxAttempts: 0,
      roundLimit: 1,
      runPhase,
    })).rejects.toThrow("did not converge");
    expect(runPhase).toHaveBeenCalledTimes(1);
  });

  it("excludes disabled sources and refuses to generate a snapshot with no enabled sources", async () => {
    const disabled = { ...createSource("disabled"), enabled: false };
    const runPhase = vi.fn().mockResolvedValue(createSnapshot([{ id: "alpha", status: "live" }]));
    const options = {
      sources: [createSource("alpha"), disabled], nodeMaxAttempts: 1, browserMaxAttempts: 0, roundLimit: 1, runPhase,
    };

    await executeSnapshotStrategy(options);
    expect(runPhase).toHaveBeenCalledWith("node", [options.sources[0]], 1);
    await expect(executeSnapshotStrategy({ ...options, sources: [disabled] })).rejects.toThrow("enabled source");
  });
});
