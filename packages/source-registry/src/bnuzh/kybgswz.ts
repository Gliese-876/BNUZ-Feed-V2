import { normalizeDateToken } from "../parsers/html";
import { kybgswzFetchTargets } from "./targets/kybgswz";
export { kybgswzFetchTargets } from "./targets/kybgswz";

import { createConfiguredHtmlListParser, type HtmlListParserConfig } from "../parsers/configuredHtmlListParser";

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

function createParserConfig(): HtmlListParserConfig {
  return {
    parserKey: "bnuzh/kybgswz",
    targets: kybgswzFetchTargets.map((target) => ({
      requestId: target.id,
      itemSelector: "ul.article-list > li",
      channel: target.channel,
      title: ".title",
      url: { selector: "a", attr: "href" },
      publishedAt: resolvePublishedAt,
      rawId: { selector: "a", attr: "href" },
      limit: 20,
    })),
  };
}
export const kybgswzParser = createConfiguredHtmlListParser(createParserConfig());
