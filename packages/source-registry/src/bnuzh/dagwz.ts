import { normalizeDateToken } from "../parsers/html";
import { targetSpecs } from "./targets/dagwz";
export { dagwzFetchTargets } from "./targets/dagwz";

import { createConfiguredHtmlListParser, type HtmlListParserConfig } from "../parsers/configuredHtmlListParser";

function resolvePublishedAt(item: Element): string | undefined {
  return normalizeDateToken(
    item.querySelector(".datew")?.textContent ??
      item.querySelector(".time")?.textContent ??
      item.querySelector("time")?.textContent ??
      item.textContent,
  );
}

const parserConfig: HtmlListParserConfig = {
  parserKey: "bnuzh/dagwz",
  targets: targetSpecs.map((target) => ({
    requestId: target.requestId,
    itemSelector: "ul.noticeUl > li",
    channel: target.channel,
    title: "p",
    url: { selector: "a", attr: "href" },
    publishedAt: resolvePublishedAt,
    rawId: { selector: "a", attr: "href" },
    limit: 20,
  })),
};

export const dagwzParser = createConfiguredHtmlListParser(parserConfig);
