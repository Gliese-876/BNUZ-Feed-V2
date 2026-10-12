import { type FetchTarget } from "@bnuz-feed/contracts";

export type PageSpec = {
  requestId: string;
  channel: string;
  path: string;
  kind: "standard" | "featured";
};

export const baseUrl = "https://www.bnuzh.edu.cn";

export const pageSpecs: PageSpec[] = [
  { requestId: "xqtt", channel: "校区头条", path: "/xqtt/index.htm", kind: "standard" },
  { requestId: "zhxw", channel: "综合新闻", path: "/zhxw/index.htm", kind: "standard" },
  { requestId: "tzgs", channel: "通知公示", path: "/tzgs/index.htm", kind: "standard" },
  { requestId: "mtsd", channel: "媒体师大", path: "/mtsd/index.htm", kind: "standard" },
  { requestId: "xshd", channel: "学术活动", path: "/xshd/index.htm", kind: "featured" },
  { requestId: "xqgs", channel: "校区故事", path: "/xqgs/index.htm", kind: "standard" },
];

export function createFetchTargets(): FetchTarget[] {
  return pageSpecs.flatMap((spec) =>
    Array.from({ length: 5 }, (_, pageIndex) => {
      const requestId = pageIndex === 0 ? spec.requestId : `${spec.requestId}/index${pageIndex}`;
      const path = pageIndex === 0 ? spec.path : spec.path.replace(/index\.htm$/, `index${pageIndex}.htm`);

      return {
        id: requestId,
        url: `${baseUrl}${path}`,
        channel: spec.channel,
      } satisfies FetchTarget;
    }),
  );
}

export const bnuzFetchTargets: FetchTarget[] = createFetchTargets();
