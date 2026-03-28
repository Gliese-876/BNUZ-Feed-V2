import type { FetchTarget } from "@bnuz-feed/contracts";

import { createConfiguredHtmlListParser, type HtmlListParserConfig } from "../parsers/configuredHtmlListParser";

type TargetSpec = {
  requestId: string;
  path: string;
  channel: string;
  pages: number;
};

const baseUrl = "https://youth.bnuzh.edu.cn/";

const targetSpecs: TargetSpec[] = [
  { requestId: "xwdt", path: "xwdt/index.htm", channel: "新闻动态", pages: 5 },
  { requestId: "tzgg", path: "tzgg/index.htm", channel: "通知公告", pages: 10 },
  { requestId: "llxx", path: "llxx/index.htm", channel: "理论学习", pages: 1 },
  { requestId: "gzzd", path: "gzzd/index.htm", channel: "规章制度", pages: 1 },
  { requestId: "yxtwfc", path: "yxtwfc/index.htm", channel: "院系团委风采", pages: 1 },
  { requestId: "jchd", path: "jchd/index.htm", channel: "精彩活动", pages: 3 },
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
  const match = compact.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})$/);

  if (!match) {
    return undefined;
  }

  const [, year = "", month = "", day = ""] = match;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function extractTrailingDateToken(value: string | null | undefined): string | undefined {
  const text = normalizeText(value);
  if (!text) {
    return undefined;
  }

  const match = text.match(/(\d{4}[./-]\d{1,2}[./-]\d{1,2})$/);
  return normalizeDateToken(match?.[1]);
}

function stripTrailingDateToken(value: string | null | undefined): string | undefined {
  const text = normalizeText(value);
  if (!text) {
    return undefined;
  }

  return normalizeText(text.replace(/\s*\d{4}[./-]\d{1,2}[./-]\d{1,2}$/, ""));
}

function resolveItemText(item: Element): string | undefined {
  return normalizeText(item.querySelector("a[href]")?.textContent ?? item.textContent);
}

function createFetchTargets(): FetchTarget[] {
  return targetSpecs.flatMap((target) =>
    Array.from({ length: target.pages }, (_, pageIndex) => {
      const id = pageIndex === 0 ? target.requestId : `${target.requestId}/index${pageIndex}`;
      const path = pageIndex === 0 ? target.path : target.path.replace("index.htm", `index${pageIndex}.htm`);

      return {
        id,
        url: `${baseUrl}${path}`,
        channel: target.channel,
      } satisfies FetchTarget;
    }),
  );
}

const parserConfig: HtmlListParserConfig = {
  parserKey: "bnuzh/xqtwwz",
  targets: targetSpecs.flatMap((target) =>
    Array.from({ length: target.pages }, (_, pageIndex) => ({
      requestId: pageIndex === 0 ? target.requestId : `${target.requestId}/index${pageIndex}`,
      itemSelector: "ul.article-list > li.item",
      channel: target.channel,
      title: (item) => stripTrailingDateToken(resolveItemText(item)),
      url: { selector: "a[href]", attr: "href" },
      publishedAt: (item) => extractTrailingDateToken(resolveItemText(item)),
      rawId: { selector: "a[href]", attr: "href" },
    })),
  ),
};

export const xqtwwzFetchTargets: FetchTarget[] = createFetchTargets();
export const xqtwwzParser = createConfiguredHtmlListParser(parserConfig);
