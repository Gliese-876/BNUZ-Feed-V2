import type { FetchTarget } from "@bnuz-feed/contracts";

import { createConfiguredHtmlListParser, type HtmlListParserConfig } from "../parsers/configuredHtmlListParser";

type TargetSpec = {
  requestId: string;
  path: string;
  channel: string;
};

const baseUrl = "https://oam.bnuzh.edu.cn";

const targetSpecs: TargetSpec[] = [
  { requestId: "xwdt", path: "xwgg/xwdt/index.htm", channel: "新闻动态" },
  { requestId: "tzgg", path: "xwgg/tzgg/index.htm", channel: "通知公告" },
  { requestId: "gjflfg", path: "zcfg/gdzcgl/gjflfg/index.htm", channel: "国家法律法规" },
  { requestId: "bwgzzd", path: "zcfg/gdzcgl/bwgzzd/index.htm", channel: "部委规章制度" },
  { requestId: "xxgzzd", path: "zcfg/gdzcgl/xxgzzd/index.htm", channel: "学校规章制度" },
  { requestId: "xyzhgl", path: "zcfg/xyzhgl/index.htm", channel: "校园综合管理" },
  { requestId: "zbgz", path: "dqjs/zbgz/index.htm", channel: "支部工作" },
  { requestId: "ghhd", path: "dqjs/ghhd/index.htm", channel: "工会活动" },
  { requestId: "xzzq", path: "xzzq/index.htm", channel: "下载专区" },
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

  const fullDatePatterns = [
    /^(\d{4})[./-](\d{1,2})[./-](\d{1,2})$/,
    /^(\d{4})年(\d{1,2})月(\d{1,2})日?$/,
  ];

  for (const pattern of fullDatePatterns) {
    const match = compact.match(pattern);
    if (!match) {
      continue;
    }

    const [, year = "", month = "", day = ""] = match;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  return undefined;
}

function resolvePublishedAtFromText(item: Element): string | undefined {
  const dateNodes = [
    item.querySelector(".time"),
    item.querySelector(".date"),
    item.querySelector("time"),
    item.querySelector(".publish-time"),
  ];

  for (const node of dateNodes) {
    const value = normalizeDateToken(node?.textContent);
    if (value) {
      return value;
    }
  }

  return normalizeDateToken(item.textContent);
}

function resolveCalendarPublishedAt(item: Element): string | undefined {
  const year = normalizeText(item.querySelector(".calendar .year")?.textContent);
  const monthDay = normalizeText(item.querySelector(".calendar .day")?.textContent);

  if (!year || !monthDay) {
    return undefined;
  }

  const compact = monthDay.replace(/\s+/g, "");
  const match = compact.match(/^(\d{1,2})[./-](\d{1,2})$/);
  if (!match) {
    return undefined;
  }

  const [, month = "", day = ""] = match;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

const parserConfig: HtmlListParserConfig = {
  parserKey: "bnuzh/zcglbgs",
  targets: [
    {
      requestId: "xwdt",
      itemSelector: "div.page-content ul.news-article-list > li",
      channel: "新闻动态",
      title: ".title",
      url: { selector: "a.item", attr: "href" },
      publishedAt: resolveCalendarPublishedAt,
      summary: ".summary",
      rawId: { selector: "a.item", attr: "href" },
    },
    {
      requestId: "tzgg",
      itemSelector: "div.page-content .common-article-list > li",
      channel: "通知公告",
      title: ".title",
      url: { selector: "a.item", attr: "href" },
      publishedAt: resolvePublishedAtFromText,
      rawId: { selector: "a.item", attr: "href" },
    },
    {
      requestId: "gjflfg",
      itemSelector: "div.page-content .common-article-list > li",
      channel: "国家法律法规",
      title: ".title",
      url: { selector: "a.item", attr: "href" },
      publishedAt: resolvePublishedAtFromText,
      rawId: { selector: "a.item", attr: "href" },
    },
    {
      requestId: "bwgzzd",
      itemSelector: "div.page-content .common-article-list > li",
      channel: "部委规章制度",
      title: ".title",
      url: { selector: "a.item", attr: "href" },
      publishedAt: resolvePublishedAtFromText,
      rawId: { selector: "a.item", attr: "href" },
    },
    {
      requestId: "xxgzzd",
      itemSelector: "div.page-content .common-article-list > li",
      channel: "学校规章制度",
      title: ".title",
      url: { selector: "a.item", attr: "href" },
      publishedAt: resolvePublishedAtFromText,
      rawId: { selector: "a.item", attr: "href" },
    },
    {
      requestId: "xyzhgl",
      itemSelector: "div.page-content .common-article-list > li",
      channel: "校园综合管理",
      title: ".title",
      url: { selector: "a.item", attr: "href" },
      publishedAt: resolvePublishedAtFromText,
      rawId: { selector: "a.item", attr: "href" },
    },
    {
      requestId: "zbgz",
      itemSelector: "div.page-content .common-article-list > li",
      channel: "支部工作",
      title: ".title",
      url: { selector: "a.item", attr: "href" },
      publishedAt: resolvePublishedAtFromText,
      rawId: { selector: "a.item", attr: "href" },
    },
    {
      requestId: "ghhd",
      itemSelector: "div.page-content .event-list > .col-lg-4",
      channel: "工会活动",
      title: ".title",
      url: { selector: "a.event", attr: "href" },
      rawId: { selector: "a.event", attr: "href" },
    },
    {
      requestId: "xzzq",
      itemSelector: "div.page-content .common-article-list > li",
      channel: "下载专区",
      title: ".title",
      url: { selector: "a.item", attr: "href" },
      publishedAt: resolvePublishedAtFromText,
      rawId: { selector: "a.item", attr: "href" },
    },
  ],
};

export const zcglbgsFetchTargets: FetchTarget[] = targetSpecs.map((target) => ({
  id: target.requestId,
  url: `${baseUrl}/${target.path}`,
  channel: target.channel,
}));

export const zcglbgsParser = createConfiguredHtmlListParser(parserConfig);
