import {
  AggregationError,
  type FeedItem,
  type BrowserWorkerRefreshOptions,
  type FeedSnapshot,
  type FetchTarget,
  type Normalizer,
  type ParserRegistry,
  type RawPage,
  type SourceDescriptor,
  type SourceHealth,
  type SourceHealthStatus,
  type SourceId,
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

export interface BrowserRefreshStabilizationOptions {
  maxAttempts?: number;
  retryDelayMs?: number;
  retryableStatuses?: SourceHealthStatus[];
  onAttemptComplete?: (attempt: BrowserRefreshAttempt) => void;
}

export interface ExecuteBrowserRefreshUntilStableOptions extends ExecuteBrowserRefreshOptions {
  stabilization?: BrowserRefreshStabilizationOptions;
}

export interface BrowserRefreshAttempt {
  attempt: number;
  attemptedSourceIds: SourceId[];
  pendingSourceIds: SourceId[];
  recoveredSourceIds: SourceId[];
  snapshot: FeedSnapshot;
}

interface RefreshAccumulator {
  sourceHealth: Map<SourceId, SourceHealth>;
  sourceItems: Map<SourceId, FeedItem[]>;
  updatedAt: string;
  version: number;
}

interface SettledResult<T, R> {
  item: T;
  status: "fulfilled" | "rejected";
  value?: R;
  reason?: unknown;
}

interface SourceAttemptFailure {
  stage: "fetch" | "parse";
  requestId: string;
  requestUrl: string;
  error: unknown;
}

const defaultRetryableStatuses: SourceHealthStatus[] = [
  "partial",
  "timeout",
  "network_error",
  "parser_error",
  "empty",
];

function resolveConcurrency(value: number | undefined, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return Math.max(1, fallback);
  }

  return Math.max(1, Math.floor(value));
}

function getTargetConcurrency(requestOptions: BrowserWorkerRefreshOptions): number {
  return resolveConcurrency(requestOptions.targetConcurrency, requestOptions.concurrency);
}

