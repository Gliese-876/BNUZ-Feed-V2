import { type FetchTarget } from "@bnuz-feed/contracts";

export type TargetSpec = {
  requestId: string;
  path: string;
  channel: string;
  allowedHosts?: string[];
};

export const baseUrl = "https://leyu.bnuzh.edu.cn/";

export const targetSpecs: TargetSpec[] = [
  { requestId: "zhyw", path: "zhyw/index.htm", channel: "乐育要闻" },
  { requestId: "tzgg", path: "tzgg/index.htm", channel: "通知公告" },
  { requestId: "hdyg", path: "hdyg/index.htm", channel: "活动预告" },
  { requestId: "lyxs", path: "yrts/lyxs/index.htm", channel: "乐育学社" },
  { requestId: "lxxs", path: "yrts/lxxs/index.htm", channel: "凌霄学社" },
  { requestId: "dxxs", path: "yrts/dxxs/index.htm", channel: "笃行学社" },
  { requestId: "lypp", path: "yrts/lypp/lykt/index.htm", channel: "乐育课堂" },
  { requestId: "lysl", path: "yrts/lypp/lysl/index.htm", channel: "乐育沙龙" },
  { requestId: "sqjysj", path: "yrts/lypp/sqjysj/index.htm", channel: "暑期教育实践" },
  { requestId: "sjgjjt", path: "yrts/lypp/sjgjjt/index.htm", channel: "世界冠军讲坛" },
  { requestId: "msmxcjt", path: "yrts/lypp/msmxcjt/index.htm", channel: "名师名校长讲坛" },
  { requestId: "dshd", path: "dshd/index.htm", channel: "导师有约" },
  { requestId: "lygs", path: "lygs/lyfc/index.htm", channel: "乐育风采" },
  { requestId: "qgyw", path: "lygs/qgyw/index.htm", channel: "强国有我" },
  { requestId: "zbfc", path: "djyl/zbfc/index.htm", channel: "支部风采" },
  { requestId: "txfc", path: "txfc/txfc/index.htm", channel: "团学风采" },
  { requestId: "jyfw", path: "syyh/jyfw/index.htm", channel: "就业服务" },
  { requestId: "jysd", path: "syyh/jysd/index.htm", channel: "就业速递" },
  { requestId: "bszn", path: "fwzn/bszn/index.htm", channel: "办事指南" },
  { requestId: "fwgzzd", path: "fwzn/gzzd/index.htm", channel: "服务指南-规章制度", allowedHosts: ["nic.bnuzh.edu.cn"] },
  { requestId: "xyhd", path: "xyzj/xyhd/index.htm", channel: "校友活动" },
  { requestId: "xyzx", path: "xyzj/xyzx/index.htm", channel: "校友资讯" },
];

export const lysywzFetchTargets: FetchTarget[] = targetSpecs.map((target) => ({
  id: target.requestId,
  url: `${baseUrl}${target.path}`,
  channel: target.channel,
}));
