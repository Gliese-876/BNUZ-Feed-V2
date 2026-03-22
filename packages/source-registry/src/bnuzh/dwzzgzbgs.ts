import type { FetchTarget } from "@bnuz-feed/contracts";

import { createConfiguredHtmlListParser } from "../parsers/configuredHtmlListParser";

type TargetSpec = {
  requestId: string;
  path: string;
  channel: string;
};

const baseUrl = "https://dwzgb.bnuzh.edu.cn/";

const targetSpecs: TargetSpec[] = [
  { requestId: "sygzdt", path: "sygzdt/index.htm", channel: "工作动态" },
  { requestId: "sytzgg", path: "sytzgg/index.htm", channel: "通知公告" },
  { requestId: "dwjs", path: "dwjs/index.htm", channel: "队伍建设" },
  { requestId: "djgz/gzdt", path: "djgz/gzdt/index.htm", channel: "工作动态" },
  { requestId: "djgz/tzgg", path: "djgz/tzgg/index.htm", channel: "通知公告" },
  { requestId: "gbgz/gbpy", path: "gbgz/gbpy/index.htm", channel: "干部培养" },
  { requestId: "gbgz/gbgl", path: "gbgz/gbgl/index.htm", channel: "干部管理" },
  { requestId: "zdwj", path: "zdwj/index.htm", channel: "制度文件" },
  { requestId: "xzzq", path: "xzzq/index.htm", channel: "下载专区" },
  { requestId: "cjwd", path: "cjwd/index.htm", channel: "常见问答" },
];

function normalizeText(value: string | null | undefined): string | undefined {
  const normalized = value?.replace(/\s+/g, " ").trim();
  return normalized ? normalized : undefined;
}

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

export const dwzzgzbgsFetchTargets: FetchTarget[] = targetSpecs.map((target) => ({
  id: target.requestId,
  url: `${baseUrl}${target.path}`,
  channel: target.channel,
}));

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
