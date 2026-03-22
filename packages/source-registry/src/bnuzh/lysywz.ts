import type { FetchTarget } from "@bnuz-feed/contracts";

import { createConfiguredHtmlListParser, type HtmlListParserConfig } from "../parsers/configuredHtmlListParser";

type TargetSpec = {
  requestId: string;
  path: string;
  channel: string;
  allowedHosts?: string[];
};

const baseUrl = "https://leyu.bnuzh.edu.cn/";

const targetSpecs: TargetSpec[] = [
  { requestId: "zhyw", path: "zhyw/index.htm", channel: "乐育要闻" },
  { requestId: "tzgg", path: "tzgg/index.htm", channel: "通知公告" },
  { requestId: "hdyg", path: "hdyg/index.htm", channel: "活动预告" },
  { requestId: "lyxs", path: "yrts/lyxs/index.htm", channel: "乐育学社" },
  { requestId: "lxxs", path: "yrts/lxxs/index.htm", channel: "凌霄学社" },
  { requestId: "dxxs", path: "yrts/dxxs/index.htm", channel: "笃行学社" },
  { requestId: "lypp", path: "yrts/lypp/index.htm", channel: "乐育品牌" },
  { requestId: "dshd", path: "dshd/index.htm", channel: "导师有约" },
  { requestId: "lygs", path: "lygs/index.htm", channel: "乐育风采" },
  { requestId: "zbfc", path: "djyl/zbfc/index.htm", channel: "支部风采" },
  { requestId: "txfc", path: "txfc/txfc/index.htm", channel: "团学风采" },
  { requestId: "jyfw", path: "syyh/jyfw/index.htm", channel: "就业服务" },
  { requestId: "jysd", path: "syyh/jysd/index.htm", channel: "就业速递" },
  { requestId: "bszn", path: "fwzn/bszn/index.htm", channel: "办事指南" },
  { requestId: "fwgzzd", path: "fwzn/gzzd/index.htm", channel: "服务指南-规章制度", allowedHosts: ["nic.bnuzh.edu.cn"] },
  { requestId: "xyhd", path: "xyzj/xyhd/index.htm", channel: "校友活动" },
  { requestId: "xyzx", path: "xyzj/xyzx/index.htm", channel: "校友资讯" },
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

  const fullMatch = compact.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})$/);
  if (fullMatch) {
    const [, year = "", month = "", day = ""] = fullMatch;
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

  const shortMatch = compact.match(/^(\d{1,2})[-/](\d{1,2})$/);
  if (shortMatch) {
    const [, month = "", day = ""] = shortMatch;
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
    /^((?:\d{4}[./-]\d{1,2}[./-]\d{1,2})|(?:\d{4}年\d{1,2}月\d{1,2}日?)|(?:\d{1,2}\s*月\s*\d{1,2}\s*日?)|(?:\d{1,2}[./-]\d{1,2}))(?:\s*[|丨—:：-]\s*|\s+)?/,
  );
  if (leading) {
    return normalizeDateToken(leading[1]);
  }

  const trailing = normalized.match(
    /(?:\s*[|丨—:：-]\s*|\s+)?((?:\d{4}[./-]\d{1,2}[./-]\d{1,2})|(?:\d{4}年\d{1,2}月\d{1,2}日?)|(?:\d{1,2}\s*月\s*\d{1,2}\s*日?)|(?:\d{1,2}[./-]\d{1,2}))$/,
  );
  if (trailing) {
    return normalizeDateToken(trailing[1]);
  }

  const anywhere = normalized.match(
    /((?:\d{4}[./-]\d{1,2}[./-]\d{1,2})|(?:\d{4}年\d{1,2}月\d{1,2}日?)|(?:\d{1,2}\s*月\s*\d{1,2}\s*日?)|(?:\d{1,2}[./-]\d{1,2}))/,
  );
  return anywhere ? normalizeDateToken(anywhere[1]) : undefined;
}

function stripBoundaryDate(text: string | null | undefined): string | undefined {
  const normalized = normalizeText(text);
  if (!normalized) {
    return undefined;
  }

  const stripped = normalized
    .replace(
      /^((?:\d{4}[./-]\d{1,2}[./-]\d{1,2})|(?:\d{4}年\d{1,2}月\d{1,2}日?)|(?:\d{1,2}\s*月\s*\d{1,2}\s*日?)|(?:\d{1,2}[./-]\d{1,2}))(?:\s*[|丨—:：-]\s*|\s+)?/,
      "",
    )
    .replace(
      /(?:\s*[|丨—:：-]\s*|\s+)?((?:\d{4}[./-]\d{1,2}[./-]\d{1,2})|(?:\d{4}年\d{1,2}月\d{1,2}日?)|(?:\d{1,2}\s*月\s*\d{1,2}\s*日?)|(?:\d{1,2}[./-]\d{1,2}))$/,
      "",
    )
    .replace(/[|丨—:：-]+\s*$/g, "")
    .trim();

  return normalizeText(stripped);
}

function resolveTitle(item: Element): string | undefined {
  const selectors = [".title", ".news-title", ".article-title", ".name", ".fs-2"];

  for (const selector of selectors) {
    const text = stripBoundaryDate(item.querySelector(selector)?.textContent);
    if (text) {
      return text;
    }
  }

  return stripBoundaryDate(item.textContent);
}

function resolveSummary(item: Element): string | undefined {
  const selectors = [".summary", ".desc", ".intro", ".text"];

  for (const selector of selectors) {
    const text = normalizeText(item.querySelector(selector)?.textContent);
    if (text) {
      return text;
    }
  }

  return undefined;
}

function isAllowedItem(
  item: Element,
  page: { finalUrl: string; requestUrl: string },
  pathPrefix: string,
  allowedHosts: string[] = [],
): boolean {
  const href = item.getAttribute("href");
  if (!href) {
    return false;
  }

  if (!extractBoundaryDate(item.textContent)) {
    return false;
  }

  if (/^https?:\/\/mp\.weixin\.qq\.com\//i.test(href)) {
    return true;
  }

  try {
    const resolved = new URL(href, page.finalUrl || page.requestUrl || baseUrl);
    if (allowedHosts.some((host) => resolved.hostname === host)) {
      return true;
    }
    return resolved.pathname.startsWith(pathPrefix);
  } catch {
    return false;
  }
}

const parserConfig: HtmlListParserConfig = {
  parserKey: "bnuzh/lysywz",
  targets: targetSpecs.map((target) => ({
    requestId: target.requestId,
    itemSelector: "a[href]",
    channel: target.channel,
    title: resolveTitle,
    url: { attr: "href" },
    publishedAt: (item) => extractBoundaryDate(item.textContent),
    summary: resolveSummary,
    rawId: { attr: "href" },
    limit: 20,
    itemFilter: (item, page) =>
      isAllowedItem(item, page, `/${target.path.replace(/index\.htm$/, "")}`, target.allowedHosts),
  })),
};

export const lysywzFetchTargets: FetchTarget[] = targetSpecs.map((target) => ({
  id: target.requestId,
  url: `${baseUrl}${target.path}`,
  channel: target.channel,
}));

export const lysywzParser = createConfiguredHtmlListParser(parserConfig);
