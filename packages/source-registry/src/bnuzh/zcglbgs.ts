import { targetSpecs } from "./targets/zcglbgs";
import { normalizeText, normalizeDateToken } from "../parsers/html";
export { zcglbgsFetchTargets } from "./targets/zcglbgs";

import { createConfiguredHtmlListParser, type HtmlListParserConfig } from "../parsers/configuredHtmlListParser";

function resolvePublishedAtFromText(item: Element): string | undefined {
  const dateNodes = [
    item.querySelector(".time"),
    item.querySelector(".date"),
    item.querySelector("time"),
    item.querySelector(".publish-time"),
  ];

  for (const node of dateNodes) {
    const value = normalizeDateToken(node?.textContent);
    if (value) {
      return value;
    }
  }

  return normalizeDateToken(item.textContent);
}

function resolveCalendarPublishedAt(item: Element): string | undefined {
  const year = normalizeText(item.querySelector(".calendar .year")?.textContent);
  const monthDay = normalizeText(item.querySelector(".calendar .day")?.textContent);

  if (!year || !monthDay) {
    return undefined;
  }

  const compact = monthDay.replace(/\s+/g, "");
  const match = compact.match(/^(\d{1,2})[./-](\d{1,2})$/);
  if (!match) {
    return undefined;
  }

  const [, month = "", day = ""] = match;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

const parserConfig: HtmlListParserConfig = {
  parserKey: "bnuzh/zcglbgs",
  targets: targetSpecs.map((target) => {
    const news = target.requestId === "xwdt";
    const event = target.requestId === "ghhd";
    const link = event ? "a.event" : "a.item";
    return {
      requestId: target.requestId,
      channel: target.channel,
      itemSelector: news ? "div.page-content ul.news-article-list > li"
        : event ? "div.page-content .event-list > .col-lg-4" : "div.page-content .common-article-list > li",
      title: ".title",
      url: { selector: link, attr: "href" },
      rawId: { selector: link, attr: "href" },
      publishedAt: event ? undefined : news ? resolveCalendarPublishedAt : resolvePublishedAtFromText,
      summary: news ? ".summary" : undefined,
    };
  }),
};

export const zcglbgsParser = createConfiguredHtmlListParser(parserConfig);
