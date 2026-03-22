import type { FetchTarget } from "@bnuz-feed/contracts";

import {
  createConfiguredHtmlListParser,
  type HtmlListParserConfig,
} from "../parsers/configuredHtmlListParser";

type TargetSpec = {
  requestId: string;
  path: string;
  channel: string;
};

const baseUrl = "https://hongwen.bnuzh.edu.cn/";

const targetSpecs: TargetSpec[] = [
  { requestId: "hwyw", path: "hwyw/index.htm", channel: "弘文要闻" },
  { requestId: "tzgg", path: "tzgg/index.htm", channel: "通知公告" },
  { requestId: "hdyg", path: "hdyg/index.htm", channel: "活动预告" },
  { requestId: "sytd/gltd", path: "sytd/gltd/index.htm", channel: "管理团队" },
  { requestId: "sytd/dstd/xyds", path: "sytd/dstd/xyds/index.htm", channel: "学业导师" },
  { requestId: "sytd/dstd/czds", path: "sytd/dstd/czds/index.htm", channel: "成长导师" },
  { requestId: "sytd/xzjh", path: "sytd/xzjh/index.htm", channel: "学长计划" },
  { requestId: "syzl/sykj", path: "syzl/sykj/index.htm", channel: "书院空间" },
  { requestId: "syfw/gzzd", path: "syfw/gzzd/index.htm", channel: "规章制度" },
  { requestId: "syfw/bszn", path: "syfw/bszn/index.htm", channel: "办事指南" },
  { requestId: "syfw/lxwm", path: "syfw/lxwm/index.htm", channel: "联系我们" },
  { requestId: "xssw/djgz", path: "xssw/djgz/index.htm", channel: "党建工作" },
  { requestId: "xssw/btfc", path: "xssw/btfc/index.htm", channel: "班团工作" },
  { requestId: "xssw/xyzd", path: "xssw/xyzd/index.htm", channel: "学业指导" },
  { requestId: "xssw/xsjz", path: "xssw/xsjz/index.htm", channel: "学生奖助" },
  { requestId: "xssw/gfjy", path: "xssw/gfjy/index.htm", channel: "国防教育" },
  { requestId: "xssw/xljk", path: "xssw/xljk/index.htm", channel: "心理健康" },
  { requestId: "xssw/hzjl", path: "xssw/hzjl/index.htm", channel: "合作交流" },
  { requestId: "xssw/jyfw", path: "xssw/jyfw/index.htm", channel: "就业服务" },
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
  const selectors = [".flex-shrink-0", ".time", ".date", "time"];

  for (const selector of selectors) {
    const value = normalizeDateToken(item.querySelector(selector)?.textContent);
    if (value) {
      return value;
    }
  }

  return normalizeDateToken(item.textContent);
}

const parserConfig: HtmlListParserConfig = {
  parserKey: "bnuzh/hwsywz",
  targets: targetSpecs.map((target) => ({
    requestId: target.requestId,
    itemSelector: "ul.article-list > li",
    channel: target.channel,
    title: ".title",
    url: { selector: "a", attr: "href" },
    publishedAt: resolvePublishedAt,
    rawId: { selector: "a", attr: "href" },
    limit: 20,
  })),
};

export const hwsywzFetchTargets: FetchTarget[] = targetSpecs.map((target) => ({
  id: target.requestId,
  url: `${baseUrl}${target.path}`,
  channel: target.channel,
}));

export const hwsywzParser = createConfiguredHtmlListParser(parserConfig);
