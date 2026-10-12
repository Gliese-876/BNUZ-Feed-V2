import type {
  BrowserRefreshOptions,
  FeedSource,
  Normalizer,
  ParserRegistry,
  SourceDescriptor,
} from "@bnuz-feed/contracts";

import { executeBrowserRefresh } from "./runRefresh";

export interface BrowserLiveSourceOptions {
  sources: SourceDescriptor[];
  parserRegistry: ParserRegistry;
  normalizer: Normalizer;
  requestOptions: BrowserRefreshOptions;
}

export function createBrowserLiveSource(options: BrowserLiveSourceOptions): FeedSource {
  return {
    refresh(sourceIds) {
      const selectedIds = sourceIds?.length ? new Set(sourceIds) : null;
      // HTML parsers require Window.DOMParser, which is unavailable in workers.
      return executeBrowserRefresh({
        ...options,
        sources: selectedIds
          ? options.sources.filter((source) => selectedIds.has(source.id))
          : options.sources,
      });
    },
  };
}
