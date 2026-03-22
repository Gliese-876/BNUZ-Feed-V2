import type { FetchTarget } from "@bnuz-feed/contracts";

import { createConfiguredHtmlListParser, type HtmlListParserConfig } from "../parsers/configuredHtmlListParser";

const baseUrl = "https://dwjgb.bnuzh.edu.cn/";

const targetSpecs = [
  { requestId: "gzdt/xwdt", path: "gzdt/xwdt/index.htm", channel: "\u5de5\u4f5c\u52a8\u6001" },
  { requestId: "gzdt/tzgg", path: "gzdt/tzgg/index.htm", channel: "\u901a\u77e5\u516c\u544a" },
  { requestId: "jxwz", path: "jxwz/index.htm", channel: "\u7cbe\u9009\u6587\u7ae0" },
  { requestId: "zt/ysjh", path: "zt/ysjh/index.htm", channel: "\u201c\u4f18\u5e08\u8ba1\u5212\u201d\u56de\u4fe1\u7cbe\u795e" },
  { requestId: "zt/xxddesdjs", path: "zt/xxddesdjs/index.htm", channel: "\u5b66\u4e60\u515a\u7684\u4e8c\u5341\u5927\u7cbe\u795e" },
  { requestId: "zt/dxjt", path: "zt/dxjt/index.htm", channel: "\u5fb7\u99a8\u8bb2\u575b" },
  { requestId: "sdsf/sddf", path: "sdsf/sddf/index.htm", channel: "\u5e08\u5fb7\u5178\u8303" },
  { requestId: "sdsf/jsfc", path: "sdsf/jsfc/index.htm", channel: "\u6559\u5e08\u98ce\u91c7" },
  { requestId: "xxjy/llxx", path: "xxjy/llxx/index.htm", channel: "\u7406\u8bba\u5b66\u4e60" },
  { requestId: "xxjy/jypx", path: "xxjy/jypx/index.htm", channel: "\u6559\u80b2\u57f9\u8bad" },
  { requestId: "xxjy/jsjy", path: "xxjy/jsjy/index.htm", channel: "\u8b66\u793a\u6559\u80b2" },
  { requestId: "zdjs/sjwj", path: "zdjs/sjwj/index.htm", channel: "\u4e0a\u7ea7\u6587\u4ef6" },
  { requestId: "zdjs/xxwj", path: "zdjs/xxwj/index.htm", channel: "\u5b66\u6821\u6587\u4ef6" },
  { requestId: "sdjd/clgd", path: "sdjd/clgd/index.htm", channel: "\u5904\u7406\u89c4\u5b9a" },
  { requestId: "sdjd/qktb", path: "sdjd/qktb/index.htm", channel: "\u60c5\u51b5\u901a\u62a5" },
] as const;

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

  return compact.replace(/\//g, "-");
}

function resolvePublishedAt(item: Element): string | undefined {
  const candidate = normalizeText(item.querySelector(".time")?.textContent);
  if (!candidate) {
    return undefined;
  }

  const match = candidate.match(/\d{4}\s*(?:[./-]|\u5e74)\s*\d{1,2}\s*(?:[./-]|\u6708)\s*\d{1,2}\s*(?:\u65e5)?/);
  if (!match) {
    return undefined;
  }

  return normalizeDateToken(match[0]);
}

export const dwjsgzbgsFetchTargets: FetchTarget[] = targetSpecs.map((target) => ({
  id: target.requestId,
  url: `${baseUrl}${target.path}`,
  channel: target.channel,
}));

const parserConfig: HtmlListParserConfig = {
  parserKey: "bnuzh/dwjsgzbgs",
  targets: targetSpecs.map((target) => ({
    requestId: target.requestId,
    itemSelector: "div.container.my-3.my-lg-5 .col-lg-9 ul.article-list > li",
    channel: target.channel,
    title: ".title",
    url: { selector: ".article", attr: "href" },
    publishedAt: resolvePublishedAt,
    rawId: { selector: ".article", attr: "href" },
  })),
};

export const dwjsgzbgsParser = createConfiguredHtmlListParser(parserConfig);
