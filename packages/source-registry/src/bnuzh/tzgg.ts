import type { FetchTarget } from "@bnuz-feed/contracts";

import { createConfiguredHtmlListParser } from "../parsers/configuredHtmlListParser";

export const tzggFetchTargets: FetchTarget[] = [
  {
    id: "sdyp",
    url: "https://notice.bnuzh.edu.cn/sdyp/index.htm",
    channel: "师大云盘",
  },
];

export const tzggParser = createConfiguredHtmlListParser({
  parserKey: "bnuzh/tzgg",
  targets: [
    {
      requestId: "sdyp",
      itemSelector: ".common-article-list > li",
      channel: "师大云盘",
      title: ".title",
      url: { selector: "a", attr: "href" },
      publishedAt: ".time",
      limit: 20,
    },
  ],
});
