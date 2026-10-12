import { type FetchTarget } from "@bnuz-feed/contracts";

export type SiteTarget = {
  requestId: string;
  url: string;
  channel: string;
};

export const baseUrl = "https://zhixing-old.bnuzh.edu.cn/";

export const newsCardTargets: SiteTarget[] = [
  { requestId: "xwkx", url: `${baseUrl}xwkx/index.htm`, channel: "新闻快讯" },
];

export const standardTargets: SiteTarget[] = [
  { requestId: "tzgg", url: `${baseUrl}xsyd/tzgg/index.htm`, channel: "通知公告" },
  { requestId: "stzz", url: `${baseUrl}xsyd/stzz/index.htm`, channel: "组织团体" },
  { requestId: "zyfz", url: `${baseUrl}xsyd/zyfz/index.htm`, channel: "生涯发展" },
  { requestId: "zxxw", url: `${baseUrl}xsyd/zxxw/index.htm`, channel: "知心小屋" },
  { requestId: "sdsf", url: `${baseUrl}djgh/sdsf/index.htm`, channel: "师德师风" },
  { requestId: "zxjt", url: `${baseUrl}zxsy/zxjt/index.htm`, channel: "知行讲坛" },
  { requestId: "zxdh", url: `${baseUrl}zxsy/zxdh/index.htm`, channel: "知行导航" },
  { requestId: "zxyx", url: `${baseUrl}zxsy/zxyx/index.htm`, channel: "知行研习" },
  { requestId: "zxsl", url: `${baseUrl}zxsy/zxsl/index.htm`, channel: "知行沙龙" },
  { requestId: "zxhy", url: `${baseUrl}zxsy/zxhy/index.htm`, channel: "知行合一" },
  { requestId: "zxwq", url: `${baseUrl}zxsy/zxwq/index.htm`, channel: "知行湾区" },
  { requestId: "gzzd", url: `${baseUrl}bszn/gzzd/index.htm`, channel: "规章制度" },
  { requestId: "bslc", url: `${baseUrl}bszn/bslc/index.htm`, channel: "办事流程" },
  { requestId: "xyfc", url: `${baseUrl}xyzj/xyfc/index.htm`, channel: "校友风采" },
  { requestId: "XWBD", url: `${baseUrl}mtzx/XWBD/index.htm`, channel: "校外报道" },
];

export const photoTargets: SiteTarget[] = [
  { requestId: "xsfc", url: `${baseUrl}xsyd/xsfc/index.htm`, channel: "学生风采" },
  { requestId: "zbfc", url: `${baseUrl}djgh/zbfc/index.htm`, channel: "支部风采" },
  { requestId: "zthd", url: `${baseUrl}djgh/zthd/index.htm`, channel: "专题活动" },
  { requestId: "xwtj", url: `${baseUrl}xwtj/index.htm`, channel: "新闻推荐" },
];

export const bjsfdxzxxyFetchTargets: FetchTarget[] = [
  ...newsCardTargets,
  ...standardTargets,
  ...photoTargets,
].map((target) => ({
  id: target.requestId,
  url: target.url,
  channel: target.channel,
}));
