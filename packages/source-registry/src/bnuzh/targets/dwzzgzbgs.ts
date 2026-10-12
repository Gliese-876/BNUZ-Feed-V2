import { type FetchTarget } from "@bnuz-feed/contracts";

export type TargetSpec = {
  requestId: string;
  path: string;
  channel: string;
};

export const baseUrl = "https://dwzgb.bnuzh.edu.cn/";

export const targetSpecs: TargetSpec[] = [
  { requestId: "sygzdt", path: "sygzdt/index.htm", channel: "工作动态" },
  { requestId: "sytzgg", path: "sytzgg/index.htm", channel: "通知公告" },
  { requestId: "dwjs", path: "dwjs/index.htm", channel: "队伍建设" },
  { requestId: "djgz/gzdt", path: "djgz/gzdt/index.htm", channel: "工作动态" },
  { requestId: "djgz/tzgg", path: "djgz/tzgg/index.htm", channel: "通知公告" },
  { requestId: "gbgz/gbpy", path: "gbgz/gbpy/index.htm", channel: "干部培养" },
  { requestId: "gbgz/gbgl", path: "gbgz/gbgl/index.htm", channel: "干部管理" },
  { requestId: "zdwj", path: "zdwj/index.htm", channel: "制度文件" },
  { requestId: "xzzq", path: "xzzq/index.htm", channel: "下载专区" },
  { requestId: "cjwd", path: "cjwd/index.htm", channel: "常见问答" },
];

export const dwzzgzbgsFetchTargets: FetchTarget[] = targetSpecs.map((target) => ({
  id: target.requestId,
  url: `${baseUrl}${target.path}`,
  channel: target.channel,
}));
