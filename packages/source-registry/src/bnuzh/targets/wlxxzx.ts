import { type FetchTarget } from "@bnuz-feed/contracts";

export type TargetSpec = {
  requestId: string;
  path: string;
  channel: string;
};

export const baseUrl = "https://nic.bnuzh.edu.cn";

export const targetSpecs: TargetSpec[] = [
  { requestId: "tzgg", path: "tzgg/index.htm", channel: "通知公告" },
  { requestId: "tzgg/index1", path: "tzgg/index1.htm", channel: "通知公告" },
  { requestId: "gzzd", path: "gzzd/index.htm", channel: "规章制度" },
  { requestId: "ldgg", path: "aqzl/ldgg/index.htm", channel: "漏洞公告" },
  { requestId: "jsfwzn", path: "bzzn/jsfwzn/index.htm", channel: "教师服务指南" },
  { requestId: "jsfwzn/index1", path: "bzzn/jsfwzn/index1.htm", channel: "教师服务指南" },
  { requestId: "xsfwzn", path: "bzzn/xsfwzn/index.htm", channel: "学生服务指南" },
  { requestId: "xsfwzn/index1", path: "bzzn/xsfwzn/index1.htm", channel: "学生服务指南" },
];

export const wlxxzxFetchTargets: FetchTarget[] = targetSpecs.map((target) => ({
  id: target.requestId,
  url: `${baseUrl}/${target.path}`,
  channel: target.channel,
}));
