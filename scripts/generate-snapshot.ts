import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { JSDOM } from "jsdom";

import type { FeedSnapshot, SourceDescriptor } from "@bnuz-feed/contracts";
import { createDefaultNormalizer } from "@bnuz-feed/core";
import { executeBrowserRefreshUntilStable } from "@bnuz-feed/runtime-browser";
import { createParserRegistry, publicBnuzhSources } from "@bnuz-feed/source-registry";

import { createSnapshotFetch, parseBrowserHostList } from "./snapshotFetch";
import { executeSnapshotStrategy, type SnapshotPhase } from "./snapshotStrategy";

const outputDir = resolve(process.cwd(), "apps/web/public/data");
const domParser = new JSDOM("").window.DOMParser;

if (typeof globalThis.DOMParser === "undefined") {
  globalThis.DOMParser = domParser;
}

function resolveNumber(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function resolveNonNegativeNumber(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

async function writeJson(filePath: string, value: unknown) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function summarizeSnapshot(snapshot: FeedSnapshot) {
  const liveSources = Object.values(snapshot.sourceHealth).filter((entry) => entry.status === "live").length;
  const partialSources = Object.values(snapshot.sourceHealth).filter((entry) => entry.status === "partial").length;
  const degradedSources = Object.values(snapshot.sourceHealth).length - liveSources;

  return {
    liveSources,
    partialSources,
    degradedSources,
  };
}

async function main() {
  const nodeMaxAttempts = resolveNumber(process.env.BNUZ_FEED_SNAPSHOT_NODE_MAX_ATTEMPTS, 5);
  const browserMaxAttempts = resolveNumber(process.env.BNUZ_FEED_SNAPSHOT_BROWSER_MAX_ATTEMPTS, 5);
  const roundLimit = resolveNumber(process.env.BNUZ_FEED_SNAPSHOT_ROUND_LIMIT, 3);
  const retryDelayMs = resolveNonNegativeNumber(
    process.env.BNUZ_FEED_SNAPSHOT_RETRY_DELAY_MS,
    1500,
  );
  const timeoutMs = resolveNumber(process.env.BNUZ_FEED_SNAPSHOT_TIMEOUT_MS, 12000);
  const browserHosts = parseBrowserHostList(process.env.BNUZ_FEED_SNAPSHOT_BROWSER_HOSTS);
  const browserTimeoutMs = resolveNumber(process.env.BNUZ_FEED_SNAPSHOT_BROWSER_TIMEOUT_MS, timeoutMs);
  const parserRegistry = createParserRegistry();
  const normalizer = createDefaultNormalizer();
  const requestOptions = {
    concurrency: resolveNumber(process.env.BNUZ_FEED_SNAPSHOT_CONCURRENCY, 6),
    targetConcurrency: resolveNumber(process.env.BNUZ_FEED_SNAPSHOT_TARGET_CONCURRENCY, 3),
    timeoutMs,
  };

  async function runPhase(phase: SnapshotPhase, sources: SourceDescriptor[], maxAttempts: number) {
    const snapshotFetch = phase === "browser"
      ? await createSnapshotFetch({
        browserHosts,
        browserTimeoutMs,
      })
      : null;
    const fetchFn = snapshotFetch?.fetchFn ?? fetch;

    try {
      return executeBrowserRefreshUntilStable({
        sources,
        parserRegistry,
        normalizer,
        requestOptions,
        stabilization: {
          maxAttempts,
          retryDelayMs,
          onAttemptComplete: ({ attempt, attemptedSourceIds, pendingSourceIds, recoveredSourceIds, snapshot }) => {
            const { liveSources, partialSources, degradedSources } = summarizeSnapshot(snapshot);

            console.log(
              [
                `[snapshot:${phase}] attempt=${attempt}/${maxAttempts}`,
                `requestedSources=${attemptedSourceIds.length}`,
                `liveSources=${liveSources}`,
                `partialSources=${partialSources}`,
                `degradedSources=${degradedSources}`,
                `recoveredSources=${recoveredSourceIds.length}`,
                `pendingRetries=${pendingSourceIds.length}`,
              ].join(" "),
            );
          },
        },
        fetchFn,
      });
    } finally {
      await snapshotFetch?.dispose();
    }
  }

  const snapshot = await executeSnapshotStrategy({
    sources: publicBnuzhSources,
    nodeMaxAttempts,
    browserMaxAttempts,
    roundLimit,
    runPhase,
    onRoundComplete: ({ round, snapshot, unhealthySourceIds, browserAttempted }) => {
      const { liveSources, partialSources, degradedSources } = summarizeSnapshot(snapshot);

      console.log(
        [
          `[snapshot] round=${round}/${roundLimit}`,
          `liveSources=${liveSources}`,
          `partialSources=${partialSources}`,
          `degradedSources=${degradedSources}`,
          `browserAttempted=${browserAttempted}`,
          `remainingUnhealthy=${unhealthySourceIds.length}`,
        ].join(" "),
      );
    },
  });

  await mkdir(outputDir, { recursive: true });

  await Promise.all([
    writeJson(resolve(outputDir, "feed-snapshot.json"), snapshot),
    writeJson(resolve(outputDir, "source-health.json"), snapshot.sourceHealth),
  ]);

  const { liveSources, partialSources, degradedSources } = summarizeSnapshot(snapshot);

  console.log(
    [
      `snapshot written to ${outputDir}`,
      `updatedAt=${snapshot.updatedAt}`,
      `items=${snapshot.items.length}`,
      `liveSources=${liveSources}`,
      `partialSources=${partialSources}`,
      `degradedSources=${degradedSources}`,
    ].join(" "),
  );
}

void main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
