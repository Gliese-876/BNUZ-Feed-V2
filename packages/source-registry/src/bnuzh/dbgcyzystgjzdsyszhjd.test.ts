// @vitest-environment jsdom

import { describe, expect, it } from "vitest";

import type { RawPage } from "@bnuz-feed/contracts";

import { dbgcyzystgjzdsyszhjdFetchTargets, dbgcyzystgjzdsyszhjdParser } from "./dbgcyzystgjzdsyszhjd";

function createPage(
  overrides: Partial<RawPage> & Pick<RawPage, "requestId" | "requestUrl" | "finalUrl" | "bodyText">,
): RawPage {
  return {
    sourceId: "b1b34f8f364948dd870d0b08f0c7b0a2",
    fetchedAt: "2026-03-21T00:00:00.000Z",
    ...overrides,
  };
}

describe("dbgcyzystgjzdsyszhjd", () => {
  it("declares the confirmed public message sources discovered from visible and hidden category links", () => {
    expect(dbgcyzystgjzdsyszhjdFetchTargets).toEqual([
      { id: "xwzx/index", url: "https://espre.bnuzh.edu.cn/xwzx/index.htm", channel: "新闻中心" },
      { id: "kyltz/index", url: "https://espre.bnuzh.edu.cn/dtxx/tzzx/kyltz/index.htm", channel: "科研类通知" },
      { id: "xzltz/index", url: "https://espre.bnuzh.edu.cn/dtxx/tzzx/xzltz/index.htm", channel: "行政类通知" },
      { id: "xshd/index", url: "https://espre.bnuzh.edu.cn/dtxx/xshd/index.htm", channel: "学术活动" },
      { id: "snyjjz/index", url: "https://espre.bnuzh.edu.cn/dtxx/kyjz/snyjjz/index.htm", channel: "室内研究进展" },
      { id: "xkdt/index", url: "https://espre.bnuzh.edu.cn/dtxx/kyjz/xkdt/index.htm", channel: "学科动态" },
      { id: "kyjyjl/index", url: "https://espre.bnuzh.edu.cn/dtxx/kyjz/kyjyjl/index.htm", channel: "科研经验交流" },
      { id: "gjhz/index", url: "https://espre.bnuzh.edu.cn/hzjl/gjhz/index.htm", channel: "国际合作（访学、公派）" },
      { id: "hybg/index", url: "https://espre.bnuzh.edu.cn/hzjl/hybg/index.htm", channel: "会议报告" },
      { id: "hdfc/index", url: "https://espre.bnuzh.edu.cn/hdfc/index.htm", channel: "活动风采" },
      { id: "hdfc/index1", url: "https://espre.bnuzh.edu.cn/hdfc/index1.htm", channel: "活动风采" },
    ]);
  });

  it("parses the list-style pages with title attributes, relative links, and normalized dates", async () => {
    const page = createPage({
      requestId: "xwzx/index",
      requestUrl: "https://espre.bnuzh.edu.cn/xwzx/index.htm",
      finalUrl: "https://espre.bnuzh.edu.cn/xwzx/index.htm",
      bodyText: `
        <body>
          <ul class="article-list list-unstyled">
            <li class="item py-2 py-lg-3">
              <a href="e41c00082cd24708adbe046cc169f212.htm" title="北京师范大学珠海校区地理学科欢迎你！" target="_blank" class="d-flex">
                <div class="square"></div>
                <span class="title flex-grow-1 me-2">北京师范大学珠海校区地理学科欢迎你！</span>
                <span class="flex-shrink-0">2022/12/05</span>
              </a>
            </li>
          </ul>
        </body>
      `,
    });

    await expect(dbgcyzystgjzdsyszhjdParser.parse(page)).resolves.toEqual([
      {
        sourceId: "b1b34f8f364948dd870d0b08f0c7b0a2",
        rawId: "e41c00082cd24708adbe046cc169f212.htm",
        rawTitle: "北京师范大学珠海校区地理学科欢迎你！",
        rawUrl: "https://espre.bnuzh.edu.cn/xwzx/e41c00082cd24708adbe046cc169f212.htm",
        rawPublishedAt: "2022-12-05",
        rawChannel: "新闻中心",
        rawSummary: undefined,
        extras: {
          requestId: "xwzx/index",
        },
      },
    ]);
  });

  it("parses the multi-line meeting page and keeps the page-specific request id", async () => {
    const page = createPage({
      requestId: "hybg/index",
      requestUrl: "https://espre.bnuzh.edu.cn/hzjl/hybg/index.htm",
      finalUrl: "https://espre.bnuzh.edu.cn/hzjl/hybg/index.htm",
      bodyText: `
        <body>
          <ul class="article-list list-unstyled">
            <li class="item py-2 py-lg-3">
              <a href="../detail/4deffd031e1942dd97b8d0d36bce44aa.htm" title="中国地理学会树木年轮研究工作组2020年第二次会议顺利召开" target="_blank" class="d-flex">
                <div class="square"></div>
                <span class="title flex-grow-1 me-2">中国地理学会树木年轮研究工作组2020年第二次会议顺利召开</span>
                <span class="flex-shrink-0">2020/12/01</span>
              </a>
            </li>
            <li class="item py-2 py-lg-3">
              <a href="../detail/43a09bdd4e884ad2933f852e91498858.htm" class="d-flex">
                <div class="square"></div>
                <span class="title flex-grow-1 me-2">海岸带与岛礁资源·环境·健康分论坛成功举办</span>
                <span class="flex-shrink-0">2020/11/20</span>
              </a>
            </li>
          </ul>
        </body>
      `,
    });

    await expect(dbgcyzystgjzdsyszhjdParser.parse(page)).resolves.toEqual([
      {
        sourceId: "b1b34f8f364948dd870d0b08f0c7b0a2",
        rawId: "../detail/4deffd031e1942dd97b8d0d36bce44aa.htm",
        rawTitle: "中国地理学会树木年轮研究工作组2020年第二次会议顺利召开",
        rawUrl: "https://espre.bnuzh.edu.cn/hzjl/detail/4deffd031e1942dd97b8d0d36bce44aa.htm",
        rawPublishedAt: "2020-12-01",
        rawChannel: "会议报告",
        rawSummary: undefined,
        extras: {
          requestId: "hybg/index",
        },
      },
      {
        sourceId: "b1b34f8f364948dd870d0b08f0c7b0a2",
        rawId: "../detail/43a09bdd4e884ad2933f852e91498858.htm",
        rawTitle: "海岸带与岛礁资源·环境·健康分论坛成功举办",
        rawUrl: "https://espre.bnuzh.edu.cn/hzjl/detail/43a09bdd4e884ad2933f852e91498858.htm",
        rawPublishedAt: "2020-11-20",
        rawChannel: "会议报告",
        rawSummary: undefined,
        extras: {
          requestId: "hybg/index",
        },
      },
    ]);
  });
});
