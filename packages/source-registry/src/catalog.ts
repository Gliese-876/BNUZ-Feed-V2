export { bnuzhSources, publicBnuzhSources } from "./bnuzhSources";
export { officialBnuzhSites } from "./bnuzhSites";
export type { OfficialBnuzhSite } from "./bnuzhSites";
import networkPolicy from "./networkPolicy.json";

// These official hosts resolve to campus addresses and cannot be refreshed by public CI runners.
export const campusOnlySourceIds: readonly string[] = networkPolicy.campusOnlySourceIds;
