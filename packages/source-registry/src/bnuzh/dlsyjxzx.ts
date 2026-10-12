export { dlsyjxzxFetchTargets } from "./targets/dlsyjxzx";

import { createConfiguredHtmlListParser } from "../parsers/configuredHtmlListParser";

export const dlsyjxzxParser = createConfiguredHtmlListParser({
  parserKey: "bnuzh/dlsyjxzx",
  targets: [
    {
      requestId: "xwzx",
      itemSelector: ".page-list12 ul.block-list > li > a.gpTextArea",
      channel: "新闻中心",
      title: ".gpArticleTitle",
      url: { attr: "href" },
      publishedAt: ".gpArticleDate",
    },
    {
      requestId: "sjhd",
      itemSelector: ".page-list12 ul.block-list > li > a.gpTextArea",
      channel: "实践活动",
      title: ".gpArticleTitle",
      url: { attr: "href" },
      publishedAt: ".gpArticleDate",
    },
    {
      requestId: "xsqy",
      itemSelector: ".page-list12 ul.block-list > li > a.gpTextArea",
      channel: "学术前沿",
      title: ".gpArticleTitle",
      url: { attr: "href" },
      publishedAt: ".gpArticleDate",
    },
    {
      requestId: "kpzl",
      itemSelector: ".page-list12 ul.block-list > li > a.gpTextArea",
      channel: "科普专栏",
      title: ".gpArticleTitle",
      url: { attr: "href" },
      publishedAt: ".gpArticleDate",
    },
    {
      requestId: "cgzs",
      itemSelector: ".carousel57 .slick-slider > a.gpTextArea",
      channel: "成果展示",
      title: ".gpArticleTitle",
      url: { attr: "href" },
      publishedAt: ".gpArticleDate",
    },
    {
      requestId: "xkjs",
      itemSelector: ".page-list12 ul.block-list > li > a.gpTextArea",
      channel: "学科竞赛",
      title: ".gpArticleTitle",
      url: { attr: "href" },
      publishedAt: ".gpArticleDate",
    },
    {
      requestId: "cxcy",
      itemSelector: ".page-list12 ul.block-list > li > a.gpTextArea",
      channel: "创新创业",
      title: ".gpArticleTitle",
      url: { attr: "href" },
      publishedAt: ".gpArticleDate",
    },
  ],
});
