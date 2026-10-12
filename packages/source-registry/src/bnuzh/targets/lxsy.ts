import { type FetchTarget } from "@bnuz-feed/contracts";

export interface LxsyTargetSpec {
  requestId: string;
  url: string;
  channel: string;
  pathPrefix: string;
}

export const baseUrl = "https://lixing.bnuzh.edu.cn/";

export const targetSpecs: LxsyTargetSpec[] = [
  {
    requestId: "xwdt",
    url: `${baseUrl}xwdt/index1.htm`,
    channel: "新闻动态",
    pathPrefix: "/xwdt/",
  },
  {
    requestId: "tzgg",
    url: `${baseUrl}tzgg/index.htm`,
    channel: "通知公告",
    pathPrefix: "/tzgg/",
  },
  {
    requestId: "hdyg",
    url: `${baseUrl}hdyg/index.htm`,
    channel: "活动预告",
    pathPrefix: "/hdyg/",
  },
  {
    requestId: "lxgy",
    url: `${baseUrl}lxgy/index.htm`,
    channel: "砺行光影",
    pathPrefix: "/lxgy/",
  },
  {
    requestId: "xssw/btjs",
    url: `${baseUrl}xssw/btjs/index.htm`,
    channel: "班团建设",
    pathPrefix: "/xssw/btjs/",
  },
  {
    requestId: "xssw/xsdj",
    url: `${baseUrl}xssw/xsdj/index.htm`,
    channel: "学生党建",
    pathPrefix: "/xssw/xsdj/",
  },
  {
    requestId: "xssw/txfc",
    url: `${baseUrl}xssw/txfc/index.htm`,
    channel: "团学风采",
    pathPrefix: "/xssw/txfc/",
  },
  {
    requestId: "xssw/xssq",
    url: `${baseUrl}xssw/xssq/index.htm`,
    channel: "学生社群",
    pathPrefix: "/xssw/xssq/",
  },
  {
    requestId: "xssw/xyfz",
    url: `${baseUrl}xssw/xyfz/index.htm`,
    channel: "学业发展",
    pathPrefix: "/xssw/xyfz/",
  },
  {
    requestId: "xssw/xsjz",
    url: `${baseUrl}xssw/xsjz/index.htm`,
    channel: "学生奖助",
    pathPrefix: "/xssw/xsjz/",
  },
  {
    requestId: "xssw/gfjy",
    url: `${baseUrl}xssw/gfjy/index.htm`,
    channel: "国防教育",
    pathPrefix: "/xssw/gfjy/",
  },
  {
    requestId: "xssw/xkfw",
    url: `${baseUrl}xssw/xkfw/index.htm`,
    channel: "心康服务",
    pathPrefix: "/xssw/xkfw/",
  },
  {
    requestId: "xssw/sjjl",
    url: `${baseUrl}xssw/sjjl/index.htm`,
    channel: "实践交流",
    pathPrefix: "/xssw/sjjl/",
  },
  {
    requestId: "xssw/jyfw",
    url: `${baseUrl}xssw/jyfw/index.htm`,
    channel: "就业服务",
    pathPrefix: "/xssw/jyfw/",
  },
  {
    requestId: "syfw/gzzd",
    url: `${baseUrl}syfw/gzzd/index.htm`,
    channel: "规章制度",
    pathPrefix: "/syfw/gzzd/",
  },
  {
    requestId: "syfw/bszn",
    url: `${baseUrl}syfw/bszn/index.htm`,
    channel: "办事指南",
    pathPrefix: "/syfw/bszn/",
  },
  {
    requestId: "syfw/cyxz",
    url: `${baseUrl}syfw/cyxz/index.htm`,
    channel: "常用下载",
    pathPrefix: "/syfw/cyxz/",
  },
];

export const lxsyFetchTargets: FetchTarget[] = targetSpecs.map((target) => ({
  id: target.requestId,
  url: target.url,
  channel: target.channel,
}));
