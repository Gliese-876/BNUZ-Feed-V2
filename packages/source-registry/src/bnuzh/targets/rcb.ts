import { type FetchTarget } from "@bnuz-feed/contracts";

export type TargetSpec = {
  requestId: string;
  path: string;
  channel: string;
  pages?: number;
};

export const baseUrl = "https://hr.bnuzh.edu.cn/";

export const targetSpecs: TargetSpec[] = [
  { requestId: "tzgg", path: "tzgg/index.htm", channel: "通知公告", pages: 3 },
  { requestId: "gzdt", path: "gzdt/index.htm", channel: "工作动态" },
  { requestId: "bshgz", path: "bshgz/index.htm", channel: "博士后工作" },
  { requestId: "zcwj", path: "zcwj/index.htm", channel: "政策文件" },
  { requestId: "xzzq", path: "xzzq/index.htm", channel: "下载专区" },
  { requestId: "bdrz", path: "fwzn/bdrz/index.htm", channel: "报到入职" },
  { requestId: "rszm", path: "fwzn/rszm/index.htm", channel: "社保公积金" },
  { requestId: "rssx", path: "fwzn/rssx/index.htm", channel: "党组织关系" },
  { requestId: "pxjx2", path: "fwzn/pxjx2/index.htm", channel: "户政业务" },
  { requestId: "kyqdf", path: "fwzn/kyqdf/index.htm", channel: "科研启动费" },
  { requestId: "rssx1", path: "fwzn/rssx1/index.htm", channel: "人事手续" },
];

export function createFetchTargets(): FetchTarget[] {
  return targetSpecs.flatMap((spec) =>
    Array.from({ length: spec.pages ?? 1 }, (_, pageIndex) => {
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

export const rcbFetchTargets: FetchTarget[] = createFetchTargets();
