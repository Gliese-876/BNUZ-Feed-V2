const fs = require("fs");
const path = require("path");

const snapshotPath = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.resolve("apps/web/public/data/feed-snapshot.json");

const rawSnapshot = fs.readFileSync(snapshotPath, "utf8");
const snapshot = JSON.parse(rawSnapshot);
const sourceHealth = Object.values(snapshot.sourceHealth ?? {});

const partialSources = sourceHealth.filter((entry) => entry.status === "partial");
const degradedSources = sourceHealth.filter((entry) => entry.status === "degraded");

const summary = {
  updatedAt: snapshot.updatedAt,
  totalItems: Array.isArray(snapshot.items) ? snapshot.items.length : 0,
  partialCount: partialSources.length,
  degradedCount: degradedSources.length,
  partialSources: partialSources.map((entry) => ({
    sourceId: entry.sourceId,
    itemCount: entry.itemCount,
    errorCode: entry.errorCode,
    requestUrl: entry.requestUrl,
  })),
  degradedSources: degradedSources.map((entry) => ({
    sourceId: entry.sourceId,
    itemCount: entry.itemCount,
    errorCode: entry.errorCode,
    requestUrl: entry.requestUrl,
  })),
};

console.log(JSON.stringify(summary, null, 2));

if (partialSources.length > 0 || degradedSources.length > 0) {
  process.exit(1);
}
