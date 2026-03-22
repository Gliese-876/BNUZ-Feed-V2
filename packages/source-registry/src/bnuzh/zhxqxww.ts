import type { FetchTarget } from "@bnuz-feed/contracts";

import { createConfiguredHtmlListParser, type HtmlListParserConfig } from "../parsers/configuredHtmlListParser";

type PageTarget = {
  requestId: string;
  channel: string;
  path: string;
};

const baseUrl = "https://zhnews.bnuzh.edu.cn";

const ttgzPages = Array.from({ length: 38 }, (_, index) => index);
const tzggPages = Array.from({ length: 17 }, (_, index) => index);
const zhbdPages = Array.from({ length: 81 }, (_, index) => index);

const ttgzTargets: PageTarget[] = ttgzPages.map((pageIndex) => ({
  requestId: pageIndex === 0 ? "ttgz" : `ttgz/index${pageIndex}`,
  channel: "头条关注",
  path: pageIndex === 0 ? "/ttgz/index.htm" : `/ttgz/index${pageIndex}.htm`,
}));

const tzggTargets: PageTarget[] = tzggPages.map((pageIndex) => ({
  requestId: pageIndex === 0 ? "tzgg" : `tzgg/index${pageIndex}`,
  channel: "通知公告",
  path: pageIndex === 0 ? "/tzgg/index.htm" : `/tzgg/index${pageIndex}.htm`,
}));

const zhbdTargets: PageTarget[] = zhbdPages.map((pageIndex) => ({
  requestId: pageIndex === 0 ? "zhbd" : `zhbd/index${pageIndex}`,
  channel: "综合报道",
  path: pageIndex === 0 ? "/zhbd/index.htm" : `/zhbd/index${pageIndex}.htm`,
}));

const mtsdTargets: PageTarget[] = [
  {
    requestId: "mtsd",
    channel: "媒体师大",
    path: "/mtsd/index.htm",
  },
];

const gysdTargets: PageTarget[] = [
  {
    requestId: "gysd",
    channel: "光影师大",
    path: "/gysd/index.htm",
  },
];

function normalizeText(value: string | null | undefined): string | undefined {
  const normalized = value?.replace(/\s+/g, " ").trim();
  return normalized ? normalized : undefined;
}

function resolveMonthDay(item: Element): string | undefined {
  const day = normalizeText(item.querySelector(".list-date02 strong")?.textContent)?.match(/\d{1,2}/)?.[0];
  const yearMonth = normalizeText(item.querySelector(".list-date02 span")?.textContent)?.match(/^(\d{4})-(\d{1,2})$/);

  if (!day || !yearMonth) {
    return undefined;
  }

  const [, year = "", month = ""] = yearMonth;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

const parserTargets: HtmlListParserConfig["targets"] = [
  ...ttgzTargets.map((target) => ({
    requestId: target.requestId,
    itemSelector: ".bnu-list01 > li",
    channel: target.channel,
    title: ".item-txt01 h3",
    url: { selector: "a", attr: "href" },
    publishedAt: ".item-date01",
    rawId: { selector: "a", attr: "href" },
    limit: 20,
  })),
  ...tzggTargets.map((target) => ({
    requestId: target.requestId,
    itemSelector: ".bnu-list02 > li",
    channel: target.channel,
    title: "a",
    url: { selector: "a", attr: "href" },
    publishedAt: resolveMonthDay,
    rawId: { selector: "a", attr: "href" },
    limit: 20,
  })),
  ...zhbdTargets.map((target) => ({
    requestId: target.requestId,
    itemSelector: ".bnu-list02 > li",
    channel: target.channel,
    title: "a",
    url: { selector: "a", attr: "href" },
    publishedAt: resolveMonthDay,
    rawId: { selector: "a", attr: "href" },
    limit: 20,
  })),
  ...mtsdTargets.map((target) => ({
    requestId: target.requestId,
    itemSelector: ".bnu-list02 > li",
    channel: target.channel,
    title: "a",
    url: { selector: "a", attr: "href" },
    publishedAt: resolveMonthDay,
    rawId: { selector: "a", attr: "href" },
    limit: 20,
  })),
  ...gysdTargets.map((target) => ({
    requestId: target.requestId,
    itemSelector: ".bnu-list03 > li",
    channel: target.channel,
    title: ".fpx16",
    url: { selector: "a", attr: "href" },
    rawId: { selector: "a", attr: "href" },
    limit: 20,
  })),
];

export const zhxqxwwFetchTargets: FetchTarget[] = [...ttgzTargets, ...tzggTargets, ...zhbdTargets, ...mtsdTargets, ...gysdTargets].map((target) => ({
  id: target.requestId,
  url: `${baseUrl}${target.path}`,
  channel: target.channel,
}));

export const zhxqxwwParser = createConfiguredHtmlListParser({
  parserKey: "bnuzh/zhxqxww",
  targets: parserTargets,
});
