import { normalizeDateToken } from "../parsers/html";
import { targetSpecs } from "./targets/hwsywz";
export { hwsywzFetchTargets } from "./targets/hwsywz";

import {
  createConfiguredHtmlListParser,
  type HtmlListParserConfig,
} from "../parsers/configuredHtmlListParser";

function resolvePublishedAt(item: Element): string | undefined {
  const selectors = [".flex-shrink-0", ".time", ".date", "time"];

  for (const selector of selectors) {
    const value = normalizeDateToken(item.querySelector(selector)?.textContent);
    if (value) {
      return value;
    }
  }

  return normalizeDateToken(item.textContent);
}

const parserConfig: HtmlListParserConfig = {
  parserKey: "bnuzh/hwsywz",
  targets: targetSpecs.map((target) => ({
    requestId: target.requestId,
    itemSelector: "ul.article-list > li",
    channel: target.channel,
    title: ".title",
    url: { selector: "a", attr: "href" },
    publishedAt: resolvePublishedAt,
    rawId: { selector: "a", attr: "href" },
    limit: 20,
  })),
};

export const hwsywzParser = createConfiguredHtmlListParser(parserConfig);
