import { normalizeText, normalizeDateTokenWithDayNumber as normalizeDateToken } from "../parsers/html";
import { targetSpecs } from "./targets/xcxy";
export { xcxyFetchTargets } from "./targets/xcxy";

import { createConfiguredHtmlListParser, type HtmlListParserConfig } from "../parsers/configuredHtmlListParser";

function resolveTitle(item: Element): string | undefined {
  return normalizeText(item.querySelector(".mg-sec-top-post h4 a")?.textContent ?? item.textContent);
}

function resolveRawId(item: Element): string | undefined {
  return normalizeText(item.querySelector(".mg-sec-top-post h4 a")?.getAttribute("href"));
}

function resolvePublishedAt(item: Element): string | undefined {
  const candidates: Array<string | null | undefined> = [
    item.querySelector(".mg-blog-date")?.textContent,
    item.querySelector(".mg-blog-meta")?.textContent,
    item.textContent,
  ];

  for (const candidate of candidates) {
    const value = normalizeDateToken(candidate);
    if (value) {
      return value;
    }
  }

  return undefined;
}

function resolveSummary(item: Element): string | undefined {
  return normalizeText(item.querySelector(".mg-sec-top-post p")?.textContent);
}

const parserConfig: HtmlListParserConfig = {
  parserKey: "bnuzh/xcxy",
  targets: targetSpecs.map((target) => ({
    requestId: target.requestId,
    itemSelector: "article.d-md-flex.mg-posts-sec-post",
    channel: target.channel,
    title: resolveTitle,
    url: { selector: ".mg-sec-top-post h4 a", attr: "href" },
    publishedAt: resolvePublishedAt,
    summary: resolveSummary,
    rawId: resolveRawId,
  })),
};

export const xcxyParser = createConfiguredHtmlListParser(parserConfig);
