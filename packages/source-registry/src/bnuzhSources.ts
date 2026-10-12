import type { SourceDescriptor } from "@bnuz-feed/contracts";

import { officialBnuzhSites } from "./bnuzhSites";
import { implementedBnuzhFetchTargets } from "./bnuzh/targets";

// Keep the official identity for search while the archived site's new host has no DNS record.
// The English IO identity currently shares a Chinese homepage and has no published English entry.
const suspendedParserKeys = new Set(["bnuzh/bjsfdxzxxy", "bnuzh/gjjlyhzbgsyww"]);

export const bnuzhSources: SourceDescriptor[] = officialBnuzhSites.flatMap((site) => {
  if (!site.pubUrl || !site.path) return [];
  const parserKey = `bnuzh/${site.path === "zhb" ? "zhgwh" : site.path}`;
  const enabled = !suspendedParserKeys.has(parserKey);
  const fetchTargets = enabled ? implementedBnuzhFetchTargets[parserKey] : undefined;
  return [{
    id: site.id,
    name: site.name,
    entryUrls: [site.pubUrl],
    parserKey,
    enabled,
    fetchTargets,
    capabilities: { browserFetch: Boolean(fetchTargets?.length), snapshotFallback: true },
  }];
});

export const publicBnuzhSources = bnuzhSources.filter(
  (source) => (source.fetchTargets?.length ?? 0) > 0,
);
