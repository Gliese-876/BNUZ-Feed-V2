// @vitest-environment jsdom

import { describe, expect, it } from "vitest";

import type { RawPage } from "@bnuz-feed/contracts";

import { zcglbgsFetchTargets, zcglbgsParser } from "./zcglbgs";

function createPage(
  overrides: Partial<RawPage> & Pick<RawPage, "requestId" | "requestUrl" | "finalUrl" | "bodyText">,
): RawPage {
  return {
    sourceId: "70981c669ee748c4ba5dcd4022a42f58",
    fetchedAt: "2026-03-21T00:00:00.000Z",
    ...overrides,
  };
}

describe("zcglbgsParser", () => {
  it("declares the confirmed public message sources and excludes empty directories", () => {
    expect(zcglbgsFetchTargets).toEqual([
      { id: "xwdt", url: "https://oam.bnuzh.edu.cn/xwgg/xwdt/index.htm", channel: "新闻动态" },
      { id: "tzgg", url: "https://oam.bnuzh.edu.cn/xwgg/tzgg/index.htm", channel: "通知公告" },
      { id: "gjflfg", url: "https://oam.bnuzh.edu.cn/zcfg/gdzcgl/gjflfg/index.htm", channel: "国家法律法规" },
      { id: "bwgzzd", url: "https://oam.bnuzh.edu.cn/zcfg/gdzcgl/bwgzzd/index.htm", channel: "部委规章制度" },
      { id: "xxgzzd", url: "https://oam.bnuzh.edu.cn/zcfg/gdzcgl/xxgzzd/index.htm", channel: "学校规章制度" },
      { id: "xyzhgl", url: "https://oam.bnuzh.edu.cn/zcfg/xyzhgl/index.htm", channel: "校园综合管理" },
      { id: "zbgz", url: "https://oam.bnuzh.edu.cn/dqjs/zbgz/index.htm", channel: "支部工作" },
      { id: "ghhd", url: "https://oam.bnuzh.edu.cn/dqjs/ghhd/index.htm", channel: "工会活动" },
      { id: "xzzq", url: "https://oam.bnuzh.edu.cn/xzzq/index.htm", channel: "下载专区" },
    ]);
  });

  it("parses the news card list with calendar dates and summaries", async () => {
    const page = createPage({
      requestId: "xwdt",
      requestUrl: "https://oam.bnuzh.edu.cn/xwgg/xwdt/index.htm",
      finalUrl: "https://oam.bnuzh.edu.cn/xwgg/xwdt/index.htm",
      bodyText: `
        <body>
          <nav>
            <a class="item" href="../tzgg/index.htm">通知公告</a>
          </nav>
          <div class="page-content">
            <ul class="news-article-list">
              <li class="mt-3 mt-lg-4">
                <a class="item" href="fc7f6e4a4c324080b009b3f002611d25.htm">
                  <div class="calendar">
                    <div class="year">2026</div>
                    <div class="day">03/17</div>
                  </div>
                  <div class="title">资产管理办公室党支部召开树立和践行正确政绩观学习教育启动会</div>
                  <div class="summary">学习教育启动会的简要说明。</div>
                </a>
              </li>
            </ul>
          </div>
        </body>
      `,
    });

    await expect(zcglbgsParser.parse(page)).resolves.toEqual([
      {
        sourceId: "70981c669ee748c4ba5dcd4022a42f58",
        rawId: "fc7f6e4a4c324080b009b3f002611d25.htm",
        rawTitle: "资产管理办公室党支部召开树立和践行正确政绩观学习教育启动会",
        rawUrl: "https://oam.bnuzh.edu.cn/xwgg/xwdt/fc7f6e4a4c324080b009b3f002611d25.htm",
        rawPublishedAt: "2026-03-17",
        rawChannel: "新闻动态",
        rawSummary: "学习教育启动会的简要说明。",
        extras: {
          requestId: "xwdt",
        },
      },
    ]);
  });

  it("parses the shared list markup used by notices and policy pages", async () => {
    const page = createPage({
      requestId: "tzgg",
      requestUrl: "https://oam.bnuzh.edu.cn/xwgg/tzgg/index.htm",
      finalUrl: "https://oam.bnuzh.edu.cn/xwgg/tzgg/index.htm",
      bodyText: `
        <body>
          <div class="page-content">
            <ul class="common-article-list">
              <li>
                <a class="item" href="../tzgg/abc123.htm">
                  <span class="title">资产管理办公室2025年寒假工作安排</span>
                  <span class="time">2025.01.17</span>
                </a>
              </li>
              <li>
                <a class="item" href="https://oam.bnuzh.edu.cn/xwgg/tzgg/def456.htm">
                  <span class="title">京师家园随机拉动式消防演练通知</span>
                  <span class="time">2024-04-02</span>
                </a>
              </li>
            </ul>
          </div>
        </body>
      `,
    });

    await expect(zcglbgsParser.parse(page)).resolves.toEqual([
      {
        sourceId: "70981c669ee748c4ba5dcd4022a42f58",
        rawId: "../tzgg/abc123.htm",
        rawTitle: "资产管理办公室2025年寒假工作安排",
        rawUrl: "https://oam.bnuzh.edu.cn/xwgg/tzgg/abc123.htm",
        rawPublishedAt: "2025-01-17",
        rawChannel: "通知公告",
        rawSummary: undefined,
        extras: {
          requestId: "tzgg",
        },
      },
      {
        sourceId: "70981c669ee748c4ba5dcd4022a42f58",
        rawId: "https://oam.bnuzh.edu.cn/xwgg/tzgg/def456.htm",
        rawTitle: "京师家园随机拉动式消防演练通知",
        rawUrl: "https://oam.bnuzh.edu.cn/xwgg/tzgg/def456.htm",
        rawPublishedAt: "2024-04-02",
        rawChannel: "通知公告",
        rawSummary: undefined,
        extras: {
          requestId: "tzgg",
        },
      },
    ]);
  });

  it("parses the event-card layout used by工会活动", async () => {
    const page = createPage({
      requestId: "ghhd",
      requestUrl: "https://oam.bnuzh.edu.cn/dqjs/ghhd/index.htm",
      finalUrl: "https://oam.bnuzh.edu.cn/dqjs/ghhd/index.htm",
      bodyText: `
        <body>
          <nav>
            <a href="index.htm">工会活动</a>
          </nav>
          <div class="page-content">
            <div class="row g-3 g-lg-5 event-list">
              <div class="col-lg-4 col-md-6">
                <a class="event p-3" href="46424bbe764d40faa6e8ad80255ba6b8.htm">
                  <div class="title">资产部门积极参加园区教职工排球赛</div>
                </a>
              </div>
              <div class="col-lg-4 col-md-6">
                <a class="event p-3" href="95ad5878347942e09fb84a39fa60f5a7.htm">
                  <div class="title">总务部获珠海园区2023年教职工“华发四季云山杯”羽毛球嘉年华活动优秀组织奖</div>
                </a>
              </div>
            </div>
          </div>
        </body>
      `,
    });

    await expect(zcglbgsParser.parse(page)).resolves.toEqual([
      {
        sourceId: "70981c669ee748c4ba5dcd4022a42f58",
        rawId: "46424bbe764d40faa6e8ad80255ba6b8.htm",
        rawTitle: "资产部门积极参加园区教职工排球赛",
        rawUrl: "https://oam.bnuzh.edu.cn/dqjs/ghhd/46424bbe764d40faa6e8ad80255ba6b8.htm",
        rawPublishedAt: undefined,
        rawChannel: "工会活动",
        rawSummary: undefined,
        extras: {
          requestId: "ghhd",
        },
      },
      {
        sourceId: "70981c669ee748c4ba5dcd4022a42f58",
        rawId: "95ad5878347942e09fb84a39fa60f5a7.htm",
        rawTitle: "总务部获珠海园区2023年教职工“华发四季云山杯”羽毛球嘉年华活动优秀组织奖",
        rawUrl: "https://oam.bnuzh.edu.cn/dqjs/ghhd/95ad5878347942e09fb84a39fa60f5a7.htm",
        rawPublishedAt: undefined,
        rawChannel: "工会活动",
        rawSummary: undefined,
        extras: {
          requestId: "ghhd",
        },
      },
    ]);
  });
});
