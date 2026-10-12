import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { officialBnuzhSites, type OfficialBnuzhSite } from "@bnuz-feed/source-registry/catalog";

export const officialSiteListUrl = "https://www.bnuzh.edu.cn/cms/web/search/index.jsp";
type SiteMetadata = Pick<OfficialBnuzhSite, "id" | "name" | "pubUrl" | "path">;

export function parseOfficialSiteList(html: string): SiteMetadata[] {
  const assignment = /\b(?:var|let|const)\s+siteList\s*=\s*\[/.exec(html);
  if (!assignment) throw new Error("Official search page no longer contains a siteList JSON array.");

  const start = assignment.index + assignment[0].lastIndexOf("[");
  let depth = 0;
  let quoted = false;
  let escaped = false;
  let end = -1;
  for (let index = start; index < html.length; index += 1) {
    const character = html[index];
    if (quoted) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === '"') quoted = false;
    } else if (character === '"') quoted = true;
    else if (character === "[") depth += 1;
    else if (character === "]" && --depth === 0) {
      end = index + 1;
      break;
    }
  }
  if (end === -1) throw new Error("Official siteList JSON array is incomplete.");

  const entries: unknown = JSON.parse(html.slice(start, end));
  if (!Array.isArray(entries) || entries.length === 0) throw new Error("Official siteList is empty.");
  const ids = new Set<string>();
  return entries.map((entry: unknown) => {
    if (!entry || typeof entry !== "object") throw new Error("Official siteList contains an invalid entry.");
    const { id, name, pubUrl, path } = entry as Record<string, unknown>;
    if (typeof id !== "string" || !id.trim() || typeof name !== "string" || !name.trim()) {
      throw new Error("Official siteList entry is missing its id or name.");
    }
    if (ids.has(id)) throw new Error(`Official siteList contains duplicate id ${id}.`);
    ids.add(id);
    if (pubUrl !== undefined && (typeof pubUrl !== "string" || !/^https?:\/\//i.test(pubUrl.trim()))) {
      throw new Error(`Official site ${id} has an invalid pubUrl.`);
    }
    if (path !== undefined && typeof path !== "string") throw new Error(`Official site ${id} has an invalid path.`);
    return {
      id, name: name.trim(),
      pubUrl: typeof pubUrl === "string" ? pubUrl.trim() : undefined,
      path: typeof path === "string" ? path.trim() : undefined,
    };
  });
}

function normalizeUrl(value: string | undefined): string | null {
  return value?.trim().replace(/\/+$/, "") || null;
}

export function compareSourceCatalog(official: SiteMetadata[], registered: SiteMetadata[] = officialBnuzhSites) {
  const registeredById = new Map(registered.map((site) => [site.id, site]));
  const officialById = new Map(official.map((site) => [site.id, site]));
  const changed = official.flatMap((site) => {
    const previous = registeredById.get(site.id);
    if (!previous) return [];
    const fields: Partial<Record<"name" | "pubUrl" | "path", { registered: string | null; official: string | null }>> = {};
    if (site.name.trim() !== previous.name.trim()) {
      fields.name = { registered: previous.name, official: site.name };
    }
    if (normalizeUrl(site.pubUrl) !== normalizeUrl(previous.pubUrl)) {
      fields.pubUrl = { registered: previous.pubUrl ?? null, official: site.pubUrl ?? null };
    }
    if ((site.path?.trim() || null) !== (previous.path?.trim() || null)) {
      fields.path = { registered: previous.path ?? null, official: site.path ?? null };
    }
    return Object.keys(fields).length > 0 ? [{ id: site.id, name: site.name, fields }] : [];
  });

  const added = official.filter((site) => !registeredById.has(site.id));
  const removed = registered.filter((site) => !officialById.has(site.id));
  return {
    officialCount: official.length,
    registeredCount: registered.length,
    officialOptionCount: official.length,
    registeredOptionCount: registered.length,
    officialSiteCount: official.filter((site) => Boolean(site.pubUrl)).length,
    registeredSiteCount: registered.filter((site) => Boolean(site.pubUrl)).length,
    driftCount: added.length + removed.length + changed.length,
    added,
    removed,
    changed,
    withoutPublicUrl: official.filter((site) => !site.pubUrl),
  };
}

export async function fetchOfficialSiteList(options: { fetchFn?: typeof fetch; timeoutMs?: number } = {}) {
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? 10000;
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) throw new Error("Source check timeout must be positive.");
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await (options.fetchFn ?? fetch)(officialSiteListUrl, { signal: controller.signal });
    if (!response.ok) throw new Error(`Official source list request failed with HTTP ${response.status}.`);
    return parseOfficialSiteList(await response.text());
  } catch (error) {
    if (controller.signal.aborted) throw new Error(`Official source list request timed out after ${timeoutMs} ms.`);
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  void fetchOfficialSiteList()
    .then((sites) => {
      const report = { checkedAt: new Date().toISOString(), url: officialSiteListUrl, ...compareSourceCatalog(sites) };
      console.log(JSON.stringify(report, null, 2));
      process.exitCode = report.driftCount > 0 ? 1 : 0;
    })
    .catch((error: unknown) => {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    });
}
