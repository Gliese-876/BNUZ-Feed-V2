export { dedupeFeedItems, sortFeedItems } from "./dedupe";
export { hashText } from "./hash";
export { createDefaultNormalizer } from "./normalizer";
export {
  createRawOccurrence,
  createSourceScopedItem,
  getRawCount,
  getRawOccurrences,
  mergeRawOccurrences,
  normalizeOccurrenceChannel,
  sumRawItemCounts,
} from "./rawOccurrences";
export { createLayeredAggregationService } from "./service";
export { createEmptySnapshot, cloneSnapshot, withFreshness } from "./snapshot";
export type { LayeredAggregationServiceOptions } from "./service";
