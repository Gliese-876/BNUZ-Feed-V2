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
  sourceHealthUrl?: string;
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
    const occurrences = record.rawOccurrences.filter(isRecord).map((occurrence) => {
      const entry = occurrence as Partial<FeedItemOccurrence>;

      return {
        sourceId: String(entry.sourceId ?? record.sourceId ?? ""),
        channel: normalizeChannel(entry.channel),
        count: normalizeOccurrenceCount(entry.count),
      };
    });
    if (occurrences.length > 0) {
      return occurrences;
    }
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function optionalText(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function normalizeItems(items: unknown[]): FeedItem[] {
  return items.filter(isRecord).map((item) => {
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
      publishedAt: optionalText(record.publishedAt),
      channel: normalizeChannel(record.channel),
      summary: optionalText(record.summary),
      fetchedAt: String(record.fetchedAt ?? new Date().toISOString()),
      freshness: "snapshot",
      rawCount: rawOccurrences.reduce((total, occurrence) => total + occurrence.count, 0),
      rawOccurrences,
    };
  });
}

function normalizeSourceHealthMap(sourceHealth: unknown): Record<string, SourceHealth> {
  if (!isRecord(sourceHealth)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(sourceHealth)
      .filter(([, entry]) => isRecord(entry))
      .map(([sourceId, value]) => {
        const entry = value as Partial<SourceHealth>;
        return [sourceId, {
          sourceId,
          status: entry.status ?? "snapshot",
          checkedAt: optionalText(entry.checkedAt) ?? new Date().toISOString(),
          itemCount: typeof entry.itemCount === "number" && Number.isFinite(entry.itemCount)
            ? Math.max(0, Math.floor(entry.itemCount))
            : 0,
          message: optionalText(entry.message),
          errorCode: entry.errorCode,
          lastSuccessAt: optionalText(entry.lastSuccessAt),
          requestUrl: optionalText(entry.requestUrl),
        }];
      }),
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

    const payload: unknown = await snapshotResponse.json();
    if (!isRecord(payload)) {
      throw new AggregationError("SNAPSHOT_FAILED", "Snapshot payload must be an object.");
    }
    const snapshotJson = payload as Partial<FeedSnapshot>;
    let sourceHealth = normalizeSourceHealthMap(snapshotJson.sourceHealth);

    if (Object.keys(sourceHealth).length === 0 && options.sourceHealthUrl) {
      try {
        const healthResponse = await fetchFn(options.sourceHealthUrl);
        if (healthResponse.ok) {
          sourceHealth = normalizeSourceHealthMap(await healthResponse.json());
        }
      } catch {
        // Sidecar health data is optional for older snapshots.
      }
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
