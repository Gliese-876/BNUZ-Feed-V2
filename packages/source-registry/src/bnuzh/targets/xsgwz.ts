import { type FetchTarget } from "@bnuz-feed/contracts";

export type TargetConfig = {
  requestId: string;
  channel: string;
};

export const baseUrl = "https://xiaoshi.bnuzh.edu.cn";

export const xsgwzTargets: TargetConfig[] = [
  { requestId: "xwdt", channel: "新闻动态" },
  { requestId: "tzgg", channel: "通知公告" },
  { requestId: "xsyj1", channel: "师大校史" },
  { requestId: "sdrw", channel: "师大人物" },
  { requestId: "slxz", channel: "史料选载" },
  { requestId: "sdjs", channel: "师大纪事" },
  { requestId: "lstp", channel: "历史图片" },
  { requestId: "zjgg", channel: "征集公告" },
  { requestId: "zpcl", channel: "展品陈列" },
  { requestId: "ztzl", channel: "专题展览" },
];

export const xsgwzFetchTargetUrls: Record<TargetConfig["requestId"], string> = {
  xwdt: `${baseUrl}/gzdt/xwdt/index.htm`,
  tzgg: `${baseUrl}/gzdt/tzgg/index.htm`,
  xsyj1: `${baseUrl}/xsyj/xsyj1/index.htm`,
  sdrw: `${baseUrl}/xsyj/sdrw/index.htm`,
  slxz: `${baseUrl}/xsyj/slxz/index.htm`,
  sdjs: `${baseUrl}/xsyj/sdjs/index.htm`,
  lstp: `${baseUrl}/yxjy/lstp/index.htm`,
  zjgg: `${baseUrl}/zpzj/zjgg/index.htm`,
  zpcl: `${baseUrl}/zpzj/zpcl/index.htm`,
  ztzl: `${baseUrl}/bnxsg/ztzl/index.htm`,
};

export const xsgwzFetchTargets: FetchTarget[] = xsgwzTargets.flatMap((target) => {
  const url = xsgwzFetchTargetUrls[target.requestId];

  if (!url) {
    return [];
  }

  return [
    {
      id: target.requestId,
      url,
      channel: target.channel,
    },
  ];
});
