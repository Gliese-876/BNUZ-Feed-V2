/// <reference lib="webworker" />

import type { BrowserWorkerCommand, BrowserWorkerResponse } from "@bnuz-feed/contracts";
import { createDefaultNormalizer } from "@bnuz-feed/core";
import { createParserRegistry } from "@bnuz-feed/source-registry";

import { executeBrowserRefresh } from "../runRefresh";

declare const self: DedicatedWorkerGlobalScope;

const parserRegistry = createParserRegistry();
const normalizer = createDefaultNormalizer();

self.addEventListener("message", async (event: MessageEvent<BrowserWorkerCommand>) => {
  if (event.data.type !== "refresh") {
    return;
  }

  try {
    const snapshot = await executeBrowserRefresh({
      sources: event.data.payload.sources,
      requestOptions: event.data.payload.options,
      parserRegistry,
      normalizer,
    });

    const response: BrowserWorkerResponse = {
      type: "completed",
      payload: snapshot,
    };

    self.postMessage(response);
  } catch (error) {
    const response: BrowserWorkerResponse = {
      type: "failed",
      payload: {
        message: error instanceof Error ? error.message : "Unknown worker failure.",
      },
    };

    self.postMessage(response);
  }
});
