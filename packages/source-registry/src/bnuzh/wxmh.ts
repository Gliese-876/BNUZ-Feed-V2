import type { FetchTarget } from "@bnuz-feed/contracts";

import { createConfiguredHtmlListParser, type HtmlListParserConfig } from "../parsers/configuredHtmlListParser";

const baseUrl = "https://wx.bnuzh.edu.cn/";
const articleSelector = ".index_01.article > h2";

function getSectionImageSources(item: Element): string[] {
  const sources: string[] = [];
  let sibling = item.nextElementSibling;

  while (sibling && sibling.tagName.toLowerCase() !== "h2") {
    for (const image of sibling.querySelectorAll("img")) {
      const src = image.getAttribute("src");
      if (src) {
        sources.push(src);
      }
    }

    sibling = sibling.nextElementSibling;
  }

  return sources;
}

function resolveSectionImageSources(
  item: Element,
  page: {
    finalUrl: string;
    requestUrl: string;
  },
): string[] {
  return getSectionImageSources(item).map((source) => {
    try {
      return new URL(source, page.finalUrl || page.requestUrl).toString();
    } catch {
      return source;
    }
  });
}

const parserConfig: HtmlListParserConfig = {
  parserKey: "bnuzh/wxmh",
  targets: [
    {
      requestId: "index",
      itemSelector: articleSelector,
      channel: "微信门户",
      title: (item) => item.textContent ?? undefined,
      url: (_item, page) => page.finalUrl || page.requestUrl,
      summary: (item, page) => {
        const sources = resolveSectionImageSources(item, page);
        return sources.length > 0 ? sources.join(" | ") : undefined;
      },
      rawId: (item) => item.textContent ?? undefined,
    },
  ],
};

export const wxmhFetchTargets: FetchTarget[] = [
  {
    id: "index",
    url: baseUrl,
    channel: "微信门户",
  },
];

export const wxmhParser = createConfiguredHtmlListParser(parserConfig);
