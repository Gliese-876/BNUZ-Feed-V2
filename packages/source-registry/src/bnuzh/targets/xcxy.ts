import { type FetchTarget } from "@bnuz-feed/contracts";

export type TargetSpec = {
  requestId: string;
  path: string;
  channel: string;
};

export const baseUrl = "https://tcc.bnuzh.edu.cn";

export const targetSpecs: TargetSpec[] = [
  { requestId: "xwdt/index", path: "xwdt/index.htm", channel: "新闻动态" },
  { requestId: "xwdt/index1", path: "xwdt/index1.htm", channel: "新闻动态" },
  { requestId: "xwdt/index2", path: "xwdt/index2.htm", channel: "新闻动态" },
  { requestId: "xwdt/index3", path: "xwdt/index3.htm", channel: "新闻动态" },
  { requestId: "xydt/index", path: "xyll/xydt/index.htm", channel: "校友动态" },
];

export const xcxyFetchTargets: FetchTarget[] = targetSpecs.map((target) => ({
  id: target.requestId,
  url: `${baseUrl}/${target.path}`,
  channel: target.channel,
}));
