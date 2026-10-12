import { createRequire } from "node:module";

import { describe, expect, it } from "vitest";

const { assessSnapshotHealth } = createRequire(import.meta.url)("./check-snapshot-health.cjs") as {
  assessSnapshotHealth(snapshot: unknown): {
    errors: string[];
    partialCount: number;
    degradedCount: number;
    degradedSources: Array<{ sourceId: string; status: string }>;
  };
};

function snapshot(status = "live", itemCount = 1) {
  return {
    items: [{ id: "alpha-1" }],
    sourceHealth: { alpha: { sourceId: "alpha", status, itemCount } },
  };
}

describe("snapshot health check", () => {
  it("accepts a populated snapshot with live sources", () => {
    expect(assessSnapshotHealth(snapshot())).toMatchObject({ errors: [], partialCount: 0, degradedCount: 0 });
  });

  it.each(["timeout", "network_error", "parser_error", "cache", "snapshot", "empty", "failed"])(
    "rejects the %s status",
    (status) => {
      expect(assessSnapshotHealth(snapshot(status))).toMatchObject({
        degradedCount: 1, degradedSources: [{ sourceId: "alpha", status }],
      });
    },
  );

  it("reports partial sources separately", () => {
    expect(assessSnapshotHealth(snapshot("partial"))).toMatchObject({ partialCount: 1, degradedCount: 0 });
  });

  it.each([undefined, {}, { items: [], sourceHealth: {} }, { items: [], sourceHealth: [] }])(
    "rejects missing snapshot data",
    (value) => {
      expect(assessSnapshotHealth(value).errors).toHaveLength(2);
    },
  );

  it.each([0, -1, 1.5, "1"])("rejects invalid live item count %s", (itemCount) => {
    const value = snapshot();
    Object.assign(value.sourceHealth.alpha, { itemCount });
    expect(assessSnapshotHealth(value).errors).toHaveLength(1);
  });

  it("rejects malformed entries without crashing", () => {
    expect(assessSnapshotHealth({ items: [{}], sourceHealth: { alpha: null } })).toMatchObject({
      degradedCount: 1, errors: expect.arrayContaining([expect.stringContaining("sourceId")]),
    });
  });
});
