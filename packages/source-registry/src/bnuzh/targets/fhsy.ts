import { type FetchTarget } from "@bnuz-feed/contracts";

export type TargetSpec = {
  requestId: string;
  path: string;
  channel: string;
  pages?: number;
};

export const baseUrl = "https://phs.bnuzh.edu.cn/";

export const targetSpecs: TargetSpec[] = [
  { requestId: "syxw", path: "xwdt/syxw/index.htm", channel: "书院新闻", pages: 2 },
  { requestId: "tzhhd", path: "tzhhd/index.htm", channel: "通知和活动", pages: 2 },
  { requestId: "mtbd", path: "xwdt/mtbd/index.htm", channel: "媒体报道" },
  { requestId: "fhslt", path: "syhd/fhslt/index.htm", channel: "京师凤凰论坛" },
  { requestId: "fhdjt", path: "syhd/fhdjt/index.htm", channel: "凤凰讲堂" },
  { requestId: "xshd", path: "zszsy/xshd/index.htm", channel: "学生活动" },
  { requestId: "zxdt", path: "zx/ygawhyjyjlzx/zxdt/index.htm", channel: "中心动态" },
  { requestId: "jsjh", path: "zx/ygawhyjyjlzx/jsjh/index.htm", channel: "菁师计划" },
  { requestId: "ygawhyjyjlhd", path: "zx/ygawhyjyjlzx/ygawhyjyjlhd/index.htm", channel: "粤港澳文化与教育交流活动" },
  { requestId: "xmhpx", path: "zx/ygawhyjyjlzx/xmhpx/index.htm", channel: "项目和培训" },
  { requestId: "fhyyc", path: "gjjy/fhyyc/index.htm", channel: "凤凰语言村", pages: 2 },
];

export function createFetchTargets(): FetchTarget[] {
  return targetSpecs.flatMap((spec) => {
    const pages = spec.pages ?? 1;

    return Array.from({ length: pages }, (_, pageIndex) => {
      const requestId = pageIndex === 0 ? spec.requestId : `${spec.requestId}/index${pageIndex}`;
      const url = pageIndex === 0 ? spec.path : spec.path.replace(/index\.htm$/, `index${pageIndex}.htm`);

      return {
        id: requestId,
        url: `${baseUrl}${url}`,
        channel: spec.channel,
      } satisfies FetchTarget;
    });
  });
}

export const fhsyFetchTargets: FetchTarget[] = createFetchTargets();
