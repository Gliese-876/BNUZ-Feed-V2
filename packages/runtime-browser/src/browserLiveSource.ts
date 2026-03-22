import type {
  BrowserWorkerCommand,
  BrowserWorkerRefreshOptions,
  BrowserWorkerResponse,
  FeedSnapshot,
  FeedSource,
  Normalizer,
  ParserRegistry,
  SourceDescriptor,
  SourceId,
} from "@bnuz-feed/contracts";

import { executeBrowserRefresh } from "./runRefresh";
import { createBrowserWorker } from "./createBrowserWorker";

export interface BrowserLiveSourceOptions {
  sources: SourceDescriptor[];
  parserRegistry: ParserRegistry;
  normalizer: Normalizer;
  requestOptions: BrowserWorkerRefreshOptions;
  workerFactory?: () => Worker;
}

function runWorkerRefresh(
  worker: Worker,
  sources: SourceDescriptor[],
  requestOptions: BrowserWorkerRefreshOptions,
): Promise<FeedSnapshot> {
  return new Promise((resolve, reject) => {
    const handleMessage = (event: MessageEvent<BrowserWorkerResponse>) => {
      cleanup();

      if (event.data.type === "completed") {
        resolve(event.data.payload);
        return;
      }

      reject(new Error(event.data.payload.message));
    };

    const handleError = (event: ErrorEvent) => {
      cleanup();
      reject(event.error ?? new Error(event.message));
    };

    const cleanup = () => {
      worker.removeEventListener("message", handleMessage);
      worker.removeEventListener("error", handleError);
    };

    worker.addEventListener("message", handleMessage);
    worker.addEventListener("error", handleError);

    const command: BrowserWorkerCommand = {
      type: "refresh",
      payload: {
        sources,
        options: requestOptions,
      },
    };

    worker.postMessage(command);
  });
}

export function createBrowserLiveSource(options: BrowserLiveSourceOptions): FeedSource {
  let worker: Worker | undefined;

  async function refreshInProcess(sourceIds?: SourceId[]) {
    const sources =
      sourceIds && sourceIds.length > 0
        ? options.sources.filter((source) => sourceIds.includes(source.id))
        : options.sources;

    return executeBrowserRefresh({
      sources,
      parserRegistry: options.parserRegistry,
      normalizer: options.normalizer,
      requestOptions: options.requestOptions,
    });
  }

  return {
    async refresh(sourceIds?: SourceId[]) {
      const sources =
        sourceIds && sourceIds.length > 0
          ? options.sources.filter((source) => sourceIds.includes(source.id))
          : options.sources;

      if (typeof Worker === "undefined") {
        return refreshInProcess(sourceIds);
      }

      try {
        worker ??= (options.workerFactory ?? createBrowserWorker)();
        return await runWorkerRefresh(worker, sources, options.requestOptions);
      } catch {
        return refreshInProcess(sourceIds);
      }
    },
  };
}
