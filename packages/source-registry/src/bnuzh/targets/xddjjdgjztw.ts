import { type FetchTarget } from "@bnuz-feed/contracts";

export type TargetSpec = {
  requestId: string;
  path: string;
  channel: string;
};

export const baseUrl = "https://djjd.bnuzh.edu.cn";

export const targetSpecs: TargetSpec[] = [
  { requestId: "zydt", path: "zydt/index.htm", channel: "\u91cd\u8981\u52a8\u6001" },
  { requestId: "twdt", path: "twdt/index.htm", channel: "\u56fe\u6587\u52a8\u6001" },
  { requestId: "gzdt", path: "gzdt/index.htm", channel: "\u5de5\u4f5c\u52a8\u6001" },
  { requestId: "tzgg", path: "tzgg/index.htm", channel: "\u901a\u77e5\u516c\u544a" },
  { requestId: "xxzl", path: "xxzl/index.htm", channel: "\u5b66\u4e60\u8d44\u6599" },
];

export const xddjjdgjztwFetchTargets: FetchTarget[] = targetSpecs.map((target) => ({
  id: target.requestId,
  url: `${baseUrl}/${target.path}`,
  channel: target.channel,
}));
