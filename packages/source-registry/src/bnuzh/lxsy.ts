import type { FetchTarget, RawPage } from "@bnuz-feed/contracts";

import {
  createConfiguredHtmlListParser,
  type HtmlListParserConfig,
} from "../parsers/configuredHtmlListParser";

interface LxsyTargetSpec {
  requestId: string;
  url: string;
  channel: string;
  pathPrefix: string;
}

const baseUrl = "https://lixing.bnuzh.edu.cn/";

const targetSpecs: LxsyTargetSpec[] = [
  {
    requestId: "xwdt",
    url: `${baseUrl}xwdt/index1.htm`,
    channel: "新闻动态",
    pathPrefix: "/xwdt/",
  },
  {
    requestId: "tzgg",
    url: `${baseUrl}tzgg/index.htm`,
    channel: "通知公告",
    pathPrefix: "/tzgg/",
  },
  {
    requestId: "hdyg",
    url: `${baseUrl}hdyg/index.htm`,
    channel: "活动预告",
    pathPrefix: "/hdyg/",
  },
  {
    requestId: "lxgy",
    url: `${baseUrl}lxgy/index.htm`,
    channel: "砺行光影",
    pathPrefix: "/lxgy/",
  },
  {
    requestId: "xssw/btjs",
    url: `${baseUrl}xssw/btjs/index.htm`,
    channel: "班团建设",
    pathPrefix: "/xssw/btjs/",
  },
  {
    requestId: "xssw/xsdj",
    url: `${baseUrl}xssw/xsdj/index.htm`,
    channel: "学生党建",
    pathPrefix: "/xssw/xsdj/",
  },
  {
    requestId: "xssw/txfc",
    url: `${baseUrl}xssw/txfc/index.htm`,
    channel: "团学风采",
    pathPrefix: "/xssw/txfc/",
  },
  {
    requestId: "xssw/xssq",
    url: `${baseUrl}xssw/xssq/index.htm`,
    channel: "学生社群",
    pathPrefix: "/xssw/xssq/",
  },
  {
    requestId: "xssw/xyfz",
    url: `${baseUrl}xssw/xyfz/index.htm`,
    channel: "学业发展",
    pathPrefix: "/xssw/xyfz/",
  },
  {
    requestId: "xssw/xsjz",
    url: `${baseUrl}xssw/xsjz/index.htm`,
    channel: "学生奖助",
    pathPrefix: "/xssw/xsjz/",
  },
  {
    requestId: "xssw/gfjy",
    url: `${baseUrl}xssw/gfjy/index.htm`,
    channel: "国防教育",
    pathPrefix: "/xssw/gfjy/",
  },
  {
    requestId: "xssw/xkfw",
    url: `${baseUrl}xssw/xkfw/index.htm`,
    channel: "心康服务",
    pathPrefix: "/xssw/xkfw/",
  },
  {
    requestId: "xssw/sjjl",
    url: `${baseUrl}xssw/sjjl/index.htm`,
    channel: "实践交流",
    pathPrefix: "/xssw/sjjl/",
  },
  {
    requestId: "xssw/jyfw",
    url: `${baseUrl}xssw/jyfw/index.htm`,
    channel: "就业服务",
    pathPrefix: "/xssw/jyfw/",
  },
  {
    requestId: "syfw/gzzd",
    url: `${baseUrl}syfw/gzzd/index.htm`,
    channel: "规章制度",
    pathPrefix: "/syfw/gzzd/",
  },
  {
    requestId: "syfw/bszn",
    url: `${baseUrl}syfw/bszn/index.htm`,
    channel: "办事指南",
    pathPrefix: "/syfw/bszn/",
  },
  {
    requestId: "syfw/cyxz",
    url: `${baseUrl}syfw/cyxz/index.htm`,
    channel: "常用下载",
    pathPrefix: "/syfw/cyxz/",
  },
];

const datePatternParts = [
  "(\\d{4}[-/]\\d{2}[-/]\\d{2})",
  "(\\d{1,2}\\s*月\\s*\\d{1,2}\\s*日)",
  "(\\d{2}[-/]\\d{2})",
];

const leadingDatePattern = new RegExp(`^${datePatternParts.join("|")}(?:\\s+|\\s*\\|\\s*|\\s*丨\\s*)`);
const trailingDatePattern = new RegExp(`(?:\\s+|\\s*\\|\\s*|\\s*丨\\s*)${datePatternParts.join("|")}$`);
const dateFinderPattern = new RegExp(datePatternParts.join("|"));

function normalizeText(value: string | null | undefined): string | undefined {
  const normalized = value?.replace(/\s+/g, " ").trim();
  return normalized ? normalized : undefined;
}

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

export const lxsyFetchTargets: FetchTarget[] = targetSpecs.map((target) => ({
  id: target.requestId,
  url: target.url,
  channel: target.channel,
}));

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
