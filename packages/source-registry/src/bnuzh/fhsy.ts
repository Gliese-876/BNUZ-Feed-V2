import type { FetchTarget } from "@bnuz-feed/contracts";

import { createConfiguredHtmlListParser, type HtmlListParserConfig } from "../parsers/configuredHtmlListParser";

type TargetSpec = {
  requestId: string;
  path: string;
  channel: string;
  pages?: number;
};

const baseUrl = "https://phs.bnuzh.edu.cn/";

const targetSpecs: TargetSpec[] = [
  { requestId: "syxw", path: "xwdt/syxw/index.htm", channel: "书院新闻", pages: 2 },
  { requestId: "tzhhd", path: "tzhhd/index.htm", channel: "通知和活动", pages: 2 },
  { requestId: "mtbd", path: "xwdt/mtbd/index.htm", channel: "媒体报道" },
  { requestId: "fhslt", path: "syhd/fhslt/index.htm", channel: "京师凤凰论坛" },
  { requestId: "fhdjt", path: "syhd/fhdjt/index.htm", channel: "凤凰讲堂" },
  { requestId: "xshd", path: "zszsy/xshd/index.htm", channel: "学生活动" },
  { requestId: "zxdt", path: "zx/ygawhyjyjlzx/zxdt/index.htm", channel: "中心动态" },
  { requestId: "jsjh", path: "zx/ygawhyjyjlzx/jsjh/index.htm", channel: "菁师计划" },
  { requestId: "ygawhyjyjlhd", path: "zx/ygawhyjyjlzx/ygawhyjyjlhd/index.htm", channel: "粤港澳文化与教育交流活动" },
  { requestId: "xmhpx", path: "zx/ygawhyjyjlzx/xmhpx/index.htm", channel: "项目和培训" },
  { requestId: "fhyyc", path: "gjjy/fhyyc/index.htm", channel: "凤凰语言村", pages: 2 },
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

  const fullDate =
    compact.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})$/) ??
    text.match(/^(\d{4})\s+(\d{1,2})[-/](\d{1,2})$/) ??
    compact.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日?$/);

  if (fullDate) {
    const [, year = "", month = "", day = ""] = fullDate;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const monthDay =
    text.match(/^(\d{1,2})月(\d{1,2})日?$/) ??
    compact.match(/^(\d{1,2})[./-](\d{1,2})$/);

  if (monthDay) {
    const [, month = "", day = ""] = monthDay;
    return `${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  return undefined;
}

function resolveText(item: Element, selectors: string[]): string | undefined {
  for (const selector of selectors) {
    const text = normalizeText(item.querySelector(selector)?.textContent);
    if (text) {
      return text;
    }
  }

  return undefined;
}

function resolveTitle(item: Element): string | undefined {
  return resolveText(item, ["a h3", "a .title", "a .news-title", "a .fs-2", "a"]);
}

function resolveSummary(item: Element): string | undefined {
  return resolveText(item, ["a p", "a .summary", ".summary", "p", ".desc", ".intro"]);
}

function resolvePublishedAt(item: Element): string | undefined {
  const explicit = resolveText(item, [".date", ".time", "time", "span"]);
  const candidates = [explicit, normalizeText(item.textContent)];

  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }

    const patterns = [
      /\d{4}[./-]\d{1,2}[./-]\d{1,2}/g,
      /\d{4}\s+\d{1,2}[-/]\d{1,2}/g,
      /\d{4}年\d{1,2}月\d{1,2}日?/g,
      /\d{1,2}月\d{1,2}日?/g,
      /\d{1,2}[./-]\d{1,2}/g,
    ];

    for (const pattern of patterns) {
      const matches = [...candidate.matchAll(pattern)];
      if (matches.length > 0) {
        const normalized = normalizeDateToken(matches[matches.length - 1]?.[0]);
        if (normalized) {
          return normalized;
        }
      }
    }
  }

  return undefined;
}

function resolveHref(item: Element): string | undefined {
  return normalizeText(item.querySelector("a[href]")?.getAttribute("href") ?? item.getAttribute("href"));
}

function isArticleItem(item: Element): boolean {
  const href = resolveHref(item);
  if (!href || /^javascript:/i.test(href) || href === "#") {
    return false;
  }

  return Boolean(resolveTitle(item) && resolvePublishedAt(item));
}

function createFetchTargets(): FetchTarget[] {
  return targetSpecs.flatMap((spec) => {
    const pages = spec.pages ?? 1;

    return Array.from({ length: pages }, (_, pageIndex) => {
      const requestId = pageIndex === 0 ? spec.requestId : `${spec.requestId}/index${pageIndex}`;
      const url = pageIndex === 0 ? spec.path : spec.path.replace(/index\.htm$/, `index${pageIndex}.htm`);

      return {
        id: requestId,
        url: `${baseUrl}${url}`,
        channel: spec.channel,
      } satisfies FetchTarget;
    });
  });
}

const parserConfig: HtmlListParserConfig = {
  parserKey: "bnuzh/fhsy",
  targets: targetSpecs.flatMap((spec) => {
    const pages = spec.pages ?? 1;

    return Array.from({ length: pages }, (_, pageIndex) => ({
      requestId: pageIndex === 0 ? spec.requestId : `${spec.requestId}/index${pageIndex}`,
      itemSelector: ".gp-subRight li",
      channel: spec.channel,
      title: resolveTitle,
      url: { selector: "a", attr: "href" },
      publishedAt: resolvePublishedAt,
      summary: resolveSummary,
      rawId: { selector: "a", attr: "href" },
      limit: 20,
      itemFilter: isArticleItem,
    }));
  }),
};

export const fhsyFetchTargets: FetchTarget[] = createFetchTargets();
export const fhsyParser = createConfiguredHtmlListParser(parserConfig);
