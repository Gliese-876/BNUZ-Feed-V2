import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";
import type { FeedSnapshot } from "@bnuz-feed/contracts";
import { publicBnuzhSources, campusOnlySourceIds } from "@bnuz-feed/source-registry/catalog";
import { authorizationSkippedIds, retainAuthorizationSources, selectRefreshSources } from "./authorization-retention";
import { retainedSourceContent } from "./campus-retention-proof";
const { assessSnapshotHealth } = createRequire(import.meta.url)("./check-snapshot-health.cjs");
const blocked = "70981c669ee748c4ba5dcd4022a42f58";
const other = publicBnuzhSources.find((s) => s.id !== blocked && !campusOnlySourceIds.includes(s.id))!.id;
function snapshot(id: string, time: string): FeedSnapshot {
  return { version: 1, origin: "live", updatedAt: time, sourceHealth: { [id]: {
    sourceId: id, status: "live", checkedAt: time, lastSuccessAt: time, itemCount: 1,
  } }, items: [{ id, title: id, sourceId: id, sourceIds: [id], url: `https://example.com/${id}`,
    fetchedAt: time, freshness: "live" }] };
}
const oldTime = "2026-10-29T01:00:00Z";
const newTime = "2026-10-30T01:00:00Z";
describe("explicit authorization retention", () => {
  it("removes blocked sources before any node/browser refresh phase", () => {
    const ids = authorizationSkippedIds(JSON.stringify([blocked]), publicBnuzhSources, campusOnlySourceIds);
    const requested: string[] = [];
    const selected = selectRefreshSources(publicBnuzhSources, campusOnlySourceIds, ids, true);
    for (const phase of ["node", "browser"]) for (const s of selected) requested.push(`${phase}:${s.id}`);
    expect(selected).toHaveLength(44);
    expect(requested.some((id) => id.endsWith(blocked))).toBe(false);
    expect(selected.some((s) => campusOnlySourceIds.includes(s.id))).toBe(false);
    expect(() => selectRefreshSources(publicBnuzhSources, campusOnlySourceIds, ids, false)).toThrow();
  });
  it("rejects malformed, unknown, duplicate, campus and all-public skip policies", () => {
    for (const raw of ["{", "{}", '[1]', '["unknown"]', JSON.stringify([blocked, blocked]),
      JSON.stringify(campusOnlySourceIds), JSON.stringify(publicBnuzhSources.filter((s) => !campusOnlySourceIds.includes(s.id)).map((s) => s.id))]) {
      expect(() => authorizationSkippedIds(raw, publicBnuzhSources, campusOnlySourceIds)).toThrow();
    }
  });
  it("retains original content/time with an explicit non-live reason; repeated retention is stable", () => {
    const previous = snapshot(blocked, oldTime);
    const refreshed = snapshot(other, newTime);
    const first = retainAuthorizationSources(refreshed, previous, [blocked]);
    const next = retainAuthorizationSources(refreshed, first, [blocked]);
    expect(next.sourceHealth[blocked]).toMatchObject({ status: "snapshot", checkedAt: oldTime,
      lastSuccessAt: oldTime, itemCount: 1, retentionReason: "authorization_required" });
    expect(next.items.find((i) => i.id === blocked)?.fetchedAt).toBe(oldTime);
    expect(retainedSourceContent(next, blocked, [blocked])).toEqual(retainedSourceContent(previous, blocked, [blocked]));
    expect(next.updatedAt).toBe(newTime);
    expect(assessSnapshotHealth(next)).toMatchObject({ degradedCount: 0, partialCount: 0, errors: [] });
    expect(previous.sourceHealth[blocked]?.status).toBe("live");
  });
  it("does not conceal unrelated source failure or unmarked public retention", () => {
    const next = retainAuthorizationSources(snapshot(other, newTime), snapshot(blocked, oldTime), [blocked]);
    next.sourceHealth[other]!.status = "partial";
    expect(assessSnapshotHealth(next).partialCount).toBe(1);
    next.sourceHealth[other]!.status = "snapshot";
    expect(assessSnapshotHealth(next).degradedCount).toBe(1);
    next.sourceHealth[other]!.status = "live";
    next.sourceHealth[other]!.retentionReason = "authorization_required";
    expect(assessSnapshotHealth(next).errors.length).toBeGreaterThan(0);
  });
  it("rejects missing or corrupt retained baseline and both-fetched-and-retained sources", () => {
    const previous = snapshot(blocked, oldTime);
    expect(() => retainAuthorizationSources(previous, previous, [blocked])).toThrow("both refreshed");
    previous.items = [];
    expect(() => retainAuthorizationSources(snapshot(other, newTime), previous, [blocked])).toThrow();
  });
});
