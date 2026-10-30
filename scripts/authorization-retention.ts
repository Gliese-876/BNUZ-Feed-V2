import type { FeedSnapshot, SourceDescriptor } from "@bnuz-feed/contracts";
import { retainCampusSources } from "./retain-campus-sources";

/** Explicit operator policy only; never infer permission from network failures. */
export function authorizationSkippedIds(raw: string | undefined, sources: readonly SourceDescriptor[], campusIds: readonly string[]): string[] {
  const value: unknown = raw ? JSON.parse(raw) : [];
  if (!Array.isArray(value) || value.some((id) => typeof id !== "string") || new Set(value).size !== value.length) {
    throw new Error("Authorization skip policy must be a unique array of source IDs.");
  }
  const ids = value as string[];
  const publicIds = sources.map((source) => source.id).filter((id) => !campusIds.includes(id));
  if (ids.some((id) => !publicIds.includes(id))) throw new Error("Authorization skip policy contains unknown or campus source IDs.");
  if (ids.length >= publicIds.length) throw new Error("At least one public source must be refreshed.");
  return ids;
}

export function retainAuthorizationSources(refreshed: FeedSnapshot, previous: FeedSnapshot, ids: readonly string[]): FeedSnapshot {
  const result = retainCampusSources(refreshed, previous, ids);
  for (const id of ids) {
    const health = result.sourceHealth[id]!;
    health.retentionReason = "authorization_required";
    health.message = `Authorization required. Source not contacted; retained public data from ${health.lastSuccessAt}.`;
  }
  return result;
}

export function selectRefreshSources(sources: readonly SourceDescriptor[], campusIds: readonly string[], skippedIds: readonly string[], publicOnly: boolean): SourceDescriptor[] {
  if (!publicOnly && skippedIds.length) throw new Error("Authorization skips require public-only mode.");
  return sources.filter((source) => !publicOnly || (!campusIds.includes(source.id) && !skippedIds.includes(source.id)));
}
