import { type FetchTarget } from "@bnuz-feed/contracts";

export type TargetSpec = {
  requestId: string;
  path: string;
  channel: string;
};

export const baseUrl = "https://dangan.bnuzh.edu.cn";

export const targetSpecs: TargetSpec[] = [
  { requestId: "gzdt/xwdt", path: "gzdt/xwdt/index.htm", channel: "工作动态/新闻动态" },
  { requestId: "gzdt/tzgg", path: "gzdt/tzgg/index.htm", channel: "工作动态/通知公告" },
  { requestId: "fgzd/flfg", path: "fgzd/flfg/index.htm", channel: "法规制度/法律法规" },
  { requestId: "fgzd/bzgf", path: "fgzd/bzgf/index.htm", channel: "法规制度/标准规范" },
  { requestId: "fgzd/gzzd", path: "fgzd/gzzd/index.htm", channel: "法规制度/规章制度" },
  { requestId: "bszn/cdzn", path: "bszn/cdzn/index.htm", channel: "办事指南/综合档案" },
  { requestId: "bszn/gdzn", path: "bszn/gdzn/index.htm", channel: "办事指南/学生档案" },
  { requestId: "bszn/gdzn/xqxsda", path: "bszn/gdzn/xqxsda/index.htm", channel: "办事指南/学生档案" },
  { requestId: "bszn/cjwt", path: "bszn/cjwt/index.htm", channel: "办事指南/常见问题" },
  { requestId: "xgxz/zfly", path: "xgxz/zfly/index.htm", channel: "相关下载/综合档案" },
  { requestId: "xgxz/zfle", path: "xgxz/zfle/index.htm", channel: "相关下载/学生档案" },
];

export const dagwzFetchTargets: FetchTarget[] = targetSpecs.map((target) => ({
  id: target.requestId,
  url: `${baseUrl}/${target.path}`,
  channel: target.channel,
}));
