// @vitest-environment jsdom

import { describe, expect, it } from "vitest";

import type { RawPage } from "@bnuz-feed/contracts";

import { jwbsyysjcxjyzxwzFetchTargets, jwbsyysjcxjyzxwzParser } from "./jwbsyysjcxjyzxwz";

function createPage(
  overrides: Partial<RawPage> & Pick<RawPage, "requestId" | "requestUrl" | "finalUrl" | "bodyText">,
): RawPage {
  return {
    sourceId: "c252f4c7e0324913b6defd418af12cbd",
    fetchedAt: "2026-03-21T00:00:00.000Z",
    ...overrides,
  };
}

describe("jwbsyysjcxjyzxwz", () => {
  it("declares the confirmed public sources", () => {
    expect(jwbsyysjcxjyzxwzFetchTargets).toEqual([
      { id: "tzgg/index", url: "https://sczx.bnuzh.edu.cn/tzgg/index.htm", channel: "通知公告" },
      { id: "tzgg/index1", url: "https://sczx.bnuzh.edu.cn/tzgg/index1.htm", channel: "通知公告" },
      { id: "tzgg/index2", url: "https://sczx.bnuzh.edu.cn/tzgg/index2.htm", channel: "通知公告" },
      { id: "zhxw/index", url: "https://sczx.bnuzh.edu.cn/zhxw/index.blk.htm", channel: "综合新闻" },
      { id: "zhxw/index1", url: "https://sczx.bnuzh.edu.cn/zhxw/index1.blk.htm", channel: "综合新闻" },
      { id: "jsxm/index", url: "https://sczx.bnuzh.edu.cn/sjcx/jsxm/index.htm", channel: "竞赛项目" },
      { id: "jsxm/index1", url: "https://sczx.bnuzh.edu.cn/sjcx/jsxm/index1.htm", channel: "竞赛项目" },
      { id: "jsxm/index2", url: "https://sczx.bnuzh.edu.cn/sjcx/jsxm/index2.htm", channel: "竞赛项目" },
      { id: "aqzd/index", url: "https://sczx.bnuzh.edu.cn/sysaq/aqzd/index.htm", channel: "安全制度" },
      { id: "zbgz/index", url: "https://sczx.bnuzh.edu.cn/dqjs/zbgz/index.htm", channel: "支部工作" },
      { id: "cgzs/home", url: "https://sczx.bnuzh.edu.cn/", channel: "实践教学成果" },
    ]);
  });

  it("parses通知公告 and filters internal preview links", async () => {
    const page = createPage({
      requestId: "tzgg/index",
      requestUrl: "https://sczx.bnuzh.edu.cn/tzgg/index.htm",
      finalUrl: "https://sczx.bnuzh.edu.cn/tzgg/index.htm",
      bodyText: `
        <main>
          <div class="apparcon">
            <ul class="partyUl partyUl2">
              <li>
                <a href="5ede4023ec0f4e7ba92a8bb0e4f92714.htm">
                  <span class="date gp-fr">2025-12-08</span>
                  <p class="gp-f16 gp-ellipsis">2026年睿抗机器人竞赛招募</p>
                </a>
              </li>
              <li>
                <a href="http://172.31.1.26/cms/publish/preview/article/f80b9f4bb6f0467db30b27d72b0db8f0">
                  <span class="date gp-fr">2024-02-19</span>
                  <p class="gp-f16 gp-ellipsis">关于2023级本科生修读《大学生劳动教育》课程的通知</p>
                </a>
              </li>
            </ul>
          </div>
        </main>
      `,
    });

    await expect(jwbsyysjcxjyzxwzParser.parse(page)).resolves.toEqual([
      {
        sourceId: "c252f4c7e0324913b6defd418af12cbd",
        rawId: "5ede4023ec0f4e7ba92a8bb0e4f92714.htm",
        rawTitle: "2026年睿抗机器人竞赛招募",
        rawUrl: "https://sczx.bnuzh.edu.cn/tzgg/5ede4023ec0f4e7ba92a8bb0e4f92714.htm",
        rawPublishedAt: "2025-12-08",
        rawChannel: "通知公告",
        rawSummary: undefined,
        extras: {
          requestId: "tzgg/index",
        },
      },
    ]);
  });

  it("parses综合新闻 with split date tokens and summaries", async () => {
    const page = createPage({
      requestId: "zhxw/index",
      requestUrl: "https://sczx.bnuzh.edu.cn/zhxw/index.blk.htm",
      finalUrl: "https://sczx.bnuzh.edu.cn/zhxw/index.blk.htm",
      bodyText: `
        <main>
          <div class="apparcon">
            <ul class="centernews">
              <li class="on">
                <a href="https://jwb.bnuzh.edu.cn/sjjx/xkjs/45885cb9298a40228e37129e4a98b6a1.htm">
                  <div class="newr">
                    <h2 class="gp-f20 gp-ellipsis">北京师范大学珠海校区学生参加第九届全国高等师范院校大学生化学实验邀请赛荣获佳绩</h2>
                    <p class="gp-f16">稿件摘要。</p>
                  </div>
                  <div class="date2">
                    <p class="gp-f24 gp-white">05</p>
                    <p class="gp-f16 gp-white">2025-09</p>
                  </div>
                </a>
              </li>
            </ul>
          </div>
        </main>
      `,
    });

    await expect(jwbsyysjcxjyzxwzParser.parse(page)).resolves.toEqual([
      {
        sourceId: "c252f4c7e0324913b6defd418af12cbd",
        rawId: "https://jwb.bnuzh.edu.cn/sjjx/xkjs/45885cb9298a40228e37129e4a98b6a1.htm",
        rawTitle: "北京师范大学珠海校区学生参加第九届全国高等师范院校大学生化学实验邀请赛荣获佳绩",
        rawUrl: "https://jwb.bnuzh.edu.cn/sjjx/xkjs/45885cb9298a40228e37129e4a98b6a1.htm",
        rawPublishedAt: "2025-09-05",
        rawChannel: "综合新闻",
        rawSummary: "稿件摘要。",
        extras: {
          requestId: "zhxw/index",
        },
      },
    ]);
  });

  it("parses竞赛项目 and excludes the internal login target", async () => {
    const page = createPage({
      requestId: "jsxm/index",
      requestUrl: "https://sczx.bnuzh.edu.cn/sjcx/jsxm/index.htm",
      finalUrl: "https://sczx.bnuzh.edu.cn/sjcx/jsxm/index.htm",
      bodyText: `
        <main>
          <aside class="gp-subLeft gp-f16 gp-xs-3 gp-fl effect effect41 isView">
            <ul>
              <li class="active"><a class="gp-f18" href="index.htm">竞赛项目</a></li>
              <li><a class="gp-f18" href="../kcxm/index.htm">科创项目</a></li>
              <li><a class="gp-f18" href="../jstd/index.htm">竞赛团队</a></li>
            </ul>
          </aside>
          <ul class="centerTeachers competition gp-avg-lg-4 gp-avg-md-4 gp-avg-sm-3 gp-avg-xs-3 gp-avg-xxs-2">
            <li>
              <a href="https://jwb.bnuzh.edu.cn/sjjx/xkjs/12c57e63d1c84ec18cb86361958cadbd.htm">
                <p class="gp-f16">北师大珠海校区学子在2023“外研社·国才杯”“理解当代中国”全国大学生外语能力大赛广东省省赛勇夺五金晋级国赛</p>
              </a>
            </li>
            <li>
              <a href="http://172.31.1.26/cms/login">
                <p class="gp-f16">喜报：北师大珠海校区学子在2023年全国大学生英语竞赛广东赛区决赛中荣获佳绩！</p>
              </a>
            </li>
          </ul>
        </main>
      `,
    });

    await expect(jwbsyysjcxjyzxwzParser.parse(page)).resolves.toEqual([
      {
        sourceId: "c252f4c7e0324913b6defd418af12cbd",
        rawId: "https://jwb.bnuzh.edu.cn/sjjx/xkjs/12c57e63d1c84ec18cb86361958cadbd.htm",
        rawTitle: "北师大珠海校区学子在2023“外研社·国才杯”“理解当代中国”全国大学生外语能力大赛广东省省赛勇夺五金晋级国赛",
        rawUrl: "https://jwb.bnuzh.edu.cn/sjjx/xkjs/12c57e63d1c84ec18cb86361958cadbd.htm",
        rawPublishedAt: undefined,
        rawChannel: "竞赛项目",
        rawSummary: undefined,
        extras: {
          requestId: "jsxm/index",
        },
      },
    ]);
  });

  it("parses安全制度, 支部工作 and the homepage achievements carousel", async () => {
    const aqzdPage = createPage({
      requestId: "aqzd/index",
      requestUrl: "https://sczx.bnuzh.edu.cn/sysaq/aqzd/index.htm",
      finalUrl: "https://sczx.bnuzh.edu.cn/sysaq/aqzd/index.htm",
      bodyText: `
        <main>
          <ul class="partyUl">
            <li>
              <a href="8afa7da1084e4517a80f5209ad749e55.htm">
                <span class="date gp-fr">2025-06-13</span>
                <p class="gp-f16 gp-ellipsis">实验教学平台实验室开放管理规定（试行）</p>
              </a>
            </li>
          </ul>
        </main>
      `,
    });

    const zbgzPage = createPage({
      requestId: "zbgz/index",
      requestUrl: "https://sczx.bnuzh.edu.cn/dqjs/zbgz/index.htm",
      finalUrl: "https://sczx.bnuzh.edu.cn/dqjs/zbgz/index.htm",
      bodyText: `
        <main>
          <ul class="partyUl">
            <li>
              <a href="edfc770c2861434ebe0ebe959abb2dda.htm">
                <span class="date gp-fr">2026-01-08</span>
                <p class="gp-f16 gp-ellipsis">20251225-实验教学平台党支部持续深入学习贯彻党的二十届四中全会精神</p>
              </a>
            </li>
          </ul>
        </main>
      `,
    });

    const cgzsPage = createPage({
      requestId: "cgzs/home",
      requestUrl: "https://sczx.bnuzh.edu.cn/",
      finalUrl: "https://sczx.bnuzh.edu.cn/",
      bodyText: `
        <main>
          <div class="mode3Ul">
            <ul class="slider-for slick-initialized slick-slider">
              <li class="slick-slide slick-cloned" data-slick-index="-1" aria-hidden="true">
                <a href="cgzs/145ae2ca25d44dcc9313ce01a1a76a4d.htm">
                  <div class="mode3r">
                    <h2 class="gp-f20 gp-ellipsis">第十四届蓝桥杯全国软件和信息技术专业人才大赛广东赛区一等奖</h2>
                    <p class="gp-f16"></p>
                  </div>
                </a>
              </li>
              <li class="slick-slide slick-current slick-active" data-slick-index="0">
                <a href="cgzs/4f8ff6c42a3443ba8393f6e6d9090a34.htm">
                  <div class="mode3r">
                    <h2 class="gp-f20 gp-ellipsis">美国大学生数学建模竞赛特等奖、一等奖</h2>
                    <p class="gp-f16"></p>
                  </div>
                </a>
              </li>
              <li class="slick-slide" data-slick-index="1">
                <a href="cgzs/68baf8331e5f44e98801224fc3488f06.htm">
                  <div class="mode3r">
                    <h2 class="gp-f20 gp-ellipsis">第十四届全国大学生数学竞赛 国赛一等奖</h2>
                    <p class="gp-f16"></p>
                  </div>
                </a>
              </li>
            </ul>
          </div>
        </main>
      `,
    });

    await expect(jwbsyysjcxjyzxwzParser.parse(aqzdPage)).resolves.toEqual([
      {
        sourceId: "c252f4c7e0324913b6defd418af12cbd",
        rawId: "8afa7da1084e4517a80f5209ad749e55.htm",
        rawTitle: "实验教学平台实验室开放管理规定（试行）",
        rawUrl: "https://sczx.bnuzh.edu.cn/sysaq/aqzd/8afa7da1084e4517a80f5209ad749e55.htm",
        rawPublishedAt: "2025-06-13",
        rawChannel: "安全制度",
        rawSummary: undefined,
        extras: {
          requestId: "aqzd/index",
        },
      },
    ]);

    await expect(jwbsyysjcxjyzxwzParser.parse(zbgzPage)).resolves.toEqual([
      {
        sourceId: "c252f4c7e0324913b6defd418af12cbd",
        rawId: "edfc770c2861434ebe0ebe959abb2dda.htm",
        rawTitle: "20251225-实验教学平台党支部持续深入学习贯彻党的二十届四中全会精神",
        rawUrl: "https://sczx.bnuzh.edu.cn/dqjs/zbgz/edfc770c2861434ebe0ebe959abb2dda.htm",
        rawPublishedAt: "2026-01-08",
        rawChannel: "支部工作",
        rawSummary: undefined,
        extras: {
          requestId: "zbgz/index",
        },
      },
    ]);

    await expect(jwbsyysjcxjyzxwzParser.parse(cgzsPage)).resolves.toEqual([
      {
        sourceId: "c252f4c7e0324913b6defd418af12cbd",
        rawId: "cgzs/4f8ff6c42a3443ba8393f6e6d9090a34.htm",
        rawTitle: "美国大学生数学建模竞赛特等奖、一等奖",
        rawUrl: "https://sczx.bnuzh.edu.cn/cgzs/4f8ff6c42a3443ba8393f6e6d9090a34.htm",
        rawPublishedAt: undefined,
        rawChannel: "实践教学成果",
        rawSummary: undefined,
        extras: {
          requestId: "cgzs/home",
        },
      },
      {
        sourceId: "c252f4c7e0324913b6defd418af12cbd",
        rawId: "cgzs/68baf8331e5f44e98801224fc3488f06.htm",
        rawTitle: "第十四届全国大学生数学竞赛 国赛一等奖",
        rawUrl: "https://sczx.bnuzh.edu.cn/cgzs/68baf8331e5f44e98801224fc3488f06.htm",
        rawPublishedAt: undefined,
        rawChannel: "实践教学成果",
        rawSummary: undefined,
        extras: {
          requestId: "cgzs/home",
        },
      },
    ]);
  });
});
