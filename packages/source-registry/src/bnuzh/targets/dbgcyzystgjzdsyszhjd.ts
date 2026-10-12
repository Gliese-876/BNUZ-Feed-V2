import { type FetchTarget } from "@bnuz-feed/contracts";

export type TargetSpec = {
  requestId: string;
  path: string;
  channel: string;
};

export const baseUrl = "https://espre.bnuzh.edu.cn";

export const targetSpecs: TargetSpec[] = [
  { requestId: "xwzx/index", path: "xwzx/index.htm", channel: "新闻中心" },
  { requestId: "kyltz/index", path: "dtxx/tzzx/kyltz/index.htm", channel: "科研类通知" },
  { requestId: "xzltz/index", path: "dtxx/tzzx/xzltz/index.htm", channel: "行政类通知" },
  { requestId: "xshd/index", path: "dtxx/xshd/index.htm", channel: "学术活动" },
  { requestId: "snyjjz/index", path: "dtxx/kyjz/snyjjz/index.htm", channel: "室内研究进展" },
  { requestId: "xkdt/index", path: "dtxx/kyjz/xkdt/index.htm", channel: "学科动态" },
  { requestId: "kyjyjl/index", path: "dtxx/kyjz/kyjyjl/index.htm", channel: "科研经验交流" },
  { requestId: "gjhz/index", path: "hzjl/gjhz/index.htm", channel: "国际合作（访学、公派）" },
  { requestId: "hybg/index", path: "hzjl/hybg/index.htm", channel: "会议报告" },
  { requestId: "hdfc/index", path: "hdfc/index.htm", channel: "活动风采" },
  { requestId: "hdfc/index1", path: "hdfc/index1.htm", channel: "活动风采" },
];

export const dbgcyzystgjzdsyszhjdFetchTargets: FetchTarget[] = targetSpecs.map((target) => ({
  id: target.requestId,
  url: `${baseUrl}/${target.path}`,
  channel: target.channel,
}));
