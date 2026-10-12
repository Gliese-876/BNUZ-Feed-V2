import { type FetchTarget } from "@bnuz-feed/contracts";

export type TargetSpec = {
  requestId: string;
  path: string;
  channel: string;
  pages: number;
};

export const baseUrl = "https://youth.bnuzh.edu.cn/";

export const targetSpecs: TargetSpec[] = [
  { requestId: "xwdt", path: "xwdt/index.htm", channel: "新闻动态", pages: 5 },
  { requestId: "tzgg", path: "tzgg/index.htm", channel: "通知公告", pages: 10 },
  { requestId: "llxx", path: "llxx/index.htm", channel: "理论学习", pages: 1 },
  { requestId: "gzzd", path: "gzzd/index.htm", channel: "规章制度", pages: 1 },
  { requestId: "yxtwfc", path: "yxtwfc/index.htm", channel: "院系团委风采", pages: 1 },
  { requestId: "jchd", path: "jchd/index.htm", channel: "精彩活动", pages: 3 },
];

export function createFetchTargets(): FetchTarget[] {
  return targetSpecs.flatMap((target) =>
    Array.from({ length: target.pages }, (_, pageIndex) => {
      const id = pageIndex === 0 ? target.requestId : `${target.requestId}/index${pageIndex}`;
      const path = pageIndex === 0 ? target.path : target.path.replace("index.htm", `index${pageIndex}.htm`);

      return {
        id,
        url: `${baseUrl}${path}`,
        channel: target.channel,
      } satisfies FetchTarget;
    }),
  );
}

export const xqtwwzFetchTargets: FetchTarget[] = createFetchTargets();
