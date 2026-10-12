import { normalizeText } from "../parsers/html";
export { xqfzjjhwzFetchTargets } from "./targets/xqfzjjhwz";

import { createConfiguredHtmlListParser, type HtmlListParserConfig } from "../parsers/configuredHtmlListParser";

function resolveMonthDayPublishedAt(item: Element): string | undefined {
  const day = normalizeText(item.querySelector(".day")?.textContent);
  const month = normalizeText(item.querySelector(".month")?.textContent);

  if (!day || !month) {
    return undefined;
  }

  const monthMatch = month.match(/(\d{1,2})月/);
  if (!monthMatch) {
    return undefined;
  }

  return `${monthMatch[1]!.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

const parserConfig: HtmlListParserConfig = {
  parserKey: "bnuzh/xqfzjjhwz",
  targets: [
    {
      requestId: "sylb",
      itemSelector: ".common-article-list3 > li",
      channel: "首页轮播",
      title: ".title",
      url: { selector: "a.item", attr: "href" },
      rawId: { selector: "a.item", attr: "href" },
    },
    {
      requestId: "tzgg",
      itemSelector: ".common-article-list3 > li",
      channel: "通知公告",
      title: ".title",
      url: { selector: "a.item", attr: "href" },
      rawId: { selector: "a.item", attr: "href" },
    },
    {
      requestId: "xwzx",
      itemSelector: ".common-article-list3 > li",
      channel: "新闻资讯",
      title: ".title",
      url: { selector: "a.item", attr: "href" },
      rawId: { selector: "a.item", attr: "href" },
    },
    {
      requestId: "gzdt",
      itemSelector: ".common-article-list1 > li",
      channel: "工作动态",
      title: ".title",
      url: { selector: "a.item", attr: "href" },
      publishedAt: resolveMonthDayPublishedAt,
      summary: ".summary",
      rawId: { selector: "a.item", attr: "href" },
    },
    {
      requestId: "ysjh",
      itemSelector: ".common-article-list1 > li",
      channel: "优师计划",
      title: ".title",
      url: { selector: "a.item", attr: "href" },
      publishedAt: resolveMonthDayPublishedAt,
      summary: ".summary",
      rawId: { selector: "a.item", attr: "href" },
    },
    {
      requestId: "xmzs",
      itemSelector: ".common-article-list3 > li",
      channel: "项目展示",
      title: ".title",
      url: { selector: "a.item", attr: "href" },
      rawId: { selector: "a.item", attr: "href" },
    },
    {
      requestId: "mkxm",
      itemSelector: ".project-list > .col-lg-4 > a.item",
      channel: "募款项目",
      title: ".fs-2",
      url: { attr: "href" },
      summary: ".summary",
      rawId: { attr: "href" },
    },
    {
      requestId: "zyztd",
      itemSelector: ".common-article-list2 > .col-lg-4 > a.item",
      channel: "志愿者团队",
      title: ".title",
      url: { attr: "href" },
      summary: ".summary",
      rawId: { attr: "href" },
    },
    {
      requestId: "njbghsj",
      itemSelector: ".common-article-list3 > li",
      channel: "年检报告和审计",
      title: ".title",
      url: { selector: "a.item", attr: "href" },
      rawId: { selector: "a.item", attr: "href" },
    },
    {
      requestId: "glbf",
      itemSelector: ".common-article-list3 > li",
      channel: "管理办法",
      title: ".title",
      url: { selector: "a.item", attr: "href" },
      rawId: { selector: "a.item", attr: "href" },
    },
    {
      requestId: "bslc",
      itemSelector: ".common-article-list3 > li",
      channel: "办事流程",
      title: ".title",
      url: { selector: "a.item", attr: "href" },
      rawId: { selector: "a.item", attr: "href" },
    },
    {
      requestId: "zcfg",
      itemSelector: ".common-article-list3 > li",
      channel: "政策法规",
      title: ".title",
      url: { selector: "a.item", attr: "href" },
      rawId: { selector: "a.item", attr: "href" },
    },
  ],
};

export const xqfzjjhwzParser = createConfiguredHtmlListParser(parserConfig);
