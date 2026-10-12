import { targetSpecs } from "./targets/jsjysjw";
export { jsjysjwFetchTargets } from "./targets/jsjysjw";

import { createConfiguredHtmlListParser } from "../parsers/configuredHtmlListParser";

export const jsjysjwParser = createConfiguredHtmlListParser({
  parserKey: "bnuzh/jsjysjw",
  targets: targetSpecs.map((target) => ({
    requestId: target.requestId,
    itemSelector: "ul.block-list64 > li",
    channel: target.channel,
    title: ".gpArticleTitle",
    url: { selector: "a", attr: "href" },
    publishedAt: ".gpArticleDate",
    rawId: { selector: "a", attr: "href" },
    limit: 15,
  })),
});
