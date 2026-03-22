// @vitest-environment jsdom

import { describe, expect, it } from "vitest";

import type { RawPage } from "@bnuz-feed/contracts";

import { bjsfdxzxxyFetchTargets, bjsfdxzxxyParser } from "./bjsfdxzxxy";

function createPage(
  overrides: Partial<RawPage> & Pick<RawPage, "requestId" | "requestUrl" | "finalUrl" | "bodyText">,
): RawPage {
  return {
    sourceId: "d0e8c9b742a9498ebeb52f76523f9771",
    fetchedAt: "2026-03-21T00:00:00.000Z",
    ...overrides,
  };
}

describe("bjsfdxzxxyParser", () => {
  it("declares the expected public targets", () => {
    expect(bjsfdxzxxyFetchTargets).toEqual([
      { id: "xwkx", url: "https://zhixing.bnuzh.edu.cn/xwkx/index.htm", channel: "新闻快讯" },
      { id: "tzgg", url: "https://zhixing.bnuzh.edu.cn/xsyd/tzgg/index.htm", channel: "通知公告" },
      { id: "stzz", url: "https://zhixing.bnuzh.edu.cn/xsyd/stzz/index.htm", channel: "组织团体" },
      { id: "zyfz", url: "https://zhixing.bnuzh.edu.cn/xsyd/zyfz/index.htm", channel: "生涯发展" },
      { id: "zxxw", url: "https://zhixing.bnuzh.edu.cn/xsyd/zxxw/index.htm", channel: "知心小屋" },
      { id: "sdsf", url: "https://zhixing.bnuzh.edu.cn/djgh/sdsf/index.htm", channel: "师德师风" },
      { id: "zxjt", url: "https://zhixing.bnuzh.edu.cn/zxsy/zxjt/index.htm", channel: "知行讲坛" },
      { id: "zxdh", url: "https://zhixing.bnuzh.edu.cn/zxsy/zxdh/index.htm", channel: "知行导航" },
      { id: "zxyx", url: "https://zhixing.bnuzh.edu.cn/zxsy/zxyx/index.htm", channel: "知行研习" },
      { id: "zxsl", url: "https://zhixing.bnuzh.edu.cn/zxsy/zxsl/index.htm", channel: "知行沙龙" },
      { id: "zxhy", url: "https://zhixing.bnuzh.edu.cn/zxsy/zxhy/index.htm", channel: "知行合一" },
      { id: "zxwq", url: "https://zhixing.bnuzh.edu.cn/zxsy/zxwq/index.htm", channel: "知行湾区" },
      { id: "gzzd", url: "https://zhixing.bnuzh.edu.cn/bszn/gzzd/index.htm", channel: "规章制度" },
      { id: "bslc", url: "https://zhixing.bnuzh.edu.cn/bszn/bslc/index.htm", channel: "办事流程" },
      { id: "xyfc", url: "https://zhixing.bnuzh.edu.cn/xyzj/xyfc/index.htm", channel: "校友风采" },
      { id: "XWBD", url: "https://zhixing.bnuzh.edu.cn/mtzx/XWBD/index.htm", channel: "校外报道" },
      { id: "xsfc", url: "https://zhixing.bnuzh.edu.cn/xsyd/xsfc/index.htm", channel: "学生风采" },
      { id: "zbfc", url: "https://zhixing.bnuzh.edu.cn/djgh/zbfc/index.htm", channel: "支部风采" },
      { id: "zthd", url: "https://zhixing.bnuzh.edu.cn/djgh/zthd/index.htm", channel: "专题活动" },
      { id: "xwtj", url: "https://zhixing.bnuzh.edu.cn/xwtj/index.htm", channel: "新闻推荐" },
    ]);
  });

  it("parses standard article lists with stable relative links", async () => {
    const page = createPage({
      requestId: "tzgg",
      requestUrl: "https://zhixing.bnuzh.edu.cn/xsyd/tzgg/index.htm",
      finalUrl: "https://zhixing.bnuzh.edu.cn/xsyd/tzgg/index.htm",
      bodyText: `
        <main>
          <ul class="common-article-list">
            <li>
              <a class="article" href="64a62a3776ee458e84c6008ccc4af313.htm">
                <div>关于申报知行书院2024年度大学生创新创业训练计划项目的通知</div>
                <div class="time">2024-10-25</div>
              </a>
            </li>
            <li>
              <a class="article" href="f43d4ed6f50849bb915da97f10dadcc0.htm">
                <div>关于开展知行书院2024年第一期“校地合作赋能社区治理”社会调研活动的通知</div>
                <div class="time">2024-06-21</div>
              </a>
            </li>
          </ul>
        </main>
      `,
    });

    const records = await bjsfdxzxxyParser.parse(page);

    expect(records).toEqual([
      {
        sourceId: "d0e8c9b742a9498ebeb52f76523f9771",
        rawId: "64a62a3776ee458e84c6008ccc4af313.htm",
        rawTitle: "关于申报知行书院2024年度大学生创新创业训练计划项目的通知",
        rawUrl: "https://zhixing.bnuzh.edu.cn/xsyd/tzgg/64a62a3776ee458e84c6008ccc4af313.htm",
        rawPublishedAt: "2024-10-25",
        rawChannel: "通知公告",
        rawSummary: undefined,
        extras: {
          requestId: "tzgg",
        },
      },
      {
        sourceId: "d0e8c9b742a9498ebeb52f76523f9771",
        rawId: "f43d4ed6f50849bb915da97f10dadcc0.htm",
        rawTitle: "关于开展知行书院2024年第一期“校地合作赋能社区治理”社会调研活动的通知",
        rawUrl: "https://zhixing.bnuzh.edu.cn/xsyd/tzgg/f43d4ed6f50849bb915da97f10dadcc0.htm",
        rawPublishedAt: "2024-06-21",
        rawChannel: "通知公告",
        rawSummary: undefined,
        extras: {
          requestId: "tzgg",
        },
      },
    ]);
  });

  it("parses photo-card lists with split calendar dates and summaries", async () => {
    const page = createPage({
      requestId: "xwtj",
      requestUrl: "https://zhixing.bnuzh.edu.cn/xwtj/index.htm",
      finalUrl: "https://zhixing.bnuzh.edu.cn/xwtj/index.htm",
      bodyText: `
        <main>
          <div class="common-pic-article">
            <a class="article gap-3" href="../djgh/zthd/40679b141fd5414abfd144ca3c0e0494.htm">
              <div class="calendar d-none d-lg-flex">
                <div class="date">05/</div>
                <div class="year-month">
                  <div class="month">3月</div>
                  <div class="year">2026</div>
                </div>
              </div>
              <img class="cover" src="../images/2026-03/demo.jpg" alt="">
              <div class="content gap-3">
                <div class="title">凝聚思想共识 共话时代责任：知行书院组织师生收看全国两会开幕会</div>
                <div class="summary">3月4日、5日，全国两会在北京隆重开幕。知行书院组织师生通过13个党支部、团支部分会场收听收看两会实况。</div>
                <button class="btn btn-primary">查看详情</button>
              </div>
            </a>
          </div>
        </main>
      `,
    });

    const records = await bjsfdxzxxyParser.parse(page);

    expect(records).toEqual([
      {
        sourceId: "d0e8c9b742a9498ebeb52f76523f9771",
        rawId: "../djgh/zthd/40679b141fd5414abfd144ca3c0e0494.htm",
        rawTitle: "凝聚思想共识 共话时代责任：知行书院组织师生收看全国两会开幕会",
        rawUrl: "https://zhixing.bnuzh.edu.cn/djgh/zthd/40679b141fd5414abfd144ca3c0e0494.htm",
        rawPublishedAt: "2026-03-05",
        rawChannel: "新闻推荐",
        rawSummary: "3月4日、5日，全国两会在北京隆重开幕。知行书院组织师生通过13个党支部、团支部分会场收听收看两会实况。",
        extras: {
          requestId: "xwtj",
        },
      },
    ]);
  });

  it("keeps external media links intact for 校外报道", async () => {
    const page = createPage({
      requestId: "XWBD",
      requestUrl: "https://zhixing.bnuzh.edu.cn/mtzx/XWBD/index.htm",
      finalUrl: "https://zhixing.bnuzh.edu.cn/mtzx/XWBD/index.htm",
      bodyText: `
        <main>
          <ul class="common-article-list">
            <li>
              <a class="article" href="https://pub-static.hizh.cn/s/202509/19/AP68cd33d4e4b082260c2cedaf.html?memberId=">
                <div>【观海融媒】导览参观＋手作体验！北师大学子助力居民探寻城市记忆</div>
                <div class="time">2025-09-23</div>
              </a>
            </li>
          </ul>
        </main>
      `,
    });

    const records = await bjsfdxzxxyParser.parse(page);

    expect(records).toEqual([
      {
        sourceId: "d0e8c9b742a9498ebeb52f76523f9771",
        rawId: "https://pub-static.hizh.cn/s/202509/19/AP68cd33d4e4b082260c2cedaf.html?memberId=",
        rawTitle: "【观海融媒】导览参观＋手作体验！北师大学子助力居民探寻城市记忆",
        rawUrl: "https://pub-static.hizh.cn/s/202509/19/AP68cd33d4e4b082260c2cedaf.html?memberId=",
        rawPublishedAt: "2025-09-23",
        rawChannel: "校外报道",
        rawSummary: undefined,
        extras: {
          requestId: "XWBD",
        },
      },
    ]);
  });
});
