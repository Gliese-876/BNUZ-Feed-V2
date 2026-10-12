import { normalizeText } from "../parsers/html";
import { targetSpecs } from "./targets/yxw";
export { yxwFetchTargets } from "./targets/yxw";

import { createConfiguredHtmlListParser, type HtmlListParserConfig } from "../parsers/configuredHtmlListParser";

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

export const yxwParser = createConfiguredHtmlListParser(parserConfig);
