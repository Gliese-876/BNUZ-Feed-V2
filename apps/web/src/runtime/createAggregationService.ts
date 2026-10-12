import type { FeedSource } from "@bnuz-feed/contracts";
import { createLayeredAggregationService } from "@bnuz-feed/core";
import { createIndexedDbRepository } from "@bnuz-feed/runtime-browser";
import { createSnapshotSource } from "@bnuz-feed/runtime-snapshot";

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

// Keep parsers and worker setup off the production snapshot path.
let browserSourcePromise: Promise<FeedSource> | undefined;
const browserSource: FeedSource = {
  async refresh(sourceIds) {
    browserSourcePromise ??= import("./browserSource").then(({ createDebugBrowserSource }) =>
      createDebugBrowserSource(),
    ).catch((error) => {
      browserSourcePromise = undefined;
      throw error;
    });
    return (await browserSourcePromise).refresh(sourceIds);
  },
};

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
