import type { FetchTarget } from "@bnuz-feed/contracts";

import { createConfiguredHtmlListParser, type HtmlListParserConfig } from "../parsers/configuredHtmlListParser";

const articleListItemSelector = ".common-pic-article-list > li";
const articleLinkSelector = ".article";
const articleTitleSelector = ".article-title";
const articleDateSelector = ".article-publish-time";

const listTargets: HtmlListParserConfig["targets"] = [
  {
    requestId: "latest",
    itemSelector: articleListItemSelector,
    channel: "最新动态",
    title: articleTitleSelector,
    url: { selector: articleLinkSelector, attr: "href" },
    publishedAt: articleDateSelector,
    rawId: (item) => item.querySelector(articleLinkSelector)?.getAttribute("href") ?? undefined,
  },
  {
    requestId: "bgxw",
    itemSelector: articleListItemSelector,
    channel: "本馆新闻",
    title: articleTitleSelector,
    url: { selector: articleLinkSelector, attr: "href" },
    publishedAt: articleDateSelector,
    rawId: (item) => item.querySelector(articleLinkSelector)?.getAttribute("href") ?? undefined,
  },
  {
    requestId: "zcjd",
    itemSelector: articleListItemSelector,
    channel: "政策解读",
    title: articleTitleSelector,
    url: { selector: articleLinkSelector, attr: "href" },
    publishedAt: articleDateSelector,
    rawId: (item) => item.querySelector(articleLinkSelector)?.getAttribute("href") ?? undefined,
  },
  {
    requestId: "xydc",
    itemSelector: articleListItemSelector,
    channel: "行业洞察",
    title: articleTitleSelector,
    url: { selector: articleLinkSelector, attr: "href" },
    publishedAt: articleDateSelector,
    rawId: (item) => item.querySelector(articleLinkSelector)?.getAttribute("href") ?? undefined,
  },
  {
    requestId: "hdhg",
    itemSelector: articleListItemSelector,
    channel: "活动回顾",
    title: articleTitleSelector,
    url: { selector: articleLinkSelector, attr: "href" },
    publishedAt: articleDateSelector,
    rawId: (item) => item.querySelector(articleLinkSelector)?.getAttribute("href") ?? undefined,
  },
];

export const bjsfdxetbwgFetchTargets: FetchTarget[] = [
  { id: "latest", url: "https://childrensmuseum.bnuzh.edu.cn/zxdt/index.htm", channel: "最新动态" },
  { id: "bgxw", url: "https://childrensmuseum.bnuzh.edu.cn/xwdt/bgxw/index.htm", channel: "本馆新闻" },
  { id: "zcjd", url: "https://childrensmuseum.bnuzh.edu.cn/xwdt/zcjd/index.htm", channel: "政策解读" },
  { id: "xydc", url: "https://childrensmuseum.bnuzh.edu.cn/xwdt/xydc/index.htm", channel: "行业洞察" },
  { id: "hdhg", url: "https://childrensmuseum.bnuzh.edu.cn/xwdt/hdhg/index.htm", channel: "活动回顾" },
];

export const bjsfdxetbwgParser = createConfiguredHtmlListParser({
  parserKey: "bnuzh/bjsfdxetbwg",
  targets: listTargets,
});
