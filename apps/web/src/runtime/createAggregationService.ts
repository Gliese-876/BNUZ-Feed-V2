import { createLayeredAggregationService, createDefaultNormalizer } from "@bnuz-feed/core";
import { createIndexedDbRepository, createBrowserLiveSource } from "@bnuz-feed/runtime-browser";
import { createSnapshotSource } from "@bnuz-feed/runtime-snapshot";
import { createParserRegistry, publicBnuzhSources } from "@bnuz-feed/source-registry";

import { resolvePublicAssetUrl, resolveRuntimeConfig } from "./config";

const repository = createIndexedDbRepository({
  dbName: "bnuz-feed",
  storeName: "snapshots",
  snapshotKey: "latest",
});

const snapshotSource = createSnapshotSource({
  feedSnapshotUrl: resolvePublicAssetUrl("data/feed-snapshot.json"),
  sourceHealthUrl: resolvePublicAssetUrl("data/source-health.json"),
});

const browserSource = createBrowserLiveSource({
  sources: publicBnuzhSources,
  parserRegistry: createParserRegistry(),
  normalizer: createDefaultNormalizer(),
  requestOptions: {
    concurrency: 4,
    targetConcurrency: 2,
    timeoutMs: 8000,
  },
});

export const appRuntimeConfig = resolveRuntimeConfig();

export const aggregationService =
  appRuntimeConfig.sourceMode === "snapshot"
    ? createLayeredAggregationService({
        primary: snapshotSource,
        repository,
      })
    : createLayeredAggregationService({
        primary: browserSource,
        fallback: snapshotSource,
        repository,
      });
