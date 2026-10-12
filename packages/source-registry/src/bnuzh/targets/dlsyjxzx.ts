import { type FetchTarget } from "@bnuz-feed/contracts";

export const baseUrl = "https://sczx.bnuzh.edu.cn/dlsyjxzx/";

export const dlsyjxzxFetchTargets: FetchTarget[] = [
  {
    id: "xwzx",
    url: `${baseUrl}xwzx/index.htm`,
    channel: "新闻中心",
  },
  {
    id: "sjhd",
    url: `${baseUrl}sjhd/index.htm`,
    channel: "实践活动",
  },
  {
    id: "xsqy",
    url: `${baseUrl}xsqy/index.htm`,
    channel: "学术前沿",
  },
  {
    id: "kpzl",
    url: `${baseUrl}kpzl/index.htm`,
    channel: "科普专栏",
  },
  {
    id: "cgzs",
    url: `${baseUrl}index.htm`,
    channel: "成果展示",
  },
  {
    id: "xkjs",
    url: `${baseUrl}sjcx/xkjs/index.htm`,
    channel: "学科竞赛",
  },
  {
    id: "cxcy",
    url: `${baseUrl}sjcx/cxcy/index.htm`,
    channel: "创新创业",
  },
];
