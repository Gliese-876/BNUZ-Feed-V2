import {
  AggregationError,
  type FeedItem,
  type FeedItemOccurrence,
  type FeedSnapshot,
  type FeedSource,
  type SourceHealth,
} from "@bnuz-feed/contracts";

export interface SnapshotSourceOptions {
  feedSnapshotUrl: string;
  sourceHealthUrl: string;
  fetchFn?: typeof fetch;
}

function normalizeOccurrenceCount(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 1;
  }

  return Math.max(1, Math.floor(value));
}

function normalizeChannel(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function normalizeRawOccurrences(record: Partial<FeedItem>): FeedItemOccurrence[] {
  if (Array.isArray(record.rawOccurrences) && record.rawOccurrences.length > 0) {
    return record.rawOccurrences.map((occurrence) => {
      const entry = occurrence as Partial<FeedItemOccurrence>;

      return {
        sourceId: String(entry.sourceId ?? record.sourceId ?? ""),
        channel: normalizeChannel(entry.channel),
        count: normalizeOccurrenceCount(entry.count),
      };
    });
  }

  const sourceIds =
    Array.isArray(record.sourceIds) && record.sourceIds.length > 0
      ? record.sourceIds.map(String)
      : [String(record.sourceId ?? "")];

  if (sourceIds.length <= 1) {
    return [
      {
        sourceId: sourceIds[0] ?? String(record.sourceId ?? ""),
        channel: normalizeChannel(record.channel),
        count: normalizeOccurrenceCount(record.rawCount),
      },
    ];
  }

  return sourceIds.map((sourceId) => ({
    sourceId,
    channel: normalizeChannel(record.channel),
    count: 1,
  }));
}

function normalizeItems(items: unknown[]): FeedItem[] {
  return items.map((item) => {
    const record = item as Partial<FeedItem>;
    const rawOccurrences = normalizeRawOccurrences(record);

    return {
      id: String(record.id ?? ""),
      sourceId: String(record.sourceId ?? ""),
      sourceIds: Array.isArray(record.sourceIds)
        ? record.sourceIds.map(String)
        : [String(record.sourceId ?? "")],
      title: String(record.title ?? ""),
      url: String(record.url ?? ""),
      publishedAt: record.publishedAt,
      channel: record.channel,
      summary: record.summary,
      fetchedAt: String(record.fetchedAt ?? new Date().toISOString()),
      freshness: "snapshot",
      rawCount: rawOccurrences.reduce((total, occurrence) => total + occurrence.count, 0),
      rawOccurrences,
    };
  });
}

function normalizeSourceHealthMap(sourceHealth: unknown): Record<string, SourceHealth> {
  if (!sourceHealth || typeof sourceHealth !== "object") {
    return {};
  }

  return Object.fromEntries(
    Object.entries(sourceHealth as Record<string, Partial<SourceHealth>>).map(([sourceId, entry]) => [
      sourceId,
      {
        sourceId,
        status: entry.status ?? "snapshot",
        checkedAt: entry.checkedAt ?? new Date().toISOString(),
        itemCount: entry.itemCount ?? 0,
        message: entry.message,
        errorCode: entry.errorCode,
        lastSuccessAt: entry.lastSuccessAt,
        requestUrl: entry.requestUrl,
      },
    ]),
  );
}

export function createSnapshotSource(options: SnapshotSourceOptions): FeedSource {
  const fetchFn = options.fetchFn ?? fetch;

  async function loadSnapshot(): Promise<FeedSnapshot> {
    const snapshotResponse = await fetchFn(options.feedSnapshotUrl);

    if (!snapshotResponse.ok) {
      throw new AggregationError(
        "SNAPSHOT_FAILED",
        `Snapshot request failed with ${snapshotResponse.status}.`,
      );
    }

    const snapshotJson = (await snapshotResponse.json()) as Partial<FeedSnapshot>;
    let sourceHealth = normalizeSourceHealthMap(snapshotJson.sourceHealth);

    try {
      const healthResponse = await fetchFn(options.sourceHealthUrl);
      if (healthResponse.ok) {
        sourceHealth = normalizeSourceHealthMap(await healthResponse.json());
      }
    } catch {
      // Sidecar health data is optional.
    }

    return {
      version: snapshotJson.version ?? 1,
      updatedAt: snapshotJson.updatedAt ?? new Date().toISOString(),
      origin: "snapshot",
      items: normalizeItems(Array.isArray(snapshotJson.items) ? snapshotJson.items : []),
      sourceHealth,
    };
  }

  return {
    bootstrap() {
      return loadSnapshot();
    },

    refresh() {
      return loadSnapshot();
    },
  };
}
