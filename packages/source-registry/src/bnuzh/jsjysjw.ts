import type { FetchTarget } from "@bnuz-feed/contracts";

import { createConfiguredHtmlListParser } from "../parsers/configuredHtmlListParser";

type TargetSpec = {
  requestId: string;
  path: string;
  channel: string;
};

const baseUrl = "https://jwb.bnuzh.edu.cn/jsjysjw/";

const targetSpecs: TargetSpec[] = [
  { requestId: "sxfc", path: "sxfc/index.htm", channel: "实习风采" },
  { requestId: "sxfc/index1", path: "sxfc/index1.htm", channel: "实习风采" },
  { requestId: "sxfc/index2", path: "sxfc/index2.htm", channel: "实习风采" },
  { requestId: "sxfc/index3", path: "sxfc/index3.htm", channel: "实习风采" },
  { requestId: "sxfc/index4", path: "sxfc/index4.htm", channel: "实习风采" },
  { requestId: "sxfc/index5", path: "sxfc/index5.htm", channel: "实习风采" },
  { requestId: "yxja", path: "yxja/index.htm", channel: "优秀教案" },
  { requestId: "yxja/index1", path: "yxja/index1.htm", channel: "优秀教案" },
  { requestId: "yxbzrgzfa", path: "yxbzrgzfa/index.htm", channel: "优秀班主任工作方案" },
  { requestId: "yxkl", path: "yxkl/index.htm", channel: "优秀课例" },
];

export const jsjysjwFetchTargets: FetchTarget[] = targetSpecs.map((target) => ({
  id: target.requestId,
  url: `${baseUrl}${target.path}`,
  channel: target.channel,
}));

export const jsjysjwParser = createConfiguredHtmlListParser({
  parserKey: "bnuzh/jsjysjw",
  targets: targetSpecs.map((target) => ({
    requestId: target.requestId,
    itemSelector: "ul.block-list64 > li",
    channel: target.channel,
    title: ".gpArticleTitle",
    url: { selector: "a", attr: "href" },
    publishedAt: ".gpArticleDate",
    rawId: { selector: "a", attr: "href" },
    limit: 15,
  })),
});
