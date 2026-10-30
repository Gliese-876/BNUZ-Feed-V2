import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import type { FeedSnapshot } from "@bnuz-feed/contracts";
import { campusOnlySourceIds, publicBnuzhSources } from "@bnuz-feed/source-registry/catalog";
import { retainedSourceContent } from "./campus-retention-proof";
import { authorizationSkippedIds } from "./authorization-retention";

// Additional publication assertions; the existing health check remains mandatory.
const baseline = JSON.parse(readFileSync(process.argv[2]!, "utf8")) as FeedSnapshot;
const raw = readFileSync("apps/web/public/data/feed-snapshot.json");
const current = JSON.parse(raw.toString()) as FeedSnapshot;
const digest = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const publicSources = publicBnuzhSources.filter((source) => !campusOnlySourceIds.includes(source.id));
assert.equal(publicSources.length, 45);
assert.equal(campusOnlySourceIds.length, 2);
assert.deepEqual(Object.keys(current.sourceHealth).sort(), publicBnuzhSources.map((source) => source.id).sort());
const skippedIds = authorizationSkippedIds(process.env.BNUZ_FEED_AUTHORIZATION_SKIP_IDS, publicBnuzhSources, campusOnlySourceIds);
const retainedIds = [...campusOnlySourceIds, ...skippedIds];
for (const source of publicSources.filter((source) => !skippedIds.includes(source.id))) {
  assert.equal(current.sourceHealth[source.id]?.status, "live", source.id);
  assert.equal(current.sourceHealth[source.id]?.retentionReason, undefined, source.id);
}
const retained = retainedIds.map((id) => {
  const previous = baseline.sourceHealth[id]!;
  const health = current.sourceHealth[id]!;
  assert.equal(health.status, "snapshot", id);
  if (skippedIds.includes(id)) assert.equal(health.retentionReason, "authorization_required", id);
  assert.equal(health.checkedAt, previous.checkedAt, id);
  assert.equal(health.lastSuccessAt, previous.lastSuccessAt ?? previous.checkedAt, id);
  assert.equal(health.itemCount, previous.itemCount, id);
  const proofIds = campusOnlySourceIds.includes(id) ? campusOnlySourceIds : retainedIds;
  assert.equal(digest(retainedSourceContent(current, id, proofIds)),
    digest(retainedSourceContent(baseline, id, proofIds)), `Retained content changed: ${id}`);
  const exclusive = baseline.items.filter((item) => item.sourceIds.includes(id) &&
    item.sourceIds.every((sourceId) => proofIds.includes(sourceId)));
  const byId = new Map(current.items.map((item) => [item.id, item]));
  for (const item of exclusive) assert.equal(byId.get(item.id)?.fetchedAt, item.fetchedAt, item.id);
  return { sourceId: id, itemCount: health.itemCount, lastSuccessAt: health.lastSuccessAt };
});
assert.deepEqual(JSON.parse(readFileSync("apps/web/public/data/source-health.json", "utf8")), current.sourceHealth);
assert(Number.isFinite(Date.parse(current.updatedAt)));
console.log(JSON.stringify({
  updatedAt: current.updatedAt, items: current.items.length, live: 45 - skippedIds.length, retained, authorizationSkippedSourceIds: skippedIds,
  sha256: createHash("sha256").update(raw).digest("hex"),
}));
