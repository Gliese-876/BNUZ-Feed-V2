import type { FeedItem, Normalizer, SourceRecord } from "@bnuz-feed/contracts";

import { hashText } from "./hash";
import { createRawOccurrence } from "./rawOccurrences";

function normalizeText(value: string | undefined): string {
  return (value ?? "").trim().replace(/\s+/g, " ");
}

function normalizeUrl(value: string): string {
  try {
    const url = new URL(value);
    url.hash = "";
    return url.toString();
  } catch {
    return value.trim();
  }
}

function createCanonicalKey(record: SourceRecord): string {
  const normalizedUrl = normalizeUrl(record.rawUrl);
  const normalizedTitle = normalizeText(record.rawTitle).toLowerCase();
  const normalizedTime = normalizeText(record.rawPublishedAt);
  const rawId = normalizeText(record.rawId);

  return [normalizedUrl, normalizedTitle, normalizedTime, rawId].filter(Boolean).join("|");
}

export function createDefaultNormalizer(): Normalizer {
  return {
    normalize(record: SourceRecord): FeedItem {
      const canonicalKey = createCanonicalKey(record);

      return {
        id: hashText(canonicalKey),
        sourceId: record.sourceId,
        sourceIds: [record.sourceId],
        title: normalizeText(record.rawTitle),
        url: normalizeUrl(record.rawUrl),
        publishedAt: record.rawPublishedAt,
        channel: record.rawChannel,
        summary: record.rawSummary,
        fetchedAt: new Date().toISOString(),
        freshness: "live",
        rawCount: 1,
        rawOccurrences: [createRawOccurrence(record.sourceId, record.rawChannel)],
      };
    },
  };
}
