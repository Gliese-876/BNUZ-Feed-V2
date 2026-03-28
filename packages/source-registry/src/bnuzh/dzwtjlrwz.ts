import type { FetchTarget } from "@bnuz-feed/contracts";

import { createConfiguredHtmlListParser, type HtmlListParserConfig } from "../parsers/configuredHtmlListParser";

type TargetSpec = {
  requestId: string;
  url: string;
  channel: string;
  kind: "news" | "catalog";
};

const baseUrl = "https://ihap.bnuzh.edu.cn";

const targetSpecs: TargetSpec[] = [
  {
    requestId: "zxdt",
    url: `${baseUrl}/zxdt/index.htm`,
    channel: "\u6700\u65b0\u52a8\u6001",
    kind: "news",
  },
  {
    requestId: "dwtj",
    url: `${baseUrl}/kpjy/dwtj/index.htm`,
    channel: "\u52a8\u7269\u56fe\u9274",
    kind: "catalog",
  },
  {
    requestId: "zwtj",
    url: `${baseUrl}/kpjy/zwtj/index.htm`,
    channel: "\u690d\u7269\u56fe\u9274",
    kind: "catalog",
  },
  {
    requestId: "dtfb/lyl",
    url: `${baseUrl}/dtfb/lyl/index.htm`,
    channel: "\u4e50\u80b2\u697c",
    kind: "catalog",
  },
  {
    requestId: "dtfb/hhy",
    url: `${baseUrl}/dtfb/hhy/index.htm`,
    channel: "\u6d77\u534e\u82d1",
    kind: "catalog",
  },
  {
    requestId: "dtfb/hwl",
    url: `${baseUrl}/dtfb/hwl/index.htm`,
    channel: "\u5f18\u6587\u697c",
    kind: "catalog",
  },
  {
    requestId: "dtfb/tsg",
    url: `${baseUrl}/dtfb/tsg/index.htm`,
    channel: "\u56fe\u4e66\u9986",
    kind: "catalog",
  },
  {
    requestId: "dtfb/yhy2",
    url: `${baseUrl}/dtfb/yhy2/index.htm`,
    channel: "\u7ca4\u534e\u82d1",
    kind: "catalog",
  },
];

function normalizeText(value: string | null | undefined): string | undefined {
  const normalized = value?.replace(/\s+/g, " ").trim();
  return normalized ? normalized : undefined;
}

function normalizeLine(value: string | null | undefined): string | undefined {
  const normalized = value?.replace(/\s+/g, " ").trim();
  return normalized ? normalized : undefined;
}

function toMeaningfulLines(value: string | null | undefined): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(/\r?\n/)
    .map((line) => normalizeLine(line))
    .filter((line): line is string => Boolean(line))
    .filter(
      (line) =>
        !/^(?:Image|\u9605\u8bfb\u8be6\u7ec6|\u67e5\u770b\u66f4\u591a|\u4e86\u89e3\u8be6\u60c5|\u7acb\u5373\u6295\u7a3f|\u9996\u9875|\u6700\u65b0\u52a8\u6001|\u52a8\u7269\u56fe\u9274|\u690d\u7269\u56fe\u9274|\u5730\u56fe\u5206\u5e03|\u6b22\u8fce\u6295\u7a3f)$/u.test(
          line,
        ),
    );
}

function splitCatalogLabel(label: string): { title: string; summary?: string } {
  const compact = label
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\s*(?:\u4e86\u89e3\u8be6\u60c5|\u9605\u8bfb\u8be6\u7ec6|\u67e5\u770b\u66f4\u591a|\u7acb\u5373\u6295\u7a3f)\s*$/u, "");
  const tokens = compact.split(" ").filter(Boolean);
  const latinIndex = tokens.findIndex((token, index) => index > 0 && /^[A-Za-z]/.test(token));

  if (latinIndex > 0) {
    const title = tokens.slice(0, latinIndex).join(" ");
    const summary = tokens.slice(latinIndex).join(" ");
    return {
      title,
      summary: summary || undefined,
    };
  }

  return {
    title: compact,
  };
}

