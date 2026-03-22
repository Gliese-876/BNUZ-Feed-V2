import type { FetchTarget } from "@bnuz-feed/contracts";

import { createConfiguredHtmlListParser, type HtmlListParserConfig } from "../parsers/configuredHtmlListParser";

type TargetSpec = {
  requestId: string;
  path: string;
  channel: string;
};

const baseUrl = "https://welcome.bnuzh.edu.cn/";

const targetSpecs: TargetSpec[] = [
  { requestId: "yxkx/index", path: "yxkx/index.htm", channel: "迎新快讯" },
  { requestId: "yxkx/index1", path: "yxkx/index1.htm", channel: "迎新快讯" },
  { requestId: "yxzy/index", path: "yxzy/index.htm", channel: "迎新指引" },
  { requestId: "xzbsd/index", path: "xzbsd/index.htm", channel: "学在北师大" },
  { requestId: "zzbsd/index", path: "zzbsd/index.htm", channel: "住在北师大" },
  { requestId: "lzbsd/index", path: "lzbsd/index.blk.htm", channel: "乐在北师大" },
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

  const fullMatch = compact.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})$/);
  if (fullMatch) {
    const [, year = "", month = "", day = ""] = fullMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const monthDayMatch = compact.match(/^(\d{1,2})[./-](\d{1,2})$/);
  if (monthDayMatch) {
    const [, month = "", day = ""] = monthDayMatch;
    return `${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  return undefined;
}

function resolveTitle(item: Element): string | undefined {
  return normalizeText(item.querySelector(".artTxt a")?.textContent);
}

function resolvePublishedAt(item: Element): string | undefined {
  const yearToken = normalizeText(item.querySelector(".year")?.textContent);
  const dateToken = normalizeText(item.querySelector(".date")?.textContent);

  if (yearToken && dateToken) {
    const yearMonthMatch = yearToken.match(/^(\d{4})[-/](\d{1,2})$/);
    if (yearMonthMatch) {
      const [, year = "", month = ""] = yearMonthMatch;
      const day = dateToken.match(/^(\d{1,2})$/)?.[1];
      if (day) {
        return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      }
    }
  }

  return normalizeDateToken(item.textContent);
}

const parserConfig: HtmlListParserConfig = {
  parserKey: "bnuzh/yxw",
  targets: targetSpecs.map((target) => ({
    requestId: target.requestId,
    itemSelector: "article .listShow > ul > li",
    channel: target.channel,
    title: resolveTitle,
    url: { selector: ".artTxt a", attr: "href" },
    publishedAt: resolvePublishedAt,
    rawId: { selector: ".artTxt a", attr: "href" },
    limit: 20,
  })),
};

export const yxwFetchTargets: FetchTarget[] = targetSpecs.map((target) => ({
  id: target.requestId,
  url: `${baseUrl}${target.path}`,
  channel: target.channel,
}));

export const yxwParser = createConfiguredHtmlListParser(parserConfig);
