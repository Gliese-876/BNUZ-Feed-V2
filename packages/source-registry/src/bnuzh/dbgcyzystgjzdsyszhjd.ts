import type { FetchTarget } from "@bnuz-feed/contracts";

import { createConfiguredHtmlListParser, type HtmlListParserConfig } from "../parsers/configuredHtmlListParser";

type TargetSpec = {
  requestId: string;
  path: string;
  channel: string;
};

const baseUrl = "https://espre.bnuzh.edu.cn";

const targetSpecs: TargetSpec[] = [
  { requestId: "xwzx/index", path: "xwzx/index.htm", channel: "新闻中心" },
  { requestId: "kyltz/index", path: "dtxx/tzzx/kyltz/index.htm", channel: "科研类通知" },
  { requestId: "xzltz/index", path: "dtxx/tzzx/xzltz/index.htm", channel: "行政类通知" },
  { requestId: "xshd/index", path: "dtxx/xshd/index.htm", channel: "学术活动" },
  { requestId: "snyjjz/index", path: "dtxx/kyjz/snyjjz/index.htm", channel: "室内研究进展" },
  { requestId: "xkdt/index", path: "dtxx/kyjz/xkdt/index.htm", channel: "学科动态" },
  { requestId: "kyjyjl/index", path: "dtxx/kyjz/kyjyjl/index.htm", channel: "科研经验交流" },
  { requestId: "gjhz/index", path: "hzjl/gjhz/index.htm", channel: "国际合作（访学、公派）" },
  { requestId: "hybg/index", path: "hzjl/hybg/index.htm", channel: "会议报告" },
  { requestId: "hybg/index1", path: "hzjl/hybg/index1.htm", channel: "会议报告" },
  { requestId: "hdfc/index", path: "hdfc/index.htm", channel: "活动风采" },
  { requestId: "hdfc/index1", path: "hdfc/index1.htm", channel: "活动风采" },
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
  const matches = [
    compact.match(/(\d{4})[./-](\d{1,2})[./-](\d{1,2})/),
    compact.match(/(\d{4})年(\d{1,2})月(\d{1,2})日?/),
  ];

  for (const match of matches) {
    if (!match) {
      continue;
    }

    const [, year = "", month = "", day = ""] = match;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  return undefined;
}

function resolveAnchor(item: Element): HTMLAnchorElement | undefined {
  const anchor = item.querySelector("a[href]") as HTMLAnchorElement | null;
  return anchor ?? undefined;
}

function resolveTitle(item: Element): string | undefined {
  const anchor = resolveAnchor(item);
  const title = normalizeText(anchor?.getAttribute("title"));
  if (title) {
    return title;
  }

  const text = normalizeText(anchor?.textContent);
  if (!text) {
    return undefined;
  }

  const datePattern = /(\d{4}[./-]\d{1,2}[./-]\d{1,2}|\d{4}年\d{1,2}月\d{1,2}日?)/;
  const stripped = text.split(datePattern, 1)[0];
  return normalizeText(stripped) ?? text;
}

function resolvePublishedAt(item: Element): string | undefined {
  const anchor = resolveAnchor(item);
  const selectors = [".flex-shrink-0", ".time", "time"];

  for (const selector of selectors) {
    const value = normalizeDateToken(anchor?.querySelector(selector)?.textContent);
    if (value) {
      return value;
    }
  }

  return normalizeDateToken(anchor?.textContent ?? item.textContent);
}

const parserConfig: HtmlListParserConfig = {
  parserKey: "bnuzh/dbgcyzystgjzdsyszhjd",
  targets: targetSpecs.map((target) => ({
    requestId: target.requestId,
    itemSelector: ".article-list > li",
    channel: target.channel,
    title: resolveTitle,
    url: { selector: "a[href]", attr: "href" },
    publishedAt: resolvePublishedAt,
    rawId: { selector: "a[href]", attr: "href" },
  })),
};

export const dbgcyzystgjzdsyszhjdFetchTargets: FetchTarget[] = targetSpecs.map((target) => ({
  id: target.requestId,
  url: `${baseUrl}/${target.path}`,
  channel: target.channel,
}));

export const dbgcyzystgjzdsyszhjdParser = createConfiguredHtmlListParser(parserConfig);
