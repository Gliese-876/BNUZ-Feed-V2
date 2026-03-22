import type { FetchTarget } from "@bnuz-feed/contracts";

import {
  createConfiguredHtmlListParser,
  type HtmlListParserConfig,
} from "../parsers/configuredHtmlListParser";

const baseUrl = "https://library.bnuzh.edu.cn/";
const itemSelector = "main a.item";

const sectionTargets: Array<{
  requestId: string;
  url: string;
  channel: string;
}> = [
  {
    requestId: "zxxx",
    url: `${baseUrl}zxxx/index.htm`,
    channel: "最新消息",
  },
  {
    requestId: "zydt",
    url: `${baseUrl}zy/zydt/index.htm`,
    channel: "资源动态",
  },
  {
    requestId: "tpxw",
    url: `${baseUrl}tpxw/index.htm`,
    channel: "图片新闻",
  },
  {
    requestId: "xssd",
    url: `${baseUrl}xssd/index.htm`,
    channel: "新书速睇",
  },
  {
    requestId: "dttc",
    url: `${baseUrl}dttc/index.htm`,
    channel: "大套特藏",
  },
  {
    requestId: "pxjz",
    url: `${baseUrl}pxjz/index.htm`,
    channel: "培训讲座",
  },
];

export const tsgFetchTargets: FetchTarget[] = sectionTargets.map((target) => ({
  id: target.requestId,
  url: target.url,
  channel: target.channel,
}));

const parserConfig: HtmlListParserConfig = {
  parserKey: "bnuzh/tsg",
  targets: sectionTargets.map((target) => ({
    requestId: target.requestId,
    itemSelector,
    channel: target.channel,
    title: ".title",
    url: { attr: "href" },
    publishedAt: ".time",
    rawId: { attr: "href" },
    limit: 20,
  })),
};

export const tsgParser = createConfiguredHtmlListParser(parserConfig);
