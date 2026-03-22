import type { FetchTarget } from "@bnuz-feed/contracts";

import { createConfiguredHtmlListParser, type HtmlListParserConfig, type HtmlValueResolver } from "../parsers/configuredHtmlListParser";

type TargetSpec = {
  requestId: string;
  path: string;
  channel: string;
  itemSelector: string;
  title: HtmlValueResolver;
  url: HtmlValueResolver;
  publishedAt?: HtmlValueResolver;
  rawId?: HtmlValueResolver;
};

const baseUrl = "https://iscst.bnuzh.edu.cn";

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
  const patterns = [
    /^(\d{4})[./-](\d{1,2})[./-](\d{1,2})$/,
    /^(\d{4})年(\d{1,2})月(\d{1,2})日?$/,
  ];

  for (const pattern of patterns) {
    const match = compact.match(pattern);
    if (!match) {
      continue;
    }

    const [, year = "", month = "", day = ""] = match;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  return undefined;
}

function resolvePublishedAt(item: Element): string | undefined {
  const candidateSelectors = [".flex-shrink-0", ".date", ".time", "time", ".gpArticleDate"];

  for (const selector of candidateSelectors) {
    const value = normalizeDateToken(item.querySelector(selector)?.textContent);
    if (value) {
      return value;
    }
  }

  return normalizeDateToken(item.textContent);
}

function createPagedArticleTargets(params: {
  folder: string;
  requestPrefix: string;
  channel: string;
  pages: number;
}): TargetSpec[] {
  return Array.from({ length: params.pages }, (_, index) => {
    const fileName = index === 0 ? "index.htm" : `index${index}.htm`;

    return {
      requestId: index === 0 ? params.requestPrefix : `${params.requestPrefix}/index${index}`,
      path: `${params.folder}/${fileName}`,
      channel: params.channel,
      itemSelector: ".article-list > li",
      title: ".title",
      url: { selector: "a", attr: "href" },
      publishedAt: resolvePublishedAt,
      rawId: { selector: "a", attr: "href" },
    } satisfies TargetSpec;
  });
}

function createEquipmentTargets(params: { requestId: string; path: string; channel: string }): TargetSpec {
  return {
    requestId: params.requestId,
    path: params.path,
    channel: params.channel,
    itemSelector: ".equipment-list > li",
    title: ".title",
    url: { selector: "a", attr: "href" },
    rawId: { selector: "a", attr: "href" },
  };
}

const targetSpecs: TargetSpec[] = [
  ...createPagedArticleTargets({ folder: "ptxw", requestPrefix: "ptxw", channel: "平台新闻", pages: 3 }),
  ...createPagedArticleTargets({ folder: "xwgg/tzgg", requestPrefix: "tzgg", channel: "通知公告", pages: 2 }),
  ...createPagedArticleTargets({ folder: "xwgg/pxap", requestPrefix: "pxap", channel: "培训安排", pages: 11 }),
  ...createPagedArticleTargets({ folder: "djzt", requestPrefix: "djzt", channel: "党建专题", pages: 3 }),
  ...createPagedArticleTargets({ folder: "aqzt", requestPrefix: "aqzt", channel: "安全专题", pages: 1 }),
  ...createPagedArticleTargets({ folder: "gzzd", requestPrefix: "gzzd", channel: "规章制度", pages: 1 }),
  ...createPagedArticleTargets({ folder: "rczp", requestPrefix: "rczp", channel: "人才招聘", pages: 1 }),
  ...createPagedArticleTargets({ folder: "fwzn/yylc", requestPrefix: "yylc", channel: "预约流程", pages: 1 }),
  ...createPagedArticleTargets({ folder: "fwzn/sfbz", requestPrefix: "sfbz", channel: "收费标准", pages: 1 }),
  ...createPagedArticleTargets({ folder: "alzs", requestPrefix: "alzs", channel: "案例展示", pages: 1 }),
  createEquipmentTargets({ requestId: "cffxzx", path: "yqsb/cffxzx/index.htm", channel: "成分分析中心" }),
  createEquipmentTargets({ requestId: "bmfxzx", path: "yqsb/bmfxzx/index.htm", channel: "表面分析中心" }),
  createEquipmentTargets({ requestId: "wqfxzx", path: "yqsb/wqfxzx/index.htm", channel: "微区分析中心" }),
  createEquipmentTargets({ requestId: "jgfxzx", path: "yqsb/jgfxzx/index.htm", channel: "结构分析中心" }),
  createEquipmentTargets({ requestId: "fzfxzx", path: "yqsb/fzfxzx/index.htm", channel: "分子分析中心" }),
];

const parserConfig: HtmlListParserConfig = {
  parserKey: "bnuzh/lgsyptwz",
  targets: targetSpecs.map((target) => ({
    requestId: target.requestId,
    itemSelector: target.itemSelector,
    channel: target.channel,
    title: target.title,
    url: target.url,
    publishedAt: target.publishedAt,
    rawId: target.rawId,
  })),
};

export const lgsyptwzFetchTargets: FetchTarget[] = targetSpecs.map((target) => ({
  id: target.requestId,
  url: `${baseUrl}/${target.path}`,
  channel: target.channel,
}));

export const lgsyptwzParser = createConfiguredHtmlListParser(parserConfig);