function resolveCatalogParts(item: Element): { title?: string; summary?: string } {
  const explicitTitle =
    item.querySelector(".title, .article-title, .name, .item-title, h1, h2, h3")?.textContent ?? undefined;
  const explicitSummary = item.querySelector(".summary, .article-summary, .desc, .excerpt, .scientific-name")?.textContent;

  const titleFromSelector = normalizeText(explicitTitle);
  const summaryFromSelector = normalizeText(explicitSummary);

  if (titleFromSelector) {
    return {
      title: titleFromSelector,
      summary: summaryFromSelector,
    };
  }

  const lines = toMeaningfulLines(item.textContent);
  if (lines.length === 0) {
    return {};
  }

  const firstLine = lines[0]!;
  const firstSplit = splitCatalogLabel(firstLine);

  if (firstSplit.summary) {
    return firstSplit;
  }

  const secondLine = lines[1];
  const summary = secondLine && !/^\d+$/.test(secondLine) ? secondLine : undefined;

  return {
    title: firstSplit.title,
    summary,
  };
}

function resolveNewsParts(item: Element): { title?: string; summary?: string } {
  const explicitTitle =
    item.querySelector(".title, .article-title, .name, .item-title, h1, h2, h3")?.textContent ?? undefined;
  const explicitSummary = item.querySelector(".summary, .article-summary, .desc, .excerpt")?.textContent;

  const titleFromSelector = normalizeText(explicitTitle);
  const summaryFromSelector = normalizeText(explicitSummary);

  if (titleFromSelector) {
    return {
      title: titleFromSelector,
      summary: summaryFromSelector,
    };
  }

  const lines = toMeaningfulLines(item.textContent);
  if (lines.length === 0) {
    return {};
  }

  return {
    title: lines[0],
    summary: lines[1],
  };
}

function isContentItem(item: Element): boolean {
  if (item.closest("nav, footer, aside, [role='navigation'], [role='complementary']")) {
    return false;
  }

  const href = item.getAttribute("href");
  if (!href || href === "#" || href.startsWith("javascript:")) {
    return false;
  }

  return true;
}

function resolvePath(item: Element, page: { finalUrl: string; requestUrl: string }): string | undefined {
  const href = item.getAttribute("href");
  if (!href) {
    return undefined;
  }

  try {
    return new URL(href, page.finalUrl || page.requestUrl).pathname;
  } catch {
    return undefined;
  }
}

function isNewsItem(item: Element, page: { finalUrl: string; requestUrl: string }): boolean {
  if (!isContentItem(item)) {
    return false;
  }

  const text = normalizeText(item.textContent);
  const path = resolvePath(item, page);
  if (!text) {
    return false;
  }

  return Boolean(path?.startsWith("/zxdt/")) && !/^(?:\u67e5\u770b\u66f4\u591a|\u4e0a\u4e00\u9875|\u4e0b\u4e00\u9875|\u4e0a\u4e00\u7bc7|\u4e0b\u4e00\u7bc7)$/u.test(text);
}

function isCatalogItem(item: Element, page: { finalUrl: string; requestUrl: string }): boolean {
  if (!isContentItem(item)) {
    return false;
  }

  const text = normalizeText(item.textContent);
  const path = resolvePath(item, page);
  if (!text) {
    return false;
  }

  return Boolean(path?.startsWith("/kpjy/")) && text.includes("\u4e86\u89e3\u8be6\u60c5");
}

const parserConfig: HtmlListParserConfig = {
  parserKey: "bnuzh/dzwtjlrwz",
  targets: targetSpecs.map((target) => {
    if (target.kind === "news") {
      return {
        requestId: target.requestId,
        itemSelector: ".article-container a[href], a[href]",
        channel: target.channel,
        title: (item) => resolveNewsParts(item).title,
        url: { attr: "href" },
        summary: (item) => resolveNewsParts(item).summary,
        rawId: { attr: "href" },
        limit: 20,
        itemFilter: isNewsItem,
      };
    }

    const limit = target.requestId === "dwtj" || target.requestId === "zwtj" ? 100 : 20;

    return {
      requestId: target.requestId,
      itemSelector: ".article-container a[href], a[href]",
      channel: target.channel,
      title: (item) => resolveCatalogParts(item).title,
      url: { attr: "href" },
      summary: (item) => resolveCatalogParts(item).summary,
      rawId: { attr: "href" },
      limit,
      itemFilter: isCatalogItem,
    };
  }),
};

export const dzwtjlrwzFetchTargets: FetchTarget[] = targetSpecs.map((target) => ({
  id: target.requestId,
  url: target.url,
  channel: target.channel,
}));

export const dzwtjlrwzParser = createConfiguredHtmlListParser(parserConfig);
