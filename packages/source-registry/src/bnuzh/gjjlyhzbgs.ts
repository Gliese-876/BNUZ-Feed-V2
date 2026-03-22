import type { FetchTarget } from "@bnuz-feed/contracts";

import { createConfiguredHtmlListParser, type HtmlListParserConfig } from "../parsers/configuredHtmlListParser";

type TargetSpec = {
  requestId: string;
  path: string;
  channel: string;
  pages?: number;
  kind: "dated" | "issue" | "plain";
  itemSelector?: string;
};

const baseUrl = "https://io.bnuzh.edu.cn/";

const targetSpecs: TargetSpec[] = [
  { requestId: "xwsd", path: "xwsd/index.htm", channel: "新闻速递", pages: 5, kind: "dated" },
  { requestId: "xxgg", path: "xxgg/index.htm", channel: "信息公告", pages: 5, kind: "dated" },
  { requestId: "Newsletter", path: "Newsletter/index.htm", channel: "BNU Zhuhai Newsletter", kind: "issue" },
  { requestId: "gzdt", path: "ztbd/gzdt/index.htm", channel: "工作动态", kind: "dated" },
  {
    requestId: "bjsfdxzhxqgjwhj",
    path: "ztbd/bjsfdxzhxqgjwhj/index.htm",
    channel: "北京师范大学珠海校区国际文化节",
    kind: "dated",
  },
  { requestId: "zxzg", path: "ztbd/zxzg/index.htm", channel: "知行中国", kind: "dated" },
  { requestId: "gjxzxskdwq", path: "ztbd/gjxzxskdwq/index.htm", channel: "国际学者学生看大湾区", kind: "dated" },
  { requestId: "jsxsqqsyj", path: "ztbd/jsxsqqsyj/index.htm", channel: "京师学生全球视野节", kind: "dated" },
  {
    requestId: "gzzgsghxnyjysyydsclsh",
    path: "ztbd/gzzgsghxnyjysyydsclsh/index.htm",
    channel: "感知中国 山谷回响 南有佳音 双语云端诗词朗诵会",
    kind: "dated",
  },
  { requestId: "yfksj", path: "ztbd/yfksj/index.htm", channel: "扬帆看世界", kind: "dated" },
  { requestId: "zxtz", path: "jsfw/ywrs/zxtz/index.htm", channel: "最新通知", kind: "dated" },
  {
    requestId: "gjhy/zxtzgjhy",
    path: "gjhy/zxtzgjhy/index.htm",
    channel: "国际会议/最新通知",
    kind: "plain",
    itemSelector: "p > a[href]",
  },
  { requestId: "YESxm", path: "jsfw/xmsb/YESxm/index.htm", channel: "YES项目", kind: "dated" },
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
    compact.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日$/);
  if (fullDate) {
    const [, year = "", month = "", day = ""] = fullDate;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const monthDay = compact.match(/^(\d{1,2})[./-](\d{1,2})$/) ?? compact.match(/^(\d{1,2})月(\d{1,2})日$/);
  if (monthDay) {
    const [, month = "", day = ""] = monthDay;
    return `${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  return undefined;
}

function collectAnchorSegments(item: Element): string[] {
  const segments = Array.from(item.children)
    .filter((child) => child.tagName !== "IMG")
    .map((child) => normalizeText(child.textContent))
    .filter((segment): segment is string => Boolean(segment));

  if (segments.length > 0) {
    return segments;
  }

  const fallback = normalizeText(item.textContent);
  return fallback ? [fallback] : [];
}

function resolvePublishedAt(item: Element): string | undefined {
  for (const segment of collectAnchorSegments(item)) {
    const normalized = normalizeDateToken(segment);
    if (normalized) {
      return normalized;
    }
  }

  return undefined;
}

function resolveTitle(item: Element): string | undefined {
  const segments = collectAnchorSegments(item);
  const contentSegments = segments.filter((segment) => !normalizeDateToken(segment));
  return normalizeText(contentSegments[0]);
}

function resolveSummary(item: Element): string | undefined {
  const segments = collectAnchorSegments(item);
  const contentSegments = segments.filter((segment) => !normalizeDateToken(segment));
  return normalizeText(contentSegments[1]);
}

function isIssueEntry(item: Element): boolean {
  const title = resolveTitle(item);
  return Boolean(title && /(Newsletter|Issue)\s*\d+/i.test(title));
}

function isDatedEntry(item: Element): boolean {
  return Boolean(resolvePublishedAt(item));
}

function resolveHref(item: Element): string | undefined {
  return normalizeText(item.getAttribute("href") ?? item.querySelector("a[href]")?.getAttribute("href"));
}

function isPlainEntry(item: Element): boolean {
  const href = resolveHref(item);
  const title = resolveTitle(item);

  if (!href || !title) {
    return false;
  }

  return !/^(?:#|javascript:)/i.test(href) && !/\/?index\.htm$/i.test(href);
}

function createFetchTargets(): FetchTarget[] {
  return targetSpecs.flatMap((target) => {
    const pages = target.pages ?? 1;

    return Array.from({ length: pages }, (_, pageIndex) => {
      const id = pageIndex === 0 ? target.requestId : `${target.requestId}/index${pageIndex}`;
      const path = pageIndex === 0 ? target.path : target.path.replace("index.htm", `index${pageIndex}.htm`);

      return {
        id,
        url: `${baseUrl}${path}`,
        channel: target.channel,
      } satisfies FetchTarget;
    });
  });
}

const parserConfig: HtmlListParserConfig = {
  parserKey: "bnuzh/gjjlyhzbgs",
  targets: targetSpecs.flatMap((target) => {
    const pages = target.pages ?? 1;

    return Array.from({ length: pages }, (_, pageIndex) => ({
      requestId: pageIndex === 0 ? target.requestId : `${target.requestId}/index${pageIndex}`,
      itemSelector: target.itemSelector ?? "li > a[href]",
      channel: target.channel,
      title: resolveTitle,
      url: { attr: "href" },
      publishedAt: target.kind === "dated" ? resolvePublishedAt : undefined,
      summary: target.kind === "dated" ? resolveSummary : undefined,
      rawId: { attr: "href" },
      limit: 20,
      itemFilter:
        target.kind === "dated" ? isDatedEntry : target.kind === "issue" ? isIssueEntry : isPlainEntry,
    }));
  }),
};

export const gjjlyhzbgsFetchTargets: FetchTarget[] = createFetchTargets();
export const gjjlyhzbgsParser = createConfiguredHtmlListParser(parserConfig);
