import { type FetchTarget } from "@bnuz-feed/contracts";

export type TargetSpec = {
  requestId: string;
  url: string;
  channel: string;
};

export const baseUrl = "https://sczx.bnuzh.edu.cn";

export const targetSpecs: TargetSpec[] = [
  { requestId: "tzgg/index", url: `${baseUrl}/tzgg/index.htm`, channel: "通知公告" },
  { requestId: "tzgg/index1", url: `${baseUrl}/tzgg/index1.htm`, channel: "通知公告" },
  { requestId: "tzgg/index2", url: `${baseUrl}/tzgg/index2.htm`, channel: "通知公告" },
  { requestId: "zhxw/index", url: `${baseUrl}/zhxw/index.blk.htm`, channel: "综合新闻" },
  { requestId: "zhxw/index1", url: `${baseUrl}/zhxw/index1.blk.htm`, channel: "综合新闻" },
  { requestId: "jsxm/index", url: `${baseUrl}/sjcx/jsxm/index.htm`, channel: "竞赛项目" },
  { requestId: "jsxm/index1", url: `${baseUrl}/sjcx/jsxm/index1.htm`, channel: "竞赛项目" },
  { requestId: "jsxm/index2", url: `${baseUrl}/sjcx/jsxm/index2.htm`, channel: "竞赛项目" },
  { requestId: "aqzd/index", url: `${baseUrl}/sysaq/aqzd/index.htm`, channel: "安全制度" },
  { requestId: "zbgz/index", url: `${baseUrl}/dqjs/zbgz/index.htm`, channel: "支部工作" },
  { requestId: "cgzs/home", url: `${baseUrl}/`, channel: "实践教学成果" },
];

export const jwbsyysjcxjyzxwzFetchTargets: FetchTarget[] = targetSpecs.map((target) => ({
  id: target.requestId,
  url: target.url,
  channel: target.channel,
}));
