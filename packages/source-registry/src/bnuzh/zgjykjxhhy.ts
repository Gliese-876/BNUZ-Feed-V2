import type { FetchTarget } from "@bnuz-feed/contracts";

import { createConfiguredHtmlListParser, type HtmlListParserConfig } from "../parsers/configuredHtmlListParser";

type TargetSpec = {
  requestId: string;
  url: string;
  channel: string;
};

const baseUrl = "https://easc.bnuzh.edu.cn/";

const targetSpecs: TargetSpec[] = [
  { requestId: "news", url: baseUrl, channel: "新闻通知" },
  { requestId: "schedule", url: baseUrl, channel: "会议安排" },
];

function normalizeText(value: string | null | undefined): string | undefined {
  const normalized = value?.replace(/\s+/g, " ").trim();
  return normalized ? normalized : undefined;
}

function resolveNewsTitle(item: Element): string | undefined {
  return normalizeText(item.querySelector(".title")?.textContent ?? item.querySelector("a[href]")?.textContent);
}

function resolveNewsUrl(item: Element): string | undefined {
  return normalizeText(item.querySelector("a[href]")?.getAttribute("href"));
}

function normalizeDateToken(value: string | null | undefined): string | undefined {
  const text = normalizeText(value);
  if (!text) {
    return undefined;
  }

  const compact = text.replace(/\s+/g, "");

  const fullDate =
    compact.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})$/) ??
    compact.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日?$/);
  if (fullDate) {
    const [, year = "", month = "", day = ""] = fullDate;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const monthDay = compact.match(/^(\d{1,2})[./-](\d{1,2})$/) ?? compact.match(/^(\d{1,2})月(\d{1,2})日?$/);
  if (monthDay) {
    const [, month = "", day = ""] = monthDay;
    return `${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  return undefined;
}

function resolveNewsPublishedAt(item: Element): string | undefined {
  return Array.from(item.children)
    .filter((child) => child.tagName !== "A")
    .map((child) => normalizeDateToken(child.textContent))
    .find((value): value is string => Boolean(value));
}

function shouldIncludeNewsItem(item: Element): boolean {
  const hasNewsList = item.ownerDocument.querySelector("ul.news-list > li") !== null;
  if (hasNewsList) {
    return Boolean(item.closest("ul.news-list"));
  }

  return Boolean(resolveNewsTitle(item) && resolveNewsUrl(item));
}

function resolveSchedulePublishedAt(item: Element): string | undefined {
  return normalizeText(item.getAttribute("day"));
}

function resolveScheduleSummary(item: Element): string | undefined {
  return normalizeText(item.getAttribute("time"));
}

const parserConfig: HtmlListParserConfig = {
  parserKey: "bnuzh/zgjykjxhhy",
  targets: [
    {
      requestId: "news",
      itemSelector: "ul.news-list > li, #news-swiper .swiper-slide:not(.swiper-slide-duplicate)",
      channel: "新闻通知",
      title: resolveNewsTitle,
      url: { selector: "a[href]", attr: "href" },
      publishedAt: resolveNewsPublishedAt,
      rawId: resolveNewsUrl,
      itemFilter: shouldIncludeNewsItem,
    },
    {
      requestId: "schedule",
      itemSelector: "#cms-schedule-list .schedule",
      channel: "会议安排",
      title: { attr: "title" },
      url: { attr: "url" },
      publishedAt: resolveSchedulePublishedAt,
      summary: resolveScheduleSummary,
      rawId: { attr: "url" },
    },
  ],
};

export const zgjykjxhhyFetchTargets: FetchTarget[] = targetSpecs.map((target) => ({
  id: target.requestId,
  url: target.url,
  channel: target.channel,
}));

export const zgjykjxhhyParser = createConfiguredHtmlListParser(parserConfig);
