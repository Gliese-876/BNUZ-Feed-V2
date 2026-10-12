import { targetSpecs } from "./targets/lgsyptwz";
export { lgsyptwzFetchTargets } from "./targets/lgsyptwz";

import { createConfiguredHtmlListParser, type HtmlListParserConfig } from "../parsers/configuredHtmlListParser";

const parserConfig: HtmlListParserConfig = {
  parserKey: "bnuzh/lgsyptwz",
  targets: targetSpecs.map((target) => ({
    requestId: target.requestId,
    itemSelector: target.itemSelector,
    channel: target.channel,
    title: target.title,
    url: target.url,
    publishedAt: target.publishedAt,
    rawId: target.rawId,
  })),
};

export const lgsyptwzParser = createConfiguredHtmlListParser(parserConfig);
