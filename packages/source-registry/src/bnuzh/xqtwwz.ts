import { normalizeText } from "../parsers/html";
import { targetSpecs } from "./targets/xqtwwz";
export { xqtwwzFetchTargets } from "./targets/xqtwwz";

import { createConfiguredHtmlListParser, type HtmlListParserConfig } from "../parsers/configuredHtmlListParser";

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
export const xqtwwzParser = createConfiguredHtmlListParser(parserConfig);
