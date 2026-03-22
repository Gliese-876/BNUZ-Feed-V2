import { AggregationError, type FeedItem, type FeedSnapshot, type FeedSource, type SourceHealth } from "@bnuz-feed/contracts";

export interface SnapshotSourceOptions {
  feedSnapshotUrl: string;
  sourceHealthUrl: string;
  fetchFn?: typeof fetch;
}

function normalizeItems(items: unknown[]): FeedItem[] {
  return items.map((item) => {
    const record = item as Partial<FeedItem>;
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
