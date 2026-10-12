import type { HtmlListTargetConfig } from "./configuredHtmlListParser";
import { normalizeText } from "./html";

interface ZhixingTarget { requestId: string; channel: string; }

function extractPublishedAt(item: Element): string | undefined {
  const day = normalizeText(item.querySelector(".calendar .date")?.textContent)?.match(/\d{1,2}/)?.[0];
  const month = normalizeText(item.querySelector(".calendar .month")?.textContent)?.match(/\d{1,2}/)?.[0];
  const year = normalizeText(item.querySelector(".calendar .year")?.textContent)?.match(/\d{4}/)?.[0];

  if (!day || !month || !year) {
    return undefined;
  }

  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

export function createStandardTarget(target: ZhixingTarget): HtmlListTargetConfig {
  return {
    requestId: target.requestId,
    itemSelector: ".common-article-list > li",
    channel: target.channel,
    title: ".article > div:first-child",
    url: { selector: ".article", attr: "href" },
    publishedAt: ".time",
    rawId: { selector: ".article", attr: "href" },
    limit: 20,
  };
}

export function createNewsCardTarget(target: ZhixingTarget): HtmlListTargetConfig {
  return {
    requestId: target.requestId,
    itemSelector: "a.article[href]",
    channel: target.channel,
    title: ".title",
    url: { attr: "href" },
    publishedAt: extractPublishedAt,
    summary: ".summary",
    rawId: { attr: "href" },
    limit: 20,
  };
}

export function createPhotoTarget(target: ZhixingTarget): HtmlListTargetConfig {
  return {
    requestId: target.requestId,
    itemSelector: ".common-pic-article .article",
    channel: target.channel,
    title: ".title",
    url: { attr: "href" },
    publishedAt: extractPublishedAt,
    summary: ".summary",
    rawId: { attr: "href" },
    limit: 20,
  };
}
