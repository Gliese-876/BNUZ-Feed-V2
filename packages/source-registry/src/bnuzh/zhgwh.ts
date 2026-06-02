import type { FetchTarget } from "@bnuz-feed/contracts";

import { createConfiguredHtmlListParser } from "../parsers/configuredHtmlListParser";

export const zhgwhFetchTargets: FetchTarget[] = [
  {
    id: "zhzn",
    url: "https://zhb.bnu.edu.cn/zhzn/index.htm",
    channel: "综合指南",
  },
];

export const zhgwhParser = createConfiguredHtmlListParser({
  parserKey: "bnuzh/zhgwh",
  targets: [
    {
      requestId: "zhzn",
      itemSelector: ".listconrl > li",
      channel: "综合指南",
      title: ".listconrla",
      url: { selector: ".listconrla", attr: "href" },
      publishedAt: ".news-dates",
      rawId: { selector: ".listconrla", attr: "href" },
      limit: 20,
    },
  ],
});
