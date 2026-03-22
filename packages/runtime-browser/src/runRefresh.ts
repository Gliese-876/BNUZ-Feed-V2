import {
  AggregationError,
  type BrowserWorkerRefreshOptions,
  type FeedSnapshot,
  type FetchTarget,
  type Normalizer,
  type ParserRegistry,
  type RawPage,
  type SourceDescriptor,
  type SourceHealth,
} from "@bnuz-feed/contracts";
import { dedupeFeedItems } from "@bnuz-feed/core";

import { classifySourceError } from "./classifySourceError";

export interface ExecuteBrowserRefreshOptions {
  sources: SourceDescriptor[];
  parserRegistry: ParserRegistry;
  normalizer: Normalizer;
  requestOptions: BrowserWorkerRefreshOptions;
  fetchFn?: typeof fetch;
}

function isCrossOrigin(url: string): boolean {
  if (typeof location === "undefined") {
    return true;
  }

  try {
    return new URL(url, location.href).origin !== location.origin;
  } catch {
    return true;
  }
}

async function fetchPage(
  source: SourceDescriptor,
  target: FetchTarget,
  timeoutMs: number,
  fetchFn: typeof fetch,
): Promise<RawPage> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const requestUrl = target.url;

  try {
    const response = await fetchFn(requestUrl, {
      mode: "cors",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new AggregationError(
        "FETCH_FAILED",
        `Request to ${requestUrl} failed with ${response.status}.`,
        { status: response.status },
      );
    }

    return {
      sourceId: source.id,
      requestId: target.id,
      requestUrl,
      finalUrl: response.url || requestUrl,
      fetchedAt: new Date().toISOString(),
      contentType: response.headers.get("content-type") ?? undefined,
      bodyText: await response.text(),
      channel: target.channel,
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new AggregationError("FETCH_TIMEOUT", `Request to ${requestUrl} timed out.`, {
        requestUrl,
      });
    }

    if (error instanceof TypeError && isCrossOrigin(requestUrl)) {
      throw new AggregationError("CORS_BLOCKED", `CORS blocked request to ${requestUrl}.`, {
        requestUrl,
      });
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function getFetchTargets(source: SourceDescriptor): FetchTarget[] {
  if (source.fetchTargets && source.fetchTargets.length > 0) {
    return source.fetchTargets;
  }

  return source.entryUrls.map((url, index) => ({
    id: `entry-${index}`,
    url,
  }));
}

async function fetchSourcePages(
  source: SourceDescriptor,
  timeoutMs: number,
  fetchFn: typeof fetch,
): Promise<RawPage[]> {
  return Promise.all(getFetchTargets(source).map((target) => fetchPage(source, target, timeoutMs, fetchFn)));
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await mapper(items[currentIndex]!);
    }
  }

  const size = Math.max(1, Math.min(concurrency, items.length || 1));
  await Promise.all(Array.from({ length: size }, () => worker()));
  return results;
}

export async function executeBrowserRefresh(
  options: ExecuteBrowserRefreshOptions,
): Promise<FeedSnapshot> {
  const fetchFn = options.fetchFn ?? fetch;
  const healthEntries: SourceHealth[] = [];
  const itemGroups = await mapWithConcurrency(
    options.sources.filter((source) => source.enabled),
    options.requestOptions.concurrency,
    async (source) => {
      if (!source.capabilities.browserFetch) {
        healthEntries.push({
          sourceId: source.id,
          status: "idle",
          checkedAt: new Date().toISOString(),
          itemCount: 0,
          message: "Browser fetching is disabled for this source.",
        });
        return [];
      }

      try {
        const pages = await fetchSourcePages(source, options.requestOptions.timeoutMs, fetchFn);
        const parser = options.parserRegistry.get(source.parserKey);

        if (!parser) {
          throw new AggregationError(
            "PARSER_NOT_IMPLEMENTED",
            `Parser "${source.parserKey}" is not registered.`,
          );
        }

        const records = (await Promise.all(pages.map((page) => parser.parse(page)))).flat();

        if (records.length === 0) {
          throw new AggregationError(
            "EMPTY_RESULT",
            `Parser "${source.parserKey}" returned no records.`,
          );
        }

        const items = records.map((record) => options.normalizer.normalize(record));

        healthEntries.push({
          sourceId: source.id,
          status: "live",
          checkedAt: new Date().toISOString(),
          itemCount: items.length,
          lastSuccessAt: new Date().toISOString(),
          requestUrl: pages[0]?.requestUrl,
        });

        return items;
      } catch (error) {
        const classified = classifySourceError(error);
        healthEntries.push({
          sourceId: source.id,
          status: classified.status,
          checkedAt: new Date().toISOString(),
          itemCount: 0,
          errorCode: classified.errorCode,
          message: classified.message,
          requestUrl: source.entryUrls[0],
        });

        return [];
      }
    },
  );

  const items = dedupeFeedItems(itemGroups.flat());

  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    origin: "live",
    items,
    sourceHealth: Object.fromEntries(healthEntries.map((entry) => [entry.sourceId, entry])),
  };
}
