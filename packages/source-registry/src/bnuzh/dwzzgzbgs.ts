import { normalizeText } from "../parsers/html";
import { targetSpecs } from "./targets/dwzzgzbgs";
export { dwzzgzbgsFetchTargets } from "./targets/dwzzgzbgs";

import { createConfiguredHtmlListParser } from "../parsers/configuredHtmlListParser";

function normalizeDateToken(value: string): string {
  const compact = value.replace(/\s+/g, "");

  const isoMatch = compact.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})$/);
  if (isoMatch) {
    const [, year = "", month = "", day = ""] = isoMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const cnMatch = compact.match(/^(\d{4})\u5e74(\d{1,2})\u6708(\d{1,2})\u65e5?$/);
  if (cnMatch) {
    const [, year = "", month = "", day = ""] = cnMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const monthDayMatch = compact.match(/^(\d{1,2})\u6708\/?(\d{1,2})\u65e5?$/);
  if (monthDayMatch) {
    const [, month = "", day = ""] = monthDayMatch;
    return `${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const shortMatch = compact.match(/^(\d{1,2})[-/](\d{1,2})$/);
  if (shortMatch) {
    const [, month = "", day = ""] = shortMatch;
    return `${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  return compact.replace(/\//g, "-");
}

function extractDateToken(value: string | null | undefined): string | undefined {
  const normalized = normalizeText(value);
  if (!normalized) {
    return undefined;
  }

  const patterns = [
    /(\d{4}\s*[./-]\s*\d{1,2}\s*[./-]\s*\d{1,2})/,
    /(\d{4}\s*\u5e74\s*\d{1,2}\s*\u6708\s*\d{1,2}\s*\u65e5?)/,
    /(\d{1,2}\s*\u6708\s*\/?\s*\d{1,2}\s*\u65e5?)/,
    /(\d{1,2}\s*[-/]\s*\d{1,2})/,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match) {
      return normalizeDateToken(match[1] ?? match[0]);
    }
  }

  return undefined;
}

function stripDateText(value: string | null | undefined): string | undefined {
  const normalized = normalizeText(value);
  if (!normalized) {
    return undefined;
  }

  const leadingPatterns = [
    /^\d{4}\s*[./-]\s*\d{1,2}\s*[./-]\s*\d{1,2}(?:\s*[|/\\-]\s*)?/,
    /^\d{4}\s*\u5e74\s*\d{1,2}\s*\u6708\s*\d{1,2}\s*\u65e5?(?:\s*[|/\\-]\s*)?/,
    /^\d{1,2}\s*\u6708\s*\/?\s*\d{1,2}\s*\u65e5?(?:\s*[|/\\-]\s*)?/,
    /^\d{1,2}\s*[-/]\s*\d{1,2}(?:\s*[|/\\-]\s*)?/,
  ];

  const trailingPatterns = [
    /(?:\s*[|/\\-]\s*)?\d{4}\s*[./-]\s*\d{1,2}\s*[./-]\s*\d{1,2}$/,
    /(?:\s*[|/\\-]\s*)?\d{4}\s*\u5e74\s*\d{1,2}\s*\u6708\s*\d{1,2}\s*\u65e5?$/,
    /(?:\s*[|/\\-]\s*)?\d{1,2}\s*\u6708\s*\/?\s*\d{1,2}\s*\u65e5?$/,
    /(?:\s*[|/\\-]\s*)?\d{1,2}\s*[-/]\s*\d{1,2}$/,
  ];

  for (const pattern of leadingPatterns) {
    if (pattern.test(normalized)) {
      return normalizeText(normalized.replace(pattern, ""));
    }
  }

  for (const pattern of trailingPatterns) {
    if (pattern.test(normalized)) {
      return normalizeText(normalized.replace(pattern, ""));
    }
  }

  return normalized;
}

function isContentItem(item: Element): boolean {
  return Boolean(
    item.closest(
      "ul.common-article-list, ul.common-article-list2, ul.notice-list, ul.team-news-list, .dynamic-list, .notice-list, .team-news-list",
    ),
  );
}

function resolveTitle(item: Element): string | undefined {
  const explicitTitle =
    item.querySelector(".title, .article-title, .name, .item-title, h1, h2, h3, p:not(.summary), span:not(.summary):not(.time):not(.date)") ?? undefined;

  if (explicitTitle) {
    const text = normalizeText(explicitTitle.textContent);
    if (text) {
      return text;
    }
  }

  for (const child of Array.from(item.children)) {
    if (child.matches(".summary, .time, .date, .publish-time, .article-date")) {
      continue;
    }

    const text = normalizeText(child.textContent);
    if (!text) {
      continue;
    }

    const date = extractDateToken(text);
    if (date && text === date) {
      continue;
    }

    return stripDateText(text) ?? text;
  }

  return stripDateText(item.textContent);
}

function resolveSummary(item: Element): string | undefined {
  const summary = item.querySelector(".summary, .article-summary, .desc, .excerpt");
  return normalizeText(summary?.textContent);
}

function resolvePublishedAt(item: Element): string | undefined {
  const dateNode = item.querySelector(".time, time, .date, .publish-time, .article-date, .common-calendar");
  const explicitDate = extractDateToken(dateNode?.textContent);
  if (explicitDate) {
    return explicitDate;
  }

  return extractDateToken(item.textContent);
}

function resolveUrl(item: Element): string | undefined {
  return normalizeText(item.getAttribute("href"));
}

export const dwzzgzbgsParser = createConfiguredHtmlListParser({
  parserKey: "bnuzh/dwzzgzbgs",
  targets: targetSpecs.map((target) => ({
    requestId: target.requestId,
    itemSelector: "a.item",
    channel: target.channel,
    title: resolveTitle,
    url: resolveUrl,
    publishedAt: resolvePublishedAt,
    summary: resolveSummary,
    rawId: resolveUrl,
    limit: 30,
    itemFilter: (item) => isContentItem(item) && Boolean(resolveTitle(item)) && Boolean(resolveUrl(item)),
  })),
});
