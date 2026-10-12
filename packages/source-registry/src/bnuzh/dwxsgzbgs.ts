import { normalizeDateToken } from "../parsers/html";
import { targetSpecs, createRequestId } from "./targets/dwxsgzbgs";
export { dwxsgzbgsFetchTargets } from "./targets/dwxsgzbgs";

import { createConfiguredHtmlListParser, type HtmlListParserConfig } from "../parsers/configuredHtmlListParser";

function resolvePublishedAt(item: Element): string | undefined {
  return normalizeDateToken(item.querySelector(".flex-shrink-0")?.textContent);
}

const parserConfig: HtmlListParserConfig = {
  parserKey: "bnuzh/dwxsgzbgs",
  targets: targetSpecs.flatMap((target) =>
    Array.from({ length: target.pages }, (_, pageIndex) => ({
      requestId: createRequestId(target.requestId, pageIndex),
      itemSelector: "ul.article-list > li",
      channel: target.channel,
      title: ".title",
      url: { selector: "a[href]", attr: "href" },
      publishedAt: resolvePublishedAt,
      rawId: { selector: "a[href]", attr: "href" },
    })),
  ),
};
export const dwxsgzbgsParser = createConfiguredHtmlListParser(parserConfig);
