import type { FetchTarget } from "@bnuz-feed/contracts";

const channels = [
  ["xwdt", "新闻动态"],
  ["tzgg/xntz", "通知公告/校内通知"],
  ["tzgg/gsgg", "通知公告/公示公告"],
  ["gzzd/sysaqgl", "规章制度/实验室安全管理"],
  ["gzzd/yqsbgl", "规章制度/仪器设备管理"],
  ["gzzd/zcfg", "规章制度/政策法规"],
  ["bszn/yqsbgl", "办事指南/仪器设备管理"],
  ["zltj/sysaqy", "专栏特辑/实验室安全月"],
  ["zltj/dyzj/zzsh", "专栏特辑/党员之家/组织生活"],
  ["hdxx", "活动信息"],
  ["gzrl", "工作日历"],
] as const;

export const bjsfdxzhxqsysaqysbglbgsFetchTargets: FetchTarget[] = channels.map(([path, channel]) => ({
  id: path,
  url: `https://ssb.bnuzh.edu.cn/${path}/index.htm`,
  channel,
}));
