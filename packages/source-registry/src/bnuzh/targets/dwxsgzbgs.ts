import { type FetchTarget } from "@bnuz-feed/contracts";

export type TargetSpec = {
  requestId: string;
  path: string;
  channel: string;
  pages: number;
};

export const baseUrl = "https://dwxgb.bnuzh.edu.cn/";

export const targetSpecs: TargetSpec[] = [
  { requestId: "xwdt", path: "xwdt/index.htm", channel: "新闻动态", pages: 10 },
  { requestId: "hdfc", path: "hdfc/index.htm", channel: "活动风采", pages: 5 },
  { requestId: "gzzd", path: "gzzd/index.htm", channel: "规章制度", pages: 1 },
  { requestId: "djsz/llxx", path: "djsz/llxx/index.htm", channel: "理论学习", pages: 1 },
  { requestId: "djsz/xsdyjypx", path: "djsz/xsdyjypx/index.htm", channel: "学生党员教育培训", pages: 1 },
  { requestId: "djsz/xsdzbjs", path: "djsz/xsdzbjs/index.htm", channel: "学生党支部建设", pages: 1 },
  { requestId: "djsz/ztjyhd", path: "djsz/ztjyhd/index.htm", channel: "专题教育活动", pages: 1 },
  { requestId: "djsz/shsj", path: "djsz/shsj/index.htm", channel: "社会实践", pages: 1 },
  { requestId: "djsz/bjjs", path: "djsz/bjjs/index.htm", channel: "班级建设", pages: 1 },
  { requestId: "jzgz/gztz", path: "jzgz/gztz/index.htm", channel: "工作通知", pages: 3 },
  { requestId: "dwjs/pxyx", path: "dwjs/pxyx/index.htm", channel: "培训研修", pages: 2 },
  { requestId: "dwjs/xsky", path: "dwjs/xsky/index.htm", channel: "学术科研", pages: 1 },
  { requestId: "dwjs/xsyzckc", path: "dwjs/xsyzckc/index.htm", channel: "“形势与政策”课程", pages: 1 },
  { requestId: "dwjs/dwfc", path: "dwjs/dwfc/index.htm", channel: "队伍风采", pages: 1 },
  { requestId: "xljk/xljkjy", path: "xljk/xljkjy/index.htm", channel: "心理健康教育", pages: 2 },
  { requestId: "xljk/xlzx", path: "xljk/xlzx/index.htm", channel: "心理咨询", pages: 1 },
  { requestId: "xljk/ttfz", path: "xljk/ttfz/index.htm", channel: "团体辅导", pages: 1 },
  { requestId: "xljk/thd", path: "xljk/thd/index.htm", channel: "特色活动", pages: 1 },
  { requestId: "xljk/pbhz", path: "xljk/pbhz/index.htm", channel: "朋辈互助", pages: 1 },
  { requestId: "xljk/wjyz", path: "xljk/wjyz/index.htm", channel: "危机援助", pages: 1 },
  { requestId: "xssq/sqdt", path: "xssq/sqdt/index.htm", channel: "社区动态", pages: 1 },
  { requestId: "xssq/ssswbl", path: "xssq/ssswbl/index.htm", channel: "宿舍事务办理", pages: 1 },
  { requestId: "xssq/sswhjs", path: "xssq/sswhjs/index.htm", channel: "宿舍文化建设", pages: 1 },
  { requestId: "yjsglfw/zxzx", path: "yjsglfw/zxzx/index.htm", channel: "最新资讯", pages: 1 },
  { requestId: "yjsglfw/jlzz", path: "yjsglfw/jlzz/index.htm", channel: "奖励资助", pages: 1 },
  { requestId: "yjsglfw/fwzn", path: "yjsglfw/fwzn/index.htm", channel: "服务指南", pages: 1 },
];

export function createRequestId(requestId: string, pageIndex: number): string {
  return pageIndex === 0 ? requestId : `${requestId}/index${pageIndex}`;
}

export function createPath(path: string, pageIndex: number): string {
  if (pageIndex === 0) {
    return path;
  }

  return path.replace(/index\.htm$/, `index${pageIndex}.htm`);
}

export function createFetchTargets(): FetchTarget[] {
  return targetSpecs.flatMap((target) =>
    Array.from({ length: target.pages }, (_, pageIndex) => ({
      id: createRequestId(target.requestId, pageIndex),
      url: `${baseUrl}${createPath(target.path, pageIndex)}`,
      channel: target.channel,
    })),
  );
}

export const dwxsgzbgsFetchTargets: FetchTarget[] = createFetchTargets();
