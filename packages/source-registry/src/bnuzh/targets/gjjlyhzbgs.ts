import { type FetchTarget } from "@bnuz-feed/contracts";

export type TargetSpec = {
  requestId: string;
  path: string;
  channel: string;
  pages?: number;
  kind: "dated" | "issue" | "plain";
  itemSelector?: string;
};

export const baseUrl = "https://io.bnuzh.edu.cn/";

export const targetSpecs: TargetSpec[] = [
  { requestId: "xwsd", path: "xwsd/index.htm", channel: "新闻速递", pages: 5, kind: "dated" },
  { requestId: "xxgg", path: "xxgg/index.htm", channel: "信息公告", pages: 5, kind: "dated" },
  { requestId: "Newsletter", path: "Newsletter/index.htm", channel: "BNU Zhuhai Newsletter", kind: "issue" },
  { requestId: "gzdt", path: "ztbd/gzdt/index.htm", channel: "工作动态", kind: "dated" },
  {
    requestId: "bjsfdxzhxqgjwhj",
    path: "ztbd/bjsfdxzhxqgjwhj/index.htm",
    channel: "北京师范大学珠海校区国际文化节",
    kind: "dated",
  },
  { requestId: "zxzg", path: "ztbd/zxzg/index.htm", channel: "知行中国", kind: "dated" },
  { requestId: "gjxzxskdwq", path: "ztbd/gjxzxskdwq/index.htm", channel: "国际学者学生看大湾区", kind: "dated" },
  { requestId: "jsxsqqsyj", path: "ztbd/jsxsqqsyj/index.htm", channel: "京师学生全球视野节", kind: "dated" },
  {
    requestId: "gzzgsghxnyjysyydsclsh",
    path: "ztbd/gzzgsghxnyjysyydsclsh/index.htm",
    channel: "感知中国 山谷回响 南有佳音 双语云端诗词朗诵会",
    kind: "dated",
  },
  { requestId: "yfksj", path: "ztbd/yfksj/index.htm", channel: "扬帆看世界", kind: "dated" },
  { requestId: "zxtz", path: "jsfw/ywrs/zxtz/index.htm", channel: "最新通知", kind: "dated" },
  {
    requestId: "gjhy/zxtzgjhy",
    path: "gjhy/zxtzgjhy/index.htm",
    channel: "国际会议/最新通知",
    kind: "plain",
    itemSelector: "p > a[href]",
  },
  { requestId: "YESxm", path: "jsfw/xmsb/YESxm/index.htm", channel: "YES项目", kind: "dated" },
];

export function createFetchTargets(): FetchTarget[] {
  return targetSpecs.flatMap((target) => {
    const pages = target.pages ?? 1;

    return Array.from({ length: pages }, (_, pageIndex) => {
      const id = pageIndex === 0 ? target.requestId : `${target.requestId}/index${pageIndex}`;
      const path = pageIndex === 0 ? target.path : target.path.replace("index.htm", `index${pageIndex}.htm`);

      return {
        id,
        url: `${baseUrl}${path}`,
        channel: target.channel,
      } satisfies FetchTarget;
    });
  });
}

export const gjjlyhzbgsFetchTargets: FetchTarget[] = createFetchTargets();
