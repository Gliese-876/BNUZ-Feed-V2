import { normalizeText } from "../parsers/html";
import { baseUrl, targetSpecs } from "./targets/lxsy";
export { lxsyFetchTargets } from "./targets/lxsy";

import type { RawPage } from "@bnuz-feed/contracts";

import {
  createConfiguredHtmlListParser,
  type HtmlListParserConfig,
} from "../parsers/configuredHtmlListParser";

const datePatternParts = [
  "(\\d{4}[-/]\\d{2}[-/]\\d{2})",
  "(\\d{1,2}\\s*月\\s*\\d{1,2}\\s*日)",
  "(\\d{2}[-/]\\d{2})",
];

const leadingDatePattern = new RegExp(`^${datePatternParts.join("|")}(?:\\s+|\\s*\\|\\s*|\\s*丨\\s*)`);
const trailingDatePattern = new RegExp(`(?:\\s+|\\s*\\|\\s*|\\s*丨\\s*)${datePatternParts.join("|")}$`);
const dateFinderPattern = new RegExp(datePatternParts.join("|"));

function normalizeDateToken(value: string): string {
  const normalized = value.replace(/\s+/g, "");
  const yearMatch = normalized.match(/^(\d{4})[-/](\d{2})[-/](\d{2})$/);
  if (yearMatch) {
    const [, year = "", month = "", day = ""] = yearMatch;
    return `${year}-${month}-${day}`;
  }

  const monthDayMatch = normalized.match(/^(\d{1,2})月(\d{1,2})日$/);
  if (monthDayMatch) {
    const [, month = "", day = ""] = monthDayMatch;
    return `${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const shortMatch = normalized.match(/^(\d{2})[-/](\d{2})$/);
  if (shortMatch) {
    const [, month = "", day = ""] = shortMatch;
    return `${month}-${day}`;
  }

  return normalized.replace(/\//g, "-");
}

function extractPublishedAt(text: string | null | undefined): string | undefined {
  const normalized = normalizeText(text);
  if (!normalized) {
    return undefined;
  }

  const leadingMatch = normalized.match(leadingDatePattern);
  if (leadingMatch) {
    const token = leadingMatch.slice(1).find(Boolean);
    return token ? normalizeDateToken(token) : undefined;
  }

  const trailingMatch = normalized.match(trailingDatePattern);
  if (trailingMatch) {
    const token = trailingMatch.slice(1).find(Boolean);
    return token ? normalizeDateToken(token) : undefined;
  }

  const anywhereMatch = normalized.match(dateFinderPattern);
  return anywhereMatch ? normalizeDateToken(anywhereMatch[0]) : undefined;
}

function stripPublishedAt(text: string | null | undefined): string | undefined {
  const normalized = normalizeText(text);
  if (!normalized) {
    return undefined;
  }

  const strippedLeading = normalized.replace(leadingDatePattern, "");
  const strippedTrailing = strippedLeading.replace(trailingDatePattern, "");
  return normalizeText(strippedTrailing?.replace(/[|丨\-—:：]+$/g, ""));
}

function isSupportedItem(href: string | null, page: Pick<RawPage, "finalUrl" | "requestUrl">, pathPrefix: string): boolean {
  if (!href) {
    return false;
  }

  if (/^https?:\/\/mp\.weixin\.qq\.com\//i.test(href)) {
    return true;
  }

  try {
    const resolved = new URL(href, page.finalUrl || page.requestUrl || baseUrl);
    return resolved.pathname.startsWith(pathPrefix);
  } catch {
    return false;
  }
}

const parserConfig: HtmlListParserConfig = {
  parserKey: "bnuzh/lxsy",
  targets: targetSpecs.map((target) => ({
    requestId: target.requestId,
    itemSelector: "body a[href]",
    channel: target.channel,
    title: (item) => stripPublishedAt(item.textContent),
    url: { attr: "href" },
    publishedAt: (item) => extractPublishedAt(item.textContent),
    rawId: { attr: "href" },
    limit: 20,
    itemFilter: (item, page) =>
      isSupportedItem(item.getAttribute("href"), page, target.pathPrefix) &&
      Boolean(extractPublishedAt(item.textContent)),
  })),
};

export const lxsyParser = createConfiguredHtmlListParser(parserConfig);
