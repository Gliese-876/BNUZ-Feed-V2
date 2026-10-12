const fs = require("node:fs");
const path = require("node:path");
const { campusOnlySourceIds } = require("../packages/source-registry/src/networkPolicy.json");

function assessSnapshotHealth(snapshot) {
  const errors = [];
  const health = snapshot?.sourceHealth;
  const entries = health && typeof health === "object" && !Array.isArray(health)
    ? Object.entries(health)
    : [];
  const items = Array.isArray(snapshot?.items) ? snapshot.items : [];

  if (entries.length === 0) errors.push("Snapshot has no source health entries.");
  if (items.length === 0) errors.push("Snapshot has no feed items.");

  const partialSources = [];
  const degradedSources = [];
  const retainedSources = [];
  for (const [sourceId, entry] of entries) {
    if (entry?.sourceId !== sourceId) {
      errors.push(`Source health key ${sourceId} does not match its sourceId.`);
    }
    if (!Number.isInteger(entry?.itemCount) || entry.itemCount < 0) {
      errors.push(`Source ${sourceId} has an invalid itemCount.`);
    } else if (entry.status === "live" && entry.itemCount === 0) {
      errors.push(`Live source ${sourceId} has no items.`);
    }

    if (entry?.status === "snapshot" && campusOnlySourceIds.includes(sourceId)) {
      const hasItems = items.some((item) => item?.sourceId === sourceId || item?.sourceIds?.includes(sourceId));
      if (!entry.itemCount || !hasItems || typeof entry.lastSuccessAt !== "string" || !Number.isFinite(Date.parse(entry.lastSuccessAt))) {
        errors.push(`Campus source ${sourceId} has no valid retained data or success time.`);
      }
      retainedSources.push({ sourceId, lastSuccessAt: entry.lastSuccessAt, itemCount: entry.itemCount });
    } else if (entry?.status !== "live") {
      const sources = entry?.status === "partial" ? partialSources : degradedSources;
      sources.push({
        sourceId,
        status: entry?.status ?? "invalid",
        itemCount: entry?.itemCount,
        errorCode: entry?.errorCode,
        requestUrl: entry?.requestUrl,
      });
    }
  }

  return {
    updatedAt: snapshot?.updatedAt,
    totalItems: items.length,
    partialCount: partialSources.length,
    degradedCount: degradedSources.length,
    partialSources,
    degradedSources,
    retainedSources,
    errors,
  };
}

module.exports = { assessSnapshotHealth };

if (require.main === module) {
  try {
    const snapshotPath = path.resolve(process.argv[2] ?? "apps/web/public/data/feed-snapshot.json");
    const summary = assessSnapshotHealth(JSON.parse(fs.readFileSync(snapshotPath, "utf8")));
    console.log(JSON.stringify(summary, null, 2));
    process.exitCode = summary.errors.length + summary.partialCount + summary.degradedCount > 0 ? 1 : 0;
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
