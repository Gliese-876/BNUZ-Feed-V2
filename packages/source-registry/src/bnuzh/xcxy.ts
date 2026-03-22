import type { FetchTarget } from "@bnuz-feed/contracts";

import { createConfiguredHtmlListParser, type HtmlListParserConfig } from "../parsers/configuredHtmlListParser";

type TargetSpec = {
  requestId: string;
  path: string;
  channel: string;
};

const baseUrl = "https://tcc.bnuzh.edu.cn";

const targetSpecs: TargetSpec[] = [
  { requestId: "xwdt/index", path: "xwdt/index.htm", channel: "新闻动态" },
  { requestId: "xwdt/index1", path: "xwdt/index1.htm", channel: "新闻动态" },
  { requestId: "xwdt/index2", path: "xwdt/index2.htm", channel: "新闻动态" },
  { requestId: "xwdt/index3", path: "xwdt/index3.htm", channel: "新闻动态" },
  { requestId: "xydt/index", path: "xyll/xydt/index.htm", channel: "校友动态" },
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

  const cnMatch = compact.match(/^(\d{4})年(\d{1,2})月(\d{1,2})[日号]?$/);
  if (cnMatch) {
    const [, year = "", month = "", day = ""] = cnMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  return undefined;
}

function resolveTitle(item: Element): string | undefined {
  return normalizeText(item.querySelector(".mg-sec-top-post h4 a")?.textContent ?? item.textContent);
}

function resolveRawId(item: Element): string | undefined {
  return normalizeText(item.querySelector(".mg-sec-top-post h4 a")?.getAttribute("href"));
}

function resolvePublishedAt(item: Element): string | undefined {
  const candidates: Array<string | null | undefined> = [
    item.querySelector(".mg-blog-date")?.textContent,
    item.querySelector(".mg-blog-meta")?.textContent,
    item.textContent,
  ];

  for (const candidate of candidates) {
    const value = normalizeDateToken(candidate);
    if (value) {
      return value;
    }
  }

  return undefined;
}

function resolveSummary(item: Element): string | undefined {
  return normalizeText(item.querySelector(".mg-sec-top-post p")?.textContent);
}

export const xcxyFetchTargets: FetchTarget[] = targetSpecs.map((target) => ({
  id: target.requestId,
  url: `${baseUrl}/${target.path}`,
  channel: target.channel,
}));

const parserConfig: HtmlListParserConfig = {
  parserKey: "bnuzh/xcxy",
  targets: targetSpecs.map((target) => ({
    requestId: target.requestId,
    itemSelector: "article.d-md-flex.mg-posts-sec-post",
    channel: target.channel,
    title: resolveTitle,
    url: { selector: ".mg-sec-top-post h4 a", attr: "href" },
    publishedAt: resolvePublishedAt,
    summary: resolveSummary,
    rawId: resolveRawId,
  })),
};

export const xcxyParser = createConfiguredHtmlListParser(parserConfig);
