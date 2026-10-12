import { sectionTargets } from "./targets/tsg";
export { tsgFetchTargets } from "./targets/tsg";

import {
  createConfiguredHtmlListParser,
  type HtmlListParserConfig,
} from "../parsers/configuredHtmlListParser";
const itemSelector = "main a.item";

const parserConfig: HtmlListParserConfig = {
  parserKey: "bnuzh/tsg",
  targets: sectionTargets.map((target) => ({
    requestId: target.requestId,
    itemSelector,
    channel: target.channel,
    title: ".title",
    url: { attr: "href" },
    publishedAt: ".time",
    rawId: { attr: "href" },
    limit: 20,
  })),
};

export const tsgParser = createConfiguredHtmlListParser(parserConfig);
