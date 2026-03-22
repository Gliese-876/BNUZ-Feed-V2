// @vitest-environment jsdom

import { describe, expect, it } from "vitest";

import type { RawPage } from "@bnuz-feed/contracts";

import { dwxsgzbgsFetchTargets, dwxsgzbgsParser } from "./dwxsgzbgs";

type TargetSpec = {
  requestId: string;
  path: string;
  channel: string;
  pages: number;
};

const expectedTargetSpecs: TargetSpec[] = [
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

function expandTargets(baseUrl: string, specs: TargetSpec[]): Array<{ id: string; url: string; channel: string }> {
  return specs.flatMap((target) =>
    Array.from({ length: target.pages }, (_, pageIndex) => ({
      id: pageIndex === 0 ? target.requestId : `${target.requestId}/index${pageIndex}`,
      url: `${baseUrl}${pageIndex === 0 ? target.path : target.path.replace(/index\.htm$/, `index${pageIndex}.htm`)}`,
      channel: target.channel,
    })),
  );
}

function createPage(
  overrides: Partial<RawPage> & Pick<RawPage, "requestId" | "requestUrl" | "finalUrl" | "bodyText">,
): RawPage {
  return {
    sourceId: "e0c5a11a3fec4476b4c24202ff6820ab",
    fetchedAt: "2026-03-21T00:00:00.000Z",
    ...overrides,
  };
}

describe("dwxsgzbgs parser", () => {
  it("declares the public list targets confirmed by Playwright", () => {
    expect(dwxsgzbgsFetchTargets).toEqual(
      expandTargets("https://dwxgb.bnuzh.edu.cn/", expectedTargetSpecs),
    );
  });

  it("parses news items with relative and external links", async () => {
    const page = createPage({
      requestId: "xwdt",
      requestUrl: "https://dwxgb.bnuzh.edu.cn/xwdt/index.htm",
      finalUrl: "https://dwxgb.bnuzh.edu.cn/xwdt/index.htm",
      bodyText: `
        <ul class="article-list">
          <li class="item py-2 py-lg-3">
            <a href="b29ffde459b54ff1bed664237b0829dd.htm" title="党委学生工作办公室教学秩序规范与管理质量提升专题工作会议暨“形势与政策”备课启动会顺利召开" target="_blank" class="d-flex">
              <div class="square"></div>
              <span class="title flex-grow-1 me-2">党委学生工作办公室教学秩序规范与管理质量提升专题工作会议暨“形势与政策”备课启动会顺利召开</span>
              <span class="flex-shrink-0">2026/03/09</span>
            </a>
          </li>
          <li class="item py-2 py-lg-3">
            <a href="https://mp.weixin.qq.com/s/6rp9rTj3Gy5W780vbR59FQ" title="活力班建丨北京师范大学珠海校区召开2025-2026学年第二学期班长培训会" target="_blank" class="d-flex">
              <div class="square"></div>
              <span class="title flex-grow-1 me-2">活力班建丨北京师范大学珠海校区召开2025-2026学年第二学期班长培训会</span>
              <span class="flex-shrink-0">2026/03/17</span>
            </a>
          </li>
        </ul>
      `,
    });

    const records = await dwxsgzbgsParser.parse(page);

    expect(records).toEqual([
      {
        sourceId: "e0c5a11a3fec4476b4c24202ff6820ab",
        rawId: "b29ffde459b54ff1bed664237b0829dd.htm",
        rawTitle: "党委学生工作办公室教学秩序规范与管理质量提升专题工作会议暨“形势与政策”备课启动会顺利召开",
        rawUrl: "https://dwxgb.bnuzh.edu.cn/xwdt/b29ffde459b54ff1bed664237b0829dd.htm",
        rawPublishedAt: "2026-03-09",
        rawChannel: "新闻动态",
        rawSummary: undefined,
        extras: {
          requestId: "xwdt",
        },
      },
      {
        sourceId: "e0c5a11a3fec4476b4c24202ff6820ab",
        rawId: "https://mp.weixin.qq.com/s/6rp9rTj3Gy5W780vbR59FQ",
        rawTitle: "活力班建丨北京师范大学珠海校区召开2025-2026学年第二学期班长培训会",
        rawUrl: "https://mp.weixin.qq.com/s/6rp9rTj3Gy5W780vbR59FQ",
        rawPublishedAt: "2026-03-17",
        rawChannel: "新闻动态",
        rawSummary: undefined,
        extras: {
          requestId: "xwdt",
        },
      },
    ]);
  });

  it("parses service-guide entries without fabricating missing dates", async () => {
    const page = createPage({
      requestId: "yjsglfw/fwzn",
      requestUrl: "https://dwxgb.bnuzh.edu.cn/yjsglfw/fwzn/index.htm",
      finalUrl: "https://dwxgb.bnuzh.edu.cn/yjsglfw/fwzn/index.htm",
      bodyText: `
        <ul class="article-list">
          <li class="item py-2 py-lg-3">
            <a href="174a58d8bd894de2ad8c90955275f2cf.htm" title="常用表格" target="_blank" class="d-flex">
              <div class="square"></div>
              <span class="title flex-grow-1 me-2">常用表格</span>
            </a>
          </li>
        </ul>
      `,
    });

    const records = await dwxsgzbgsParser.parse(page);

    expect(records).toEqual([
      {
        sourceId: "e0c5a11a3fec4476b4c24202ff6820ab",
        rawId: "174a58d8bd894de2ad8c90955275f2cf.htm",
        rawTitle: "常用表格",
        rawUrl: "https://dwxgb.bnuzh.edu.cn/yjsglfw/fwzn/174a58d8bd894de2ad8c90955275f2cf.htm",
        rawPublishedAt: undefined,
        rawChannel: "服务指南",
        rawSummary: undefined,
        extras: {
          requestId: "yjsglfw/fwzn",
        },
      },
    ]);
  });
});
