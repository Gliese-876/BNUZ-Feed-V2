import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { JSDOM } from "jsdom";

import { createDefaultNormalizer } from "@bnuz-feed/core";
import { executeBrowserRefresh } from "@bnuz-feed/runtime-browser";
import { createParserRegistry, publicBnuzhSources } from "@bnuz-feed/source-registry";

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

async function writeJson(filePath: string, value: unknown) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function main() {
  const snapshot = await executeBrowserRefresh({
    sources: publicBnuzhSources,
    parserRegistry: createParserRegistry(),
    normalizer: createDefaultNormalizer(),
    requestOptions: {
      concurrency: resolveNumber(process.env.BNUZ_FEED_SNAPSHOT_CONCURRENCY, 6),
      targetConcurrency: resolveNumber(process.env.BNUZ_FEED_SNAPSHOT_TARGET_CONCURRENCY, 3),
      timeoutMs: resolveNumber(process.env.BNUZ_FEED_SNAPSHOT_TIMEOUT_MS, 12000),
    },
  });

  await mkdir(outputDir, { recursive: true });

  await Promise.all([
    writeJson(resolve(outputDir, "feed-snapshot.json"), snapshot),
    writeJson(resolve(outputDir, "source-health.json"), snapshot.sourceHealth),
  ]);

  const liveSources = Object.values(snapshot.sourceHealth).filter((entry) => entry.status === "live").length;
  const degradedSources = Object.values(snapshot.sourceHealth).length - liveSources;

  console.log(
    [
      `snapshot written to ${outputDir}`,
      `updatedAt=${snapshot.updatedAt}`,
      `items=${snapshot.items.length}`,
      `liveSources=${liveSources}`,
      `degradedSources=${degradedSources}`,
    ].join(" "),
  );
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
