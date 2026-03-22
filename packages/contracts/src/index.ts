export type SourceId = string;

export type FeedFreshness = "live" | "cache" | "snapshot";

export type SourceHealthStatus =
  | "idle"
  | "loading"
  | "live"
  | "cache"
  | "snapshot"
  | "empty"
  | "timeout"
  | "cors"
  | "network_error"
  | "parser_error"
  | "parser_not_implemented";

export type AggregationErrorCode =
  | "FETCH_TIMEOUT"
  | "FETCH_FAILED"
  | "CORS_BLOCKED"
  | "PARSER_FAILED"
  | "PARSER_NOT_IMPLEMENTED"
  | "EMPTY_RESULT"
  | "WORKER_FAILED"
  | "SNAPSHOT_FAILED";

export interface FetchTarget {
  id: string;
  url: string;
  channel?: string;
}

export interface SourceDescriptor {
  id: SourceId;
  name: string;
  entryUrls: string[];
  fetchTargets?: FetchTarget[];
  parserKey: string;
  enabled: boolean;
  capabilities: {
    browserFetch: boolean;
    snapshotFallback: boolean;
  };
}

export interface RawPage {
  sourceId: SourceId;
  requestId: string;
  requestUrl: string;
  finalUrl: string;
  fetchedAt: string;
  contentType?: string;
  bodyText: string;
  channel?: string;
}

export interface SourceRecord {
  sourceId: SourceId;
  rawId?: string;
  rawTitle: string;
  rawUrl: string;
  rawPublishedAt?: string;
  rawChannel?: string;
  rawSummary?: string;
  extras?: Record<string, unknown>;
}

export interface FeedItem {
  id: string;
  sourceId: SourceId;
  sourceIds: SourceId[];
  title: string;
  url: string;
  publishedAt?: string;
  channel?: string;
  summary?: string;
  fetchedAt: string;
  freshness: FeedFreshness;
}

export interface SourceHealth {
  sourceId: SourceId;
  status: SourceHealthStatus;
  checkedAt: string;
  itemCount: number;
  message?: string;
  errorCode?: AggregationErrorCode;
  lastSuccessAt?: string;
  requestUrl?: string;
}

export interface FeedSnapshot {
  version: number;
  updatedAt: string;
  origin: FeedFreshness;
  items: FeedItem[];
  sourceHealth: Record<SourceId, SourceHealth>;
}

export interface Fetcher {
  fetch(source: SourceDescriptor): Promise<RawPage[]>;
}

export interface Parser {
  parse(page: RawPage): Promise<SourceRecord[]>;
}

export interface Normalizer {
  normalize(record: SourceRecord): FeedItem;
}

export interface ParserRegistry {
  get(parserKey: string): Parser | undefined;
}

export interface Repository {
  load(): Promise<FeedSnapshot | null>;
  save(snapshot: FeedSnapshot): Promise<void>;
}

export interface AggregationService {
  bootstrap(): Promise<FeedSnapshot | null>;
  refresh(sourceIds?: SourceId[]): Promise<FeedSnapshot>;
  getSnapshot(): FeedSnapshot | null;
  subscribe(listener: () => void): () => void;
}

export interface FeedSource {
  bootstrap?(): Promise<FeedSnapshot | null>;
  refresh(sourceIds?: SourceId[]): Promise<FeedSnapshot>;
}

export interface BrowserWorkerRefreshOptions {
  timeoutMs: number;
  concurrency: number;
  targetConcurrency?: number;
}

export interface BrowserWorkerRefreshRequest {
  sources: SourceDescriptor[];
  options: BrowserWorkerRefreshOptions;
}

export type BrowserWorkerCommand = {
  type: "refresh";
  payload: BrowserWorkerRefreshRequest;
};

export type BrowserWorkerResponse =
  | {
      type: "completed";
      payload: FeedSnapshot;
    }
  | {
      type: "failed";
      payload: {
        message: string;
      };
    };

export class AggregationError extends Error {
  code: AggregationErrorCode;
  details?: Record<string, unknown>;

  constructor(code: AggregationErrorCode, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = "AggregationError";
    this.code = code;
    this.details = details;
  }
}
