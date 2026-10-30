import { appendFile, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import type { FeedSnapshot } from "@bnuz-feed/contracts";
import { publicBnuzhSources } from "@bnuz-feed/source-registry/catalog";

const { assessSnapshotHealth } = createRequire(import.meta.url)("./check-snapshot-health.cjs") as {
  assessSnapshotHealth(snapshot: unknown): { errors: string[]; partialCount: number; degradedCount: number };
};

function validateSnapshot(value: unknown, sourceIds: string[]): FeedSnapshot {
  const snapshot = value as Partial<FeedSnapshot> | null;
  const health = assessSnapshotHealth(snapshot);
  if (health.errors.length || health.partialCount || health.degradedCount) {
    throw new Error("Snapshot is empty, malformed, or contains unhealthy sources.");
  }
  if (typeof snapshot?.updatedAt !== "string" || !Number.isFinite(Date.parse(snapshot.updatedAt))) {
    throw new Error("Snapshot has no valid update time.");
  }
  if (sourceIds.some((id) => !snapshot.sourceHealth?.[id])) {
    throw new Error("Snapshot does not cover the current source catalog.");
  }
  if (snapshot.items?.some((item) => !item || typeof item.id !== "string" || !item.id ||
    typeof item.title !== "string" || !item.title.trim() || typeof item.sourceId !== "string" ||
    typeof item.url !== "string" || !/^https?:\/\//i.test(item.url))) {
    throw new Error("Snapshot contains malformed feed items.");
  }
  return snapshot as FeedSnapshot;
}

export async function selectPublishSnapshot(options: {
  repositorySnapshot: unknown;
  sourceIds: string[];
  loadPublishedSnapshot?: () => Promise<unknown>;
}) {
  const candidates: Array<{ snapshot: FeedSnapshot; source: "repository" | "published" }> = [];
  const warnings: string[] = [];
  for (const source of ["repository", "published"] as const) {
    if (source === "published" && !options.loadPublishedSnapshot) continue;
    try {
      const value = source === "repository" ? options.repositorySnapshot : await options.loadPublishedSnapshot!();
      candidates.push({ source, snapshot: validateSnapshot(value, options.sourceIds) });
    } catch (error) {
      warnings.push(`${source}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  candidates.sort((a, b) => Date.parse(b.snapshot.updatedAt) - Date.parse(a.snapshot.updatedAt));
  const selected = candidates[0];
  if (!selected) throw new Error(`No healthy snapshot is available. ${warnings.join(" ")}`);
  return { ...selected, warnings };
}

async function main() {
  const snapshotPath = resolve("apps/web/public/data/feed-snapshot.json");
  let repositorySnapshot: unknown = null;
  try {
    repositorySnapshot = JSON.parse(await readFile(snapshotPath, "utf8"));
  } catch {
    // A healthy published snapshot can recover a missing or corrupt local copy.
  }
  const baseUrl = process.env.BNUZ_FEED_PUBLISHED_BASE_URL?.trim();
  const selection = await selectPublishSnapshot({
    repositorySnapshot,
    sourceIds: publicBnuzhSources.map((source) => source.id),
    loadPublishedSnapshot: baseUrl ? async () => {
      const url = new URL(`${baseUrl.replace(/\/+$/, "")}/data/feed-snapshot.json`);
      // Pages CDN can return the previous deployment even for a no-store request.
      url.searchParams.set("release", process.env.GITHUB_RUN_ID ?? String(Date.now()));
      const response = await fetch(url, { signal: AbortSignal.timeout(15000), cache: "no-store" });
      if (!response.ok) throw new Error(`Published snapshot returned HTTP ${response.status}.`);
      return response.json();
    } : undefined,
  });
  const { snapshot, source, warnings } = selection;
  const ageHours = Math.max(0, (Date.now() - Date.parse(snapshot.updatedAt)) / 3_600_000);
  if (ageHours > 24) warnings.push(`Retained snapshot is ${Math.floor(ageHours)} hours old; source refresh needs attention.`);
  const retainedSources = Object.values(snapshot.sourceHealth).filter((entry) => entry.status === "snapshot");
  for (const entry of retainedSources) {
    if (Date.now() - Date.parse(entry.lastSuccessAt!) > 24 * 3_600_000) {
      warnings.push(entry.retentionReason === "authorization_required"
        ? `Source ${entry.sourceId} awaits authorization; retained public data last succeeded at ${entry.lastSuccessAt}.`
        : `Campus source ${entry.sourceId} last succeeded at ${entry.lastSuccessAt}; refresh it from the campus network.`);
    }
  }
  await writeFile(snapshotPath, `${JSON.stringify(snapshot)}\n`, "utf8");
  await writeFile(resolve("apps/web/public/data/source-health.json"), `${JSON.stringify(snapshot.sourceHealth)}\n`, "utf8");
  for (const warning of warnings) console.warn(`::warning::${warning.replace(/[\r\n]+/g, " ")}`);
  console.log(JSON.stringify({ source, updatedAt: snapshot.updatedAt, items: snapshot.items.length, retainedSources, warnings }, null, 2));
  if (process.env.GITHUB_STEP_SUMMARY) {
    await appendFile(process.env.GITHUB_STEP_SUMMARY,
      `### Published data\n\nSource: ${source}\n\nUpdated: ${snapshot.updatedAt}\n\nItems: ${snapshot.items.length}\n\n`, "utf8");
    if (retainedSources.length) {
      await appendFile(process.env.GITHUB_STEP_SUMMARY,
        `Source data retained:\n${retainedSources.map((entry) => `- ${entry.sourceId}: ${entry.lastSuccessAt}`).join("\n")}\n\n`, "utf8");
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  void main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
