import type { FetchTarget } from "@bnuz-feed/contracts";

import { createConfiguredHtmlListParser, type HtmlListParserConfig } from "../parsers/configuredHtmlListParser";

type TargetSpec = {
  requestId: string;
  path: string;
  channel: string;
};

const baseUrl = "https://djjd.bnuzh.edu.cn";

const targetSpecs: TargetSpec[] = [
  { requestId: "zydt", path: "zydt/index.htm", channel: "\u91cd\u8981\u52a8\u6001" },
  { requestId: "twdt", path: "twdt/index.htm", channel: "\u56fe\u6587\u52a8\u6001" },
  { requestId: "gzdt", path: "gzdt/index.htm", channel: "\u5de5\u4f5c\u52a8\u6001" },
  { requestId: "tzgg", path: "tzgg/index.htm", channel: "\u901a\u77e5\u516c\u544a" },
  { requestId: "xxzl", path: "xxzl/index.htm", channel: "\u5b66\u4e60\u8d44\u6599" },
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

  const cnMatch = compact.match(/^(\d{4})\u5e74(\d{1,2})\u6708(\d{1,2})\u65e5$/);
  if (cnMatch) {
    const [, year = "", month = "", day = ""] = cnMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const shortMatch = compact.match(/^(\d{1,2})\u6708(\d{1,2})\u65e5$/);
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
    /(\d{4}\s*\u5e74\s*\d{1,2}\s*\u6708\s*\d{1,2}\s*\u65e5)/,
    /(\d{1,2}\s*\u6708\s*\d{1,2}\s*\u65e5)/,
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
    /^\d{4}\s*\u5e74\s*\d{1,2}\s*\u6708\s*\d{1,2}\s*\u65e5(?:\s*[|/\\-]\s*)?/,
    /^\d{1,2}\s*\u6708\s*\d{1,2}\s*\u65e5(?:\s*[|/\\-]\s*)?/,
  ];

  const trailingPatterns = [
    /(?:\s*[|/\\-]\s*)?\d{4}\s*[./-]\s*\d{1,2}\s*[./-]\s*\d{1,2}$/,
    /(?:\s*[|/\\-]\s*)?\d{4}\s*\u5e74\s*\d{1,2}\s*\u6708\s*\d{1,2}\s*\u65e5$/,
    /(?:\s*[|/\\-]\s*)?\d{1,2}\s*\u6708\s*\d{1,2}\s*\u65e5$/,
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

const parserConfig: HtmlListParserConfig = {
  parserKey: "bnuzh/xddjjdgjztw",
  targets: targetSpecs.map((target) => ({
    requestId: target.requestId,
    itemSelector: "div.container.my-3.my-lg-5 .channel-article-list > li > a.link",
    channel: target.channel,
    title: (item) => stripDateText(item.textContent),
    url: { attr: "href" },
    publishedAt: (item) => extractDateToken(item.textContent),
    rawId: { attr: "href" },
    limit: 50,
  })),
};

export const xddjjdgjztwFetchTargets: FetchTarget[] = targetSpecs.map((target) => ({
  id: target.requestId,
  url: `${baseUrl}/${target.path}`,
  channel: target.channel,
}));

export const xddjjdgjztwParser = createConfiguredHtmlListParser(parserConfig);
