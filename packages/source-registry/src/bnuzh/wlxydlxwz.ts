import { targetSpecs } from "./targets/wlxydlxwz";
export { wlxydlxwzFetchTargets } from "./targets/wlxydlxwz";

import { createConfiguredHtmlListParser, type HtmlListParserConfig } from "../parsers/configuredHtmlListParser";

const parserConfig: HtmlListParserConfig = {
  parserKey: "bnuzh/wlxydlxwz",
  targets: targetSpecs.map((target) => ({
    requestId: target.requestId,
    itemSelector: ".channel-article-list > li.channel-article-item",
    channel: target.channel,
    title: ".title",
    url: { selector: "a.channel-article", attr: "href" },
    publishedAt: ".time, .date, time",
    summary: ".summary",
    rawId: { selector: "a.channel-article", attr: "href" },
  })),
};

export const wlxydlxwzParser = createConfiguredHtmlListParser(parserConfig);
