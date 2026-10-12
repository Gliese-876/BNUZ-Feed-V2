import type { FetchTarget, Parser, RawPage } from "@bnuz-feed/contracts";

import { createConfiguredHtmlListParser } from "./configuredHtmlListParser";
import { normalizeDateToken, normalizeText } from "./html";

function resolvePublishedAt(item: Element): string | undefined {
  const fullDate = normalizeDateToken(item.querySelector(".common-publish-time")?.textContent);
  if (fullDate) {
    return fullDate;
  }

  const yearMonth = normalizeText(item.querySelector(".common-list-date .month")?.textContent);
  const day = normalizeText(item.querySelector(".common-list-date .day")?.textContent);
  return yearMonth && day ? normalizeDateToken(`${yearMonth}-${day}`) : undefined;
}

function isArticleLink(item: Element, page: RawPage): boolean {
  const href = normalizeText(item.querySelector("a[href]")?.getAttribute("href"));
  if (!href || href.startsWith("#")) {
    return false;
  }

  try {
    return ["http:", "https:"].includes(new URL(href, page.finalUrl || page.requestUrl).protocol);
  } catch {
    return false;
  }
}

export function createCampusArticleListParser(parserKey: string, fetchTargets: FetchTarget[]): Parser {
  return createConfiguredHtmlListParser({
    parserKey,
    targets: fetchTargets.map((target) => ({
      requestId: target.id,
      channel: target.channel,
      itemSelector: "ul.common-article-list > li, ul.common-pic-article-list > li",
      title: ".title",
      url: { selector: "a[href]", attr: "href" },
      rawId: { selector: "a[href]", attr: "href" },
      summary: ".summary",
      publishedAt: resolvePublishedAt,
      itemFilter: isArticleLink,
    })),
  });
}
