import { type FetchTarget } from "@bnuz-feed/contracts";

export type TargetSpec = {
  requestId: string;
  path: string;
  channel: string;
};

export const baseUrl = "https://welcome.bnuzh.edu.cn/";

export const targetSpecs: TargetSpec[] = [
  { requestId: "yxkx/index", path: "yxkx/index.htm", channel: "迎新快讯" },
  { requestId: "yxzy/index", path: "yxzy/index.htm", channel: "迎新指引" },
  { requestId: "xzbsd/index", path: "xzbsd/index.htm", channel: "学在北师大" },
  { requestId: "zzbsd/index", path: "zzbsd/index.htm", channel: "住在北师大" },
];

export const yxwFetchTargets: FetchTarget[] = targetSpecs.map((target) => ({
  id: target.requestId,
  url: `${baseUrl}${target.path}`,
  channel: target.channel,
}));
