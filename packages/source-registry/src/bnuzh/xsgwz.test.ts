// @vitest-environment jsdom

import { describe, expect, it } from "vitest";

import type { RawPage } from "@bnuz-feed/contracts";

import { xsgwzFetchTargets, xsgwzParser } from "./xsgwz";

function createPage(
  overrides: Partial<RawPage> & Pick<RawPage, "requestId" | "requestUrl" | "finalUrl" | "bodyText">,
): RawPage {
  return {
    sourceId: "d524eba4e8d744d58ce18fabec140359",
    fetchedAt: "2026-03-21T00:00:00.000Z",
    ...overrides,
  };
}

describe("xsgwz", () => {
  it("declares the confirmed public message sources", () => {
    expect(xsgwzFetchTargets).toEqual([
      { id: "xwdt", url: "https://xiaoshi.bnuzh.edu.cn/gzdt/xwdt/index.htm", channel: "新闻动态" },
      { id: "tzgg", url: "https://xiaoshi.bnuzh.edu.cn/gzdt/tzgg/index.htm", channel: "通知公告" },
      { id: "xsyj1", url: "https://xiaoshi.bnuzh.edu.cn/xsyj/xsyj1/index.htm", channel: "师大校史" },
      { id: "sdrw", url: "https://xiaoshi.bnuzh.edu.cn/xsyj/sdrw/index.htm", channel: "师大人物" },
      { id: "slxz", url: "https://xiaoshi.bnuzh.edu.cn/xsyj/slxz/index.htm", channel: "史料选载" },
      { id: "sdjs", url: "https://xiaoshi.bnuzh.edu.cn/xsyj/sdjs/index.htm", channel: "师大纪事" },
      { id: "lstp", url: "https://xiaoshi.bnuzh.edu.cn/yxjy/lstp/index.htm", channel: "历史图片" },
      { id: "zjgg", url: "https://xiaoshi.bnuzh.edu.cn/zpzj/zjgg/index.htm", channel: "征集公告" },
      { id: "zpcl", url: "https://xiaoshi.bnuzh.edu.cn/zpzj/zpcl/index.htm", channel: "展品陈列" },
      { id: "ztzl", url: "https://xiaoshi.bnuzh.edu.cn/bnxsg/ztzl/index.htm", channel: "专题展览" },
    ]);
  });

  it("parses a common article list with relative links and dates", async () => {
    const page = createPage({
      requestId: "sdrw",
      requestUrl: "https://xiaoshi.bnuzh.edu.cn/xsyj/sdrw/index.htm",
      finalUrl: "https://xiaoshi.bnuzh.edu.cn/xsyj/sdrw/index.htm",
      bodyText: `
        <main>
          <ul class="common-article-list">
            <li>
              <a href="../sdrw/5e8b5028fb4e4d1d89e762638e4b3724.htm">
                <span class="title">钟敬文建设中国民俗学派的背景与趋势</span>
              </a>
              <span class="time">2025-09-30</span>
            </li>
            <li>
              <a href="https://mp.weixin.qq.com/s/example">
                <span class="title">外部转载标题</span>
              </a>
              <span class="time">2025.09.29</span>
            </li>
          </ul>
        </main>
      `,
    });

    const records = await xsgwzParser.parse(page);

    expect(records).toEqual([
      {
        sourceId: "d524eba4e8d744d58ce18fabec140359",
        rawId: "../sdrw/5e8b5028fb4e4d1d89e762638e4b3724.htm",
        rawTitle: "钟敬文建设中国民俗学派的背景与趋势",
        rawUrl: "https://xiaoshi.bnuzh.edu.cn/xsyj/sdrw/5e8b5028fb4e4d1d89e762638e4b3724.htm",
        rawPublishedAt: "2025-09-30",
        rawChannel: "师大人物",
        rawSummary: undefined,
        extras: {
          requestId: "sdrw",
        },
      },
      {
        sourceId: "d524eba4e8d744d58ce18fabec140359",
        rawId: "https://mp.weixin.qq.com/s/example",
        rawTitle: "外部转载标题",
        rawUrl: "https://mp.weixin.qq.com/s/example",
        rawPublishedAt: "2025-09-29",
        rawChannel: "师大人物",
        rawSummary: undefined,
        extras: {
          requestId: "sdrw",
        },
      },
    ]);
  });

  it("parses card-style exhibition items and keeps the configured channel", async () => {
    const page = createPage({
      requestId: "ztzl",
      requestUrl: "https://xiaoshi.bnuzh.edu.cn/bnxsg/ztzl/index.htm",
      finalUrl: "https://xiaoshi.bnuzh.edu.cn/bnxsg/ztzl/index.htm",
      bodyText: `
        <main>
          <section class="cards">
            <a class="item" href="./x1.htm">
              <span class="title">形象陈列馆</span>
              <span class="date">2025.11.04</span>
            </a>
            <a class="item" href="../x2.htm">
              <span class="title">五四运动与北京师范大学</span>
              <span class="date">2025年9月26日</span>
            </a>
          </section>
        </main>
      `,
    });

    const records = await xsgwzParser.parse(page);

    expect(records).toEqual([
      {
        sourceId: "d524eba4e8d744d58ce18fabec140359",
        rawId: "./x1.htm",
        rawTitle: "形象陈列馆",
        rawUrl: "https://xiaoshi.bnuzh.edu.cn/bnxsg/ztzl/x1.htm",
        rawPublishedAt: "2025-11-04",
        rawChannel: "专题展览",
        rawSummary: undefined,
        extras: {
          requestId: "ztzl",
        },
      },
      {
        sourceId: "d524eba4e8d744d58ce18fabec140359",
        rawId: "../x2.htm",
        rawTitle: "五四运动与北京师范大学",
        rawUrl: "https://xiaoshi.bnuzh.edu.cn/bnxsg/x2.htm",
        rawPublishedAt: "2025-09-26",
        rawChannel: "专题展览",
        rawSummary: undefined,
        extras: {
          requestId: "ztzl",
        },
      },
    ]);
  });

  it("parses history-image entries and filters footer links", async () => {
    const page = createPage({
      requestId: "lstp",
      requestUrl: "https://xiaoshi.bnuzh.edu.cn/yxjy/lstp/index.htm",
      finalUrl: "https://xiaoshi.bnuzh.edu.cn/yxjy/lstp/index.htm",
      bodyText: `
        <main>
          <ul>
            <li><a href="0f4673d4d1e049eb88fcb23d4ce831db.htm">学生学业成绩表</a></li>
            <li><a href="76f1f8117f5c484487224921c0eb8008.htm">毛主席题写校名</a></li>
            <li><a href="https://www.bnuzh.edu.cn/">北京师范大学珠海校区</a></li>
          </ul>
        </main>
      `,
    });

    const records = await xsgwzParser.parse(page);

    expect(records).toEqual([
      {
        sourceId: "d524eba4e8d744d58ce18fabec140359",
        rawId: "0f4673d4d1e049eb88fcb23d4ce831db.htm",
        rawTitle: "学生学业成绩表",
        rawUrl: "https://xiaoshi.bnuzh.edu.cn/yxjy/lstp/0f4673d4d1e049eb88fcb23d4ce831db.htm",
        rawPublishedAt: undefined,
        rawChannel: "历史图片",
        rawSummary: undefined,
        extras: {
          requestId: "lstp",
        },
      },
      {
        sourceId: "d524eba4e8d744d58ce18fabec140359",
        rawId: "76f1f8117f5c484487224921c0eb8008.htm",
        rawTitle: "毛主席题写校名",
        rawUrl: "https://xiaoshi.bnuzh.edu.cn/yxjy/lstp/76f1f8117f5c484487224921c0eb8008.htm",
        rawPublishedAt: undefined,
        rawChannel: "历史图片",
        rawSummary: undefined,
        extras: {
          requestId: "lstp",
        },
      },
    ]);
  });

  it("filters out navigation items when a page uses generic list markup", async () => {
    const page = createPage({
      requestId: "xwdt",
      requestUrl: "https://xiaoshi.bnuzh.edu.cn/gzdt/xwdt/index.htm",
      finalUrl: "https://xiaoshi.bnuzh.edu.cn/gzdt/xwdt/index.htm",
      bodyText: `
        <main>
          <ul>
            <li><a href="/about/index.htm">本馆概况</a></li>
            <li><a href="ebff51ec0f134a6c804e358f92cd68cc.htm">校史馆建设筹备组赴北京调研学习</a><span class="time">2025-10-15</span></li>
            <li><a href="8042a808429c4dcd86572ff8b5f77cc9.htm">关于“百廿京师 教育兴邦”主题展览恢复展出的通知</a><span class="time">2025-09-26</span></li>
            <li><a href="/more/index.htm">查看更多</a></li>
          </ul>
        </main>
      `,
    });

    const records = await xsgwzParser.parse(page);

    expect(records).toEqual([
      {
        sourceId: "d524eba4e8d744d58ce18fabec140359",
        rawId: "ebff51ec0f134a6c804e358f92cd68cc.htm",
        rawTitle: "校史馆建设筹备组赴北京调研学习",
        rawUrl: "https://xiaoshi.bnuzh.edu.cn/gzdt/xwdt/ebff51ec0f134a6c804e358f92cd68cc.htm",
        rawPublishedAt: "2025-10-15",
        rawChannel: "新闻动态",
        rawSummary: undefined,
        extras: {
          requestId: "xwdt",
        },
      },
      {
        sourceId: "d524eba4e8d744d58ce18fabec140359",
        rawId: "8042a808429c4dcd86572ff8b5f77cc9.htm",
        rawTitle: "关于“百廿京师 教育兴邦”主题展览恢复展出的通知",
        rawUrl: "https://xiaoshi.bnuzh.edu.cn/gzdt/xwdt/8042a808429c4dcd86572ff8b5f77cc9.htm",
        rawPublishedAt: "2025-09-26",
        rawChannel: "新闻动态",
        rawSummary: undefined,
        extras: {
          requestId: "xwdt",
        },
      },
    ]);
  });
});
