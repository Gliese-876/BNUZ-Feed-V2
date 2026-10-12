import { normalizeText } from "../parsers/html";
import { targetSpecs } from "./targets/dwjsgzbgs";
export { dwjsgzbgsFetchTargets } from "./targets/dwjsgzbgs";

import { createConfiguredHtmlListParser, type HtmlListParserConfig } from "../parsers/configuredHtmlListParser";

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