async function yieldToEventLoop(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

async function wait(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function isCrossOrigin(url: string): boolean {
  if (typeof location === "undefined") {
    return false;
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
  requestOptions: BrowserWorkerRefreshOptions,
  fetchFn: typeof fetch,
): Promise<RawPage[]> {
  const pages = await mapWithConcurrency(
    getFetchTargets(source),
    getTargetConcurrency(requestOptions),
    async (target) => fetchPage(source, target, requestOptions.timeoutMs, fetchFn),
  );

  await yieldToEventLoop();
  return pages;
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

async function mapWithConcurrencySettled<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>,
): Promise<Array<SettledResult<T, R>>> {
  const results = await mapWithConcurrency(items, concurrency, async (item) => {
    try {
      return {
        item,
        status: "fulfilled" as const,
        value: await mapper(item),
      };
    } catch (error) {
      return {
        item,
        status: "rejected" as const,
        reason: error,
      };
    }
  });

  return results;
}

function explodeSnapshotItems(snapshot: FeedSnapshot): Map<SourceId, FeedItem[]> {
  const itemsBySource = new Map<SourceId, FeedItem[]>();

  for (const item of snapshot.items) {
    const sourceIds = item.sourceIds.length > 0 ? item.sourceIds : [item.sourceId];

    for (const sourceId of sourceIds) {
      const sourceItems = itemsBySource.get(sourceId) ?? [];
      sourceItems.push({
        ...item,
        sourceId,
        sourceIds: [sourceId],
      });
      itemsBySource.set(sourceId, sourceItems);
    }
  }

  return itemsBySource;
}

function createRefreshAccumulator(snapshot: FeedSnapshot): RefreshAccumulator {
  return {
    sourceHealth: new Map(
      Object.entries(snapshot.sourceHealth).map(([sourceId, entry]) => [sourceId, { ...entry }]),
    ),
    sourceItems: explodeSnapshotItems(snapshot),
    updatedAt: snapshot.updatedAt,
    version: snapshot.version,
  };
}

function buildSnapshotFromAccumulator(accumulator: RefreshAccumulator): FeedSnapshot {
  return {
    version: accumulator.version,
    updatedAt: accumulator.updatedAt,
    origin: "live",
    items: dedupeFeedItems([...accumulator.sourceItems.values()].flat()),
    sourceHealth: Object.fromEntries(
      [...accumulator.sourceHealth.entries()].map(([sourceId, entry]) => [
        sourceId,
        {
          ...entry,
          itemCount: accumulator.sourceItems.get(sourceId)?.length ?? entry.itemCount,
        },
      ]),
    ),
  };
}

function getRetryableSourceIds(
  snapshot: FeedSnapshot,
  retryableStatuses: Set<SourceHealthStatus>,
  attemptsBySource: Map<SourceId, number>,
  maxAttempts: number,
): SourceId[] {
  return Object.values(snapshot.sourceHealth)
    .filter(
      (entry) =>
        retryableStatuses.has(entry.status) && (attemptsBySource.get(entry.sourceId) ?? 0) < maxAttempts,
    )
    .map((entry) => entry.sourceId);
}

function mergeRefreshAttempt(
  accumulator: RefreshAccumulator,
  attemptedSourceIds: SourceId[],
  snapshot: FeedSnapshot,
): SourceId[] {
  const recoveredSourceIds: SourceId[] = [];
  const nextItemsBySource = explodeSnapshotItems(snapshot);

  for (const sourceId of attemptedSourceIds) {
    const nextHealth = snapshot.sourceHealth[sourceId];
    if (!nextHealth) {
      continue;
    }

    const previousItems = accumulator.sourceItems.get(sourceId) ?? [];
    const nextItems = nextItemsBySource.get(sourceId) ?? [];
    const hadSuccessfulItems = previousItems.length > 0;
    const hasUsableItems = nextItems.length > 0;

    if (hasUsableItems) {
      const mergedItems = dedupeFeedItems([...previousItems, ...nextItems]);
      accumulator.sourceItems.set(sourceId, mergedItems);
      accumulator.sourceHealth.set(sourceId, {
        ...nextHealth,
        itemCount: mergedItems.length,
      });

      if (!hadSuccessfulItems && mergedItems.length > 0) {
        recoveredSourceIds.push(sourceId);
      }

      continue;
    }

    if (!hadSuccessfulItems) {
      accumulator.sourceItems.set(sourceId, []);
      accumulator.sourceHealth.set(sourceId, { ...nextHealth });
      continue;
    }

    const previousHealth = accumulator.sourceHealth.get(sourceId);
    if (previousHealth) {
      accumulator.sourceHealth.set(sourceId, {
        ...previousHealth,
        checkedAt: nextHealth.checkedAt,
      });
    }
  }

  accumulator.updatedAt = snapshot.updatedAt;
  accumulator.version = Math.max(accumulator.version, snapshot.version);

  return recoveredSourceIds;
}

function summarizeSourceAttemptFailures(source: SourceDescriptor, failures: SourceAttemptFailure[]): {
  errorCode: SourceHealth["errorCode"];
  message: string;
  requestUrl: string;
  status: SourceHealthStatus;
} {
  const primaryFailure = failures[0];
  const classified = classifySourceError(primaryFailure?.error);
  const fetchFailures = failures.filter((failure) => failure.stage === "fetch").length;
  const parseFailures = failures.length - fetchFailures;

  return {
    errorCode: classified.errorCode,
    message:
      failures.length === 1
        ? classified.message
        : `Recovered partial data with ${failures.length} target failures (${fetchFailures} fetch, ${parseFailures} parse). First error: ${classified.message}`,
    requestUrl: primaryFailure?.requestUrl ?? source.entryUrls[0] ?? "",
    status: failures.length === 1 ? classified.status : "partial",
  };
}

export async function executeBrowserRefresh(
  options: ExecuteBrowserRefreshOptions,
): Promise<FeedSnapshot> {
  const fetchFn = options.fetchFn ?? fetch;
  const healthEntries: SourceHealth[] = [];
  const targetConcurrency = getTargetConcurrency(options.requestOptions);
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
        const parser = options.parserRegistry.get(source.parserKey);

        if (!parser) {
          throw new AggregationError(
            "PARSER_NOT_IMPLEMENTED",
            `Parser "${source.parserKey}" is not registered.`,
          );
        }

        const fetchResults = await mapWithConcurrencySettled(
          getFetchTargets(source),
          getTargetConcurrency(options.requestOptions),
          async (target) => fetchPage(source, target, options.requestOptions.timeoutMs, fetchFn),
        );

        const pages = fetchResults.flatMap((result) =>
          result.status === "fulfilled" && result.value ? [result.value] : [],
        );
        const failures: SourceAttemptFailure[] = fetchResults.flatMap((result) =>
          result.status === "rejected"
            ? [
                {
                  stage: "fetch",
                  requestId: result.item.id,
                  requestUrl: result.item.url,
                  error: result.reason,
                } satisfies SourceAttemptFailure,
              ]
            : [],
        );

        if (pages.length === 0) {
          const classified = summarizeSourceAttemptFailures(source, failures);
          healthEntries.push({
            sourceId: source.id,
            status: classified.status,
            checkedAt: new Date().toISOString(),
            itemCount: 0,
            errorCode: classified.errorCode,
            message: classified.message,
            requestUrl: classified.requestUrl,
          });
          return [];
        }

        await yieldToEventLoop();

        const parseResults = await mapWithConcurrencySettled(
          pages,
          targetConcurrency,
          async (page) => parser.parse(page),
        );
        const records = parseResults.flatMap((result) =>
          result.status === "fulfilled" && result.value ? result.value : [],
        );

        failures.push(
          ...parseResults.flatMap((result) =>
            result.status === "rejected"
              ? [
                  {
                    stage: "parse",
                    requestId: result.item.requestId,
                    requestUrl: result.item.requestUrl,
                    error: result.reason,
                  } satisfies SourceAttemptFailure,
                ]
              : [],
          ),
        );

        if (records.length === 0) {
          if (failures.length > 0) {
            const classified = summarizeSourceAttemptFailures(source, failures);
            healthEntries.push({
              sourceId: source.id,
              status: classified.status,
              checkedAt: new Date().toISOString(),
              itemCount: 0,
              errorCode: classified.errorCode,
              message: classified.message,
              requestUrl: classified.requestUrl,
            });
            return [];
          }

          throw new AggregationError("EMPTY_RESULT", `Parser "${source.parserKey}" returned no records.`);
        }

        const items = records.map((record) => options.normalizer.normalize(record));
        await yieldToEventLoop();

        const classifiedFailure = failures.length > 0 ? summarizeSourceAttemptFailures(source, failures) : null;

        healthEntries.push({
          sourceId: source.id,
          status: failures.length > 0 ? "partial" : "live",
          checkedAt: new Date().toISOString(),
          itemCount: items.length,
          lastSuccessAt: new Date().toISOString(),
          requestUrl: pages[0]?.requestUrl,
          errorCode: classifiedFailure?.errorCode,
          message: classifiedFailure?.message,
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

export async function executeBrowserRefreshUntilStable(
  options: ExecuteBrowserRefreshUntilStableOptions,
): Promise<FeedSnapshot> {
  const { stabilization, ...refreshOptions } = options;
  const maxAttempts = resolveConcurrency(stabilization?.maxAttempts, 3);
  const retryDelayMs = Math.max(0, Math.floor(stabilization?.retryDelayMs ?? 1500));
  const retryableStatuses = new Set(
    stabilization?.retryableStatuses?.length
      ? stabilization.retryableStatuses
      : defaultRetryableStatuses,
  );
  const sourceById = new Map(refreshOptions.sources.map((source) => [source.id, source]));
  const attemptsBySource = new Map<SourceId, number>();

  const initialSnapshot = await executeBrowserRefresh(refreshOptions);
  for (const sourceId of Object.keys(initialSnapshot.sourceHealth)) {
    attemptsBySource.set(sourceId, 1);
  }

  const accumulator = createRefreshAccumulator(initialSnapshot);
  let snapshot = buildSnapshotFromAccumulator(accumulator);
  let pendingSourceIds = getRetryableSourceIds(
    snapshot,
    retryableStatuses,
    attemptsBySource,
    maxAttempts,
  );

  stabilization?.onAttemptComplete?.({
    attempt: 1,
    attemptedSourceIds: Object.keys(initialSnapshot.sourceHealth),
    pendingSourceIds,
    recoveredSourceIds: [],
    snapshot,
  });

  let attempt = 1;

  while (pendingSourceIds.length > 0) {
    if (retryDelayMs > 0) {
      await wait(retryDelayMs);
    }

    const retrySourceIds = [...pendingSourceIds];
    const retrySources = retrySourceIds
      .map((sourceId) => sourceById.get(sourceId))
      .filter((source): source is SourceDescriptor => source !== undefined);

    if (retrySources.length === 0) {
      break;
    }

    for (const sourceId of retrySourceIds) {
      attemptsBySource.set(sourceId, (attemptsBySource.get(sourceId) ?? 0) + 1);
    }

    attempt += 1;
    const retrySnapshot = await executeBrowserRefresh({
      ...refreshOptions,
      sources: retrySources,
    });

    const recoveredSourceIds = mergeRefreshAttempt(accumulator, retrySourceIds, retrySnapshot);
    snapshot = buildSnapshotFromAccumulator(accumulator);
    pendingSourceIds = getRetryableSourceIds(
      snapshot,
      retryableStatuses,
      attemptsBySource,
      maxAttempts,
    );

    stabilization?.onAttemptComplete?.({
      attempt,
      attemptedSourceIds: retrySourceIds,
      pendingSourceIds,
      recoveredSourceIds,
      snapshot,
    });
  }

  return snapshot;
}
