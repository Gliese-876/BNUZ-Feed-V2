// @vitest-environment jsdom

import { describe, expect, it } from "vitest";

import type { RawPage } from "@bnuz-feed/contracts";

import { fhsyFetchTargets, fhsyParser } from "./fhsy";

function createPage(
  overrides: Partial<RawPage> & Pick<RawPage, "requestId" | "requestUrl" | "finalUrl" | "bodyText">,
): RawPage {
  return {
    sourceId: "7de05bfb07b44620b482d189a2d7cc44",
    fetchedAt: "2026-03-21T00:00:00.000Z",
    ...overrides,
  };
}

describe("fhsy parser", () => {
  it("declares the confirmed Phoenix College message sources", () => {
    expect(fhsyFetchTargets).toEqual([
      { id: "syxw", url: "https://phs.bnuzh.edu.cn/xwdt/syxw/index.htm", channel: "书院新闻" },
      { id: "syxw/index1", url: "https://phs.bnuzh.edu.cn/xwdt/syxw/index1.htm", channel: "书院新闻" },
      { id: "tzhhd", url: "https://phs.bnuzh.edu.cn/tzhhd/index.htm", channel: "通知和活动" },
      { id: "tzhhd/index1", url: "https://phs.bnuzh.edu.cn/tzhhd/index1.htm", channel: "通知和活动" },
      { id: "mtbd", url: "https://phs.bnuzh.edu.cn/xwdt/mtbd/index.htm", channel: "媒体报道" },
      { id: "fhslt", url: "https://phs.bnuzh.edu.cn/syhd/fhslt/index.htm", channel: "京师凤凰论坛" },
      { id: "fhdjt", url: "https://phs.bnuzh.edu.cn/syhd/fhdjt/index.htm", channel: "凤凰讲堂" },
      { id: "xshd", url: "https://phs.bnuzh.edu.cn/zszsy/xshd/index.htm", channel: "学生活动" },
      { id: "zxdt", url: "https://phs.bnuzh.edu.cn/zx/ygawhyjyjlzx/zxdt/index.htm", channel: "中心动态" },
      { id: "jsjh", url: "https://phs.bnuzh.edu.cn/zx/ygawhyjyjlzx/jsjh/index.htm", channel: "菁师计划" },
      {
        id: "ygawhyjyjlhd",
        url: "https://phs.bnuzh.edu.cn/zx/ygawhyjyjlzx/ygawhyjyjlhd/index.htm",
        channel: "粤港澳文化与教育交流活动",
      },
      { id: "xmhpx", url: "https://phs.bnuzh.edu.cn/zx/ygawhyjyjlzx/xmhpx/index.htm", channel: "项目和培训" },
      { id: "fhyyc", url: "https://phs.bnuzh.edu.cn/gjjy/fhyyc/index.htm", channel: "凤凰语言村" },
      { id: "fhyyc/index1", url: "https://phs.bnuzh.edu.cn/gjjy/fhyyc/index1.htm", channel: "凤凰语言村" },
    ]);
  });

  it("parses book news entries, normalizes relative URLs and ignores pagination links", async () => {
    const page = createPage({
      requestId: "syxw",
      requestUrl: "https://phs.bnuzh.edu.cn/xwdt/syxw/index.htm",
      finalUrl: "https://phs.bnuzh.edu.cn/xwdt/syxw/index.htm",
      bodyText: `
        <body>
          <div class="gp-subRight">
            <ul>
              <li>
                <a href="4fd5aac7b1c5471698701bc05fa5fa57.htm">
                  <h3>凤凰书院非洲女性领导力项目学生李爱博受邀参加第十五届中国国际电池工业博览会（IB...</h3>
                  <p>凤凰书院非洲女性领导力项目学生李爱博受邀参加第十五届中国国际电池工业博览会。</p>
                  <span class="date">2025-11-26</span>
                </a>
              </li>
              <li>
                <a href="https://mp.weixin.qq.com/s/6d8MhTqz7uvRihGGw9weTw">
                  <h3>北京师范大学珠海校区凤凰书院2025级国际新生报到工作圆满完成</h3>
                  <p>秋高气爽，丹桂飘香。</p>
                  <span class="date">2025-09-16</span>
                </a>
              </li>
              <li>
                <a href="index1.htm">2</a>
              </li>
            </ul>
          </div>
        </body>
      `,
    });

    await expect(fhsyParser.parse(page)).resolves.toEqual([
      {
        sourceId: "7de05bfb07b44620b482d189a2d7cc44",
        rawId: "4fd5aac7b1c5471698701bc05fa5fa57.htm",
        rawTitle: "凤凰书院非洲女性领导力项目学生李爱博受邀参加第十五届中国国际电池工业博览会（IB...",
        rawUrl: "https://phs.bnuzh.edu.cn/xwdt/syxw/4fd5aac7b1c5471698701bc05fa5fa57.htm",
        rawPublishedAt: "2025-11-26",
        rawChannel: "书院新闻",
        rawSummary: "凤凰书院非洲女性领导力项目学生李爱博受邀参加第十五届中国国际电池工业博览会。",
        extras: {
          requestId: "syxw",
        },
      },
      {
        sourceId: "7de05bfb07b44620b482d189a2d7cc44",
        rawId: "https://mp.weixin.qq.com/s/6d8MhTqz7uvRihGGw9weTw",
        rawTitle: "北京师范大学珠海校区凤凰书院2025级国际新生报到工作圆满完成",
        rawUrl: "https://mp.weixin.qq.com/s/6d8MhTqz7uvRihGGw9weTw",
        rawPublishedAt: "2025-09-16",
        rawChannel: "书院新闻",
        rawSummary: "秋高气爽，丹桂飘香。",
        extras: {
          requestId: "syxw",
        },
      },
    ]);
  });

  it("parses center-side list pages with summaries and mixed internal/external links", async () => {
    const page = createPage({
      requestId: "zxdt",
      requestUrl: "https://phs.bnuzh.edu.cn/zx/ygawhyjyjlzx/zxdt/index.htm",
      finalUrl: "https://phs.bnuzh.edu.cn/zx/ygawhyjyjlzx/zxdt/index.htm",
      bodyText: `
        <body>
          <div class="gp-subRight">
            <ul>
              <li>
                <a href="https://mp.weixin.qq.com/s/_4CsoKOsgwebTh3pl61UJw">
                  <h3>澳门教育及青年发展局代表团访问北京师范大学珠海校区</h3>
                  <p>11月28日，由澳门教育及青年发展局教育资源厅厅长邓伟强率队的澳门教育及青年发展...</p>
                  <span class="date">2024-12-18</span>
                </a>
              </li>
              <li>
                <a href="df477929007644e482c92caa8f7f5242.htm">
                  <h3>香港优才及专才协会来校访问交流</h3>
                  <p>4月29日，香港优才及专才协会主席、香港政治经济学院执行院长骆勇等一行三人来校访...</p>
                  <span class="date">2022-04-30</span>
                </a>
              </li>
              <li>
                <a href="index1.htm">2</a>
              </li>
            </ul>
          </div>
        </body>
      `,
    });

    await expect(fhsyParser.parse(page)).resolves.toEqual([
      {
        sourceId: "7de05bfb07b44620b482d189a2d7cc44",
        rawId: "https://mp.weixin.qq.com/s/_4CsoKOsgwebTh3pl61UJw",
        rawTitle: "澳门教育及青年发展局代表团访问北京师范大学珠海校区",
        rawUrl: "https://mp.weixin.qq.com/s/_4CsoKOsgwebTh3pl61UJw",
        rawPublishedAt: "2024-12-18",
        rawChannel: "中心动态",
        rawSummary: "11月28日，由澳门教育及青年发展局教育资源厅厅长邓伟强率队的澳门教育及青年发展...",
        extras: {
          requestId: "zxdt",
        },
      },
      {
        sourceId: "7de05bfb07b44620b482d189a2d7cc44",
        rawId: "df477929007644e482c92caa8f7f5242.htm",
        rawTitle: "香港优才及专才协会来校访问交流",
        rawUrl: "https://phs.bnuzh.edu.cn/zx/ygawhyjyjlzx/zxdt/df477929007644e482c92caa8f7f5242.htm",
        rawPublishedAt: "2022-04-30",
        rawChannel: "中心动态",
        rawSummary: "4月29日，香港优才及专才协会主席、香港政治经济学院执行院长骆勇等一行三人来校访...",
        extras: {
          requestId: "zxdt",
        },
      },
    ]);
  });

  it("parses language-village activity entries and normalizes dotted dates", async () => {
    const page = createPage({
      requestId: "fhyyc",
      requestUrl: "https://phs.bnuzh.edu.cn/gjjy/fhyyc/index.htm",
      finalUrl: "https://phs.bnuzh.edu.cn/gjjy/fhyyc/index.htm",
      bodyText: `
        <body>
          <div class="gp-subRight">
            <ul>
              <li>
                <a href="https://mp.weixin.qq.com/s/RSHFmGd-dvkEk4vv_Mo3kQ">
                  <h3>“悠悠葡”系列活动之探索澳门（2）“碰撞的味道”</h3>
                  <p>11月29日，凤凰语言村葡语村举办了“悠悠葡”系列活动。</p>
                  <span class="date">2024.12.06</span>
                </a>
              </li>
              <li>
                <a href="../fhyyc/2d2e66d6a56147ce888d1043d1ea4619.htm">
                  <h3>“世界读书日”系列活动：英国侦探小说的阅读与演绎</h3>
                  <p>4月23日，凤凰语言村举办活动。</p>
                  <span class="date">2022.04.25</span>
                </a>
              </li>
              <li>
                <a href="index1.htm">2</a>
              </li>
            </ul>
          </div>
        </body>
      `,
    });

    await expect(fhsyParser.parse(page)).resolves.toEqual([
      {
        sourceId: "7de05bfb07b44620b482d189a2d7cc44",
        rawId: "https://mp.weixin.qq.com/s/RSHFmGd-dvkEk4vv_Mo3kQ",
        rawTitle: "“悠悠葡”系列活动之探索澳门（2）“碰撞的味道”",
        rawUrl: "https://mp.weixin.qq.com/s/RSHFmGd-dvkEk4vv_Mo3kQ",
        rawPublishedAt: "2024-12-06",
        rawChannel: "凤凰语言村",
        rawSummary: "11月29日，凤凰语言村葡语村举办了“悠悠葡”系列活动。",
        extras: {
          requestId: "fhyyc",
        },
      },
      {
        sourceId: "7de05bfb07b44620b482d189a2d7cc44",
        rawId: "../fhyyc/2d2e66d6a56147ce888d1043d1ea4619.htm",
        rawTitle: "“世界读书日”系列活动：英国侦探小说的阅读与演绎",
        rawUrl: "https://phs.bnuzh.edu.cn/gjjy/fhyyc/2d2e66d6a56147ce888d1043d1ea4619.htm",
        rawPublishedAt: "2022-04-25",
        rawChannel: "凤凰语言村",
        rawSummary: "4月23日，凤凰语言村举办活动。",
        extras: {
          requestId: "fhyyc",
        },
      },
    ]);
  });
});
