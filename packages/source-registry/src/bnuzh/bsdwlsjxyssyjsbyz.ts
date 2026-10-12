import { sectionTargets } from "./targets/bsdwlsjxyssyjsbyz";
export { bsdwlsjxyssyjsbyzFetchTargets } from "./targets/bsdwlsjxyssyjsbyz";

import {
  createConfiguredHtmlListParser,
  type HtmlListParserConfig,
} from "../parsers/configuredHtmlListParser";

const parserConfig: HtmlListParserConfig = {
  parserKey: "bnuzh/bsdwlsjxyssyjsbyz",
  targets: sectionTargets.map((target) => ({
    requestId: target.requestId,
    itemSelector: "li.enter-item a",
    channel: target.channel,
    title: ".name span:first-child",
    url: { attr: "href" },
    summary: ".name .en",
    rawId: { attr: "href" },
  })),
};

export const bsdwlsjxyssyjsbyzParser = createConfiguredHtmlListParser(parserConfig);
