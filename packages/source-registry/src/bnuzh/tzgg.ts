export { tzggFetchTargets } from "./targets/tzgg";

import { createConfiguredHtmlListParser } from "../parsers/configuredHtmlListParser";

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
