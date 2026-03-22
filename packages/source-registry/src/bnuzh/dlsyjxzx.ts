import type { FetchTarget } from "@bnuz-feed/contracts";

import { createConfiguredHtmlListParser } from "../parsers/configuredHtmlListParser";

const baseUrl = "https://sczx.bnuzh.edu.cn/dlsyjxzx/";

export const dlsyjxzxFetchTargets: FetchTarget[] = [
  {
    id: "xwzx",
    url: `${baseUrl}xwzx/index.htm`,
    channel: "新闻中心",
  },
  {
    id: "sjhd",
    url: `${baseUrl}sjhd/index.htm`,
    channel: "实践活动",
  },
  {
    id: "xsqy",
    url: `${baseUrl}xsqy/index.htm`,
    channel: "学术前沿",
  },
  {
    id: "kpzl",
    url: `${baseUrl}kpzl/index.htm`,
    channel: "科普专栏",
  },
  {
    id: "cgzs",
    url: `${baseUrl}index.htm`,
    channel: "成果展示",
  },
  {
    id: "xkjs",
    url: `${baseUrl}sjcx/xkjs/index.htm`,
    channel: "学科竞赛",
  },
  {
    id: "cxcy",
    url: `${baseUrl}sjcx/cxcy/index.htm`,
    channel: "创新创业",
  },
];

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
