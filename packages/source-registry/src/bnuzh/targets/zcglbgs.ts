import { type FetchTarget } from "@bnuz-feed/contracts";

export type TargetSpec = {
  requestId: string;
  path: string;
  channel: string;
};

export const baseUrl = "https://oam.bnuzh.edu.cn";

export const targetSpecs: TargetSpec[] = [
  { requestId: "xwdt", path: "xwgg/xwdt/index.htm", channel: "新闻动态" },
  { requestId: "tzgg", path: "xwgg/tzgg/index.htm", channel: "通知公告" },
  { requestId: "gjflfg", path: "zcfg/gdzcgl/gjflfg/index.htm", channel: "国家法律法规" },
  { requestId: "bwgzzd", path: "zcfg/gdzcgl/bwgzzd/index.htm", channel: "部委规章制度" },
  { requestId: "xxgzzd", path: "zcfg/gdzcgl/xxgzzd/index.htm", channel: "学校规章制度" },
  { requestId: "zbgz", path: "dqjs/zbgz/index.htm", channel: "支部工作" },
  { requestId: "ghhd", path: "dqjs/ghhd/index.htm", channel: "工会活动" },
  { requestId: "xzzq", path: "xzzq/index.htm", channel: "下载专区" },
];

export const zcglbgsFetchTargets: FetchTarget[] = targetSpecs.map((target) => ({
  id: target.requestId,
  url: `${baseUrl}/${target.path}`,
  channel: target.channel,
}));
