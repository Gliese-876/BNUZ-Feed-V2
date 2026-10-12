import { normalizeText } from "../parsers/html";
import { targetSpecs } from "./targets/fhsyyww";
export { fhsyywwFetchTargets } from "./targets/fhsyyww";

import { createConfiguredHtmlListParser, type HtmlListParserConfig } from "../parsers/configuredHtmlListParser";

function extractPublishedAt(value: string | null | undefined): string | undefined {
  const normalized = normalizeText(value);
  if (!normalized) {
    return undefined;
  }

  const compact = normalized.replace(/\s+/g, "");

  const fullMatch = compact.match(/(\d{4})[./-](\d{1,2})[./-](\d{1,2})/);
  if (fullMatch) {
    const [, year = "", month = "", day = ""] = fullMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const monthDayMatch = compact.match(/(\d{1,2})[./-](\d{1,2})/);
  if (monthDayMatch) {
    const [, month = "", day = ""] = monthDayMatch;
    return `${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  return undefined;
}

function resolveTitle(item: Element): string | undefined {
  const selectors = ["h3", "h5", "h4", ".gp-ellipsis", ".title", ".n_right h3"];

  for (const selector of selectors) {
    const text = normalizeText(item.querySelector(selector)?.textContent);
    if (text) {
      return text;
    }
  }

  return normalizeText(item.querySelector("a[href]")?.textContent ?? item.textContent);
}

function resolveSummary(item: Element): string | undefined {
  const selectors = ["p", ".summary", ".desc", ".intro"];

  for (const selector of selectors) {
    const text = normalizeText(item.querySelector(selector)?.textContent);
    if (text) {
      return text;
    }
  }

  return undefined;
}

const parserConfig: HtmlListParserConfig = {
  parserKey: "bnuzh/fhsyyww",
  targets: targetSpecs.map((target) => ({
    requestId: target.requestId,
    itemSelector: target.itemSelector,
    channel: target.channel,
    title: resolveTitle,
    url: { selector: "a[href]", attr: "href" },
    publishedAt: (item) => extractPublishedAt(item.textContent),
    summary: resolveSummary,
    rawId: { selector: "a[href]", attr: "href" },
    limit: 20,
    itemFilter: (item) => Boolean(item.querySelector("a[href]") && extractPublishedAt(item.textContent)),
  })),
};

export const fhsyywwParser = createConfiguredHtmlListParser(parserConfig);
