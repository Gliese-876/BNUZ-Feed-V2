import type { FetchTarget } from "@bnuz-feed/contracts";

import { createConfiguredHtmlListParser, type HtmlListParserConfig } from "../parsers/configuredHtmlListParser";

type TargetSpec = {
  requestId: string;
  path: string;
  channel: string;
};

const baseUrl = "https://nic.bnuzh.edu.cn";

const targetSpecs: TargetSpec[] = [
  { requestId: "tzgg", path: "tzgg/index.htm", channel: "通知公告" },
  { requestId: "tzgg/index1", path: "tzgg/index1.htm", channel: "通知公告" },
  { requestId: "gzzd", path: "gzzd/index.htm", channel: "规章制度" },
  { requestId: "ldgg", path: "aqzl/ldgg/index.htm", channel: "漏洞公告" },
  { requestId: "jsfwzn", path: "bzzn/jsfwzn/index.htm", channel: "教师服务指南" },
  { requestId: "jsfwzn/index1", path: "bzzn/jsfwzn/index1.htm", channel: "教师服务指南" },
  { requestId: "xsfwzn", path: "bzzn/xsfwzn/index.htm", channel: "学生服务指南" },
  { requestId: "xsfwzn/index1", path: "bzzn/xsfwzn/index1.htm", channel: "学生服务指南" },
];

function normalizeText(value: string | null | undefined): string | undefined {
  const normalized = value?.replace(/\s+/g, " ").trim();
  return normalized ? normalized : undefined;
}

function normalizeDateToken(value: string | null | undefined): string | undefined {
  const text = normalizeText(value);
  if (!text) {
    return undefined;
  }

  const compact = text.replace(/\s+/g, "");

  const isoMatch = compact.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})$/);
  if (isoMatch) {
    const [, year = "", month = "", day = ""] = isoMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const monthDayYearMatch = compact.match(/^(\d{1,2})[./-](\d{1,2})(\d{4})$/);
  if (monthDayYearMatch) {
    const [, month = "", day = "", year = ""] = monthDayYearMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const leadingMonthDayYearMatch = compact.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (leadingMonthDayYearMatch) {
    const [, month = "", day = "", year = ""] = leadingMonthDayYearMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const cnMatch = compact.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日?$/);
  if (cnMatch) {
    const [, year = "", month = "", day = ""] = cnMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const monthDayMatch = compact.match(/^(\d{1,2})月(\d{1,2})日?$/);
  if (monthDayMatch) {
    const [, month = "", day = ""] = monthDayMatch;
    return `${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  return undefined;
}

function extractBoundaryDate(text: string | null | undefined): string | undefined {
  const normalized = normalizeText(text);
  if (!normalized) {
    return undefined;
  }

  const leading = normalized.match(
    /^((?:\d{4}[./-]\d{1,2}[./-]\d{1,2})|(?:\d{1,2}[./-]\d{1,2}\s+\d{4})|(?:\d{1,2}[./-]\d{1,2}[./-]\d{4})|(?:\d{4}年\d{1,2}月\d{1,2}日?)|(?:\d{1,2}\s*月\s*\d{1,2}\s*日?))(?:\s+|$)/,
  );

  return leading ? normalizeDateToken(leading[1]) : undefined;
}

function stripBoundaryDate(text: string | null | undefined): string | undefined {
  const normalized = normalizeText(text);
  if (!normalized) {
    return undefined;
  }

  const stripped = normalized.replace(
    /^((?:\d{4}[./-]\d{1,2}[./-]\d{1,2})|(?:\d{1,2}[./-]\d{1,2}\s+\d{4})|(?:\d{1,2}[./-]\d{1,2}[./-]\d{4})|(?:\d{4}年\d{1,2}月\d{1,2}日?)|(?:\d{1,2}\s*月\s*\d{1,2}\s*日?))(?:\s+|$)/,
    "",
  );

  return normalizeText(stripped);
}

function isContentItem(item: Element): boolean {
  return item.closest("ul.BNUlist01") !== null;
}

const parserConfig: HtmlListParserConfig = {
  parserKey: "bnuzh/wlxxzx",
  targets: targetSpecs.map((target) => ({
    requestId: target.requestId,
    itemSelector: "div.subPage a[href]",
    channel: target.channel,
    title: (item) => stripBoundaryDate(item.textContent),
    url: { attr: "href" },
    publishedAt: (item) => extractBoundaryDate(item.textContent),
    rawId: { attr: "href" },
    itemFilter: isContentItem,
  })),
};

export const wlxxzxFetchTargets: FetchTarget[] = targetSpecs.map((target) => ({
  id: target.requestId,
  url: `${baseUrl}/${target.path}`,
  channel: target.channel,
}));

export const wlxxzxParser = createConfiguredHtmlListParser(parserConfig);
