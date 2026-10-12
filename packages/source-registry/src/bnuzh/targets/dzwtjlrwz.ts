import { type FetchTarget } from "@bnuz-feed/contracts";

export type TargetSpec = {
  requestId: string;
  url: string;
  channel: string;
  kind: "news" | "catalog";
};

export const baseUrl = "https://ihap.bnuzh.edu.cn";

export const targetSpecs: TargetSpec[] = [
  {
    requestId: "zxdt",
    url: `${baseUrl}/zxdt/index.htm`,
    channel: "\u6700\u65b0\u52a8\u6001",
    kind: "news",
  },
  {
    requestId: "dwtj",
    url: `${baseUrl}/kpjy/dwtj/index.htm`,
    channel: "\u52a8\u7269\u56fe\u9274",
    kind: "catalog",
  },
  {
    requestId: "zwtj",
    url: `${baseUrl}/kpjy/zwtj/index.htm`,
    channel: "\u690d\u7269\u56fe\u9274",
    kind: "catalog",
  },
  {
    requestId: "dtfb/lyl",
    url: `${baseUrl}/dtfb/lyl/index.htm`,
    channel: "\u4e50\u80b2\u697c",
    kind: "catalog",
  },
  {
    requestId: "dtfb/hhy",
    url: `${baseUrl}/dtfb/hhy/index.htm`,
    channel: "\u6d77\u534e\u82d1",
    kind: "catalog",
  },
  {
    requestId: "dtfb/hwl",
    url: `${baseUrl}/dtfb/hwl/index.htm`,
    channel: "\u5f18\u6587\u697c",
    kind: "catalog",
  },
  {
    requestId: "dtfb/tsg",
    url: `${baseUrl}/dtfb/tsg/index.htm`,
    channel: "\u56fe\u4e66\u9986",
    kind: "catalog",
  },
  {
    requestId: "dtfb/yhy2",
    url: `${baseUrl}/dtfb/yhy2/index.htm`,
    channel: "\u7ca4\u534e\u82d1",
    kind: "catalog",
  },
];

export const dzwtjlrwzFetchTargets: FetchTarget[] = targetSpecs.map((target) => ({
  id: target.requestId,
  url: target.url,
  channel: target.channel,
}));
