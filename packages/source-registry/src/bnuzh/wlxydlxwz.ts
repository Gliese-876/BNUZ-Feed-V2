import type { FetchTarget } from "@bnuz-feed/contracts";

import { createConfiguredHtmlListParser, type HtmlListParserConfig } from "../parsers/configuredHtmlListParser";

type TargetSpec = {
  requestId: string;
  path: string;
  channel: string;
};

const baseUrl = "https://geo.bnuzh.edu.cn/";

const targetSpecs: TargetSpec[] = [
  { requestId: "xwzx", path: "xwzx/index.htm", channel: "\u65b0\u95fb\u4e2d\u5fc3" },
  { requestId: "dljg", path: "kpzl/dljg/index.htm", channel: "\u5730\u7406\u666f\u89c2" },
  { requestId: "dlkp", path: "kpzl/dlkp/index.htm", channel: "\u5730\u7406\u79d1\u666e" },
  { requestId: "kysj", path: "xsyd/kysj/index.htm", channel: "\u79d1\u7814\u5b9e\u8df5" },
  { requestId: "jysj", path: "xsyd/jysj/index.htm", channel: "\u6559\u80b2\u5b9e\u8df5" },
  { requestId: "xsfc", path: "xsyd/xsfc/index.htm", channel: "\u5b66\u751f\u98ce\u91c7" },
  { requestId: "xsst", path: "xsyd/xsst/index.htm", channel: "\u5b66\u751f\u793e\u56e2" },
  { requestId: "wjxz", path: "cyxz/wjxz/index.htm", channel: "\u6587\u4ef6\u4e0b\u8f7d" },
  { requestId: "sxsy", path: "syzx/jxzy/index.htm", channel: "\u5b9e\u4e60\u5b9e\u9a8c" },
];

const parserConfig: HtmlListParserConfig = {
  parserKey: "bnuzh/wlxydlxwz",
  targets: targetSpecs.map((target) => ({
    requestId: target.requestId,
    itemSelector: ".channel-article-list > li.channel-article-item",
    channel: target.channel,
    title: ".title",
    url: { selector: "a.channel-article", attr: "href" },
    publishedAt: ".time, .date, time",
    summary: ".summary",
    rawId: { selector: "a.channel-article", attr: "href" },
  })),
};

export const wlxydlxwzFetchTargets: FetchTarget[] = targetSpecs.map((target) => ({
  id: target.requestId,
  url: `${baseUrl}${target.path}`,
  channel: target.channel,
}));

export const wlxydlxwzParser = createConfiguredHtmlListParser(parserConfig);
