import { type FetchTarget } from "@bnuz-feed/contracts";

export const baseUrl = "https://wx.bnuzh.edu.cn/";

export const wxmhFetchTargets: FetchTarget[] = [
  {
    id: "index",
    url: baseUrl,
    channel: "微信门户",
  },
];
