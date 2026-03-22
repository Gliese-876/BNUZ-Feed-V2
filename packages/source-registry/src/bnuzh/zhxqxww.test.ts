// @vitest-environment jsdom

import { describe, expect, it } from "vitest";

import type { RawPage } from "@bnuz-feed/contracts";

import { zhxqxwwFetchTargets, zhxqxwwParser } from "./zhxqxww";

function createPage(
  overrides: Partial<RawPage> & Pick<RawPage, "requestId" | "requestUrl" | "finalUrl" | "bodyText">,
): RawPage {
  return {
    sourceId: "b3e7c5f24a434f788257a698f79c37ff",
    fetchedAt: "2026-03-21T00:00:00.000Z",
    ...overrides,
  };
}

describe("zhxqxww parser", () => {
  it("declares the confirmed public message sources", () => {
    expect(zhxqxwwFetchTargets).toHaveLength(138);
    expect(zhxqxwwFetchTargets.slice(0, 3)).toEqual([
      { id: "ttgz", url: "https://zhnews.bnuzh.edu.cn/ttgz/index.htm", channel: "头条关注" },
      { id: "ttgz/index1", url: "https://zhnews.bnuzh.edu.cn/ttgz/index1.htm", channel: "头条关注" },
      { id: "ttgz/index2", url: "https://zhnews.bnuzh.edu.cn/ttgz/index2.htm", channel: "头条关注" },
    ]);
    expect(zhxqxwwFetchTargets).toEqual(
      expect.arrayContaining([
        { id: "tzgg/index16", url: "https://zhnews.bnuzh.edu.cn/tzgg/index16.htm", channel: "通知公告" },
        { id: "zhbd/index80", url: "https://zhnews.bnuzh.edu.cn/zhbd/index80.htm", channel: "综合报道" },
        { id: "mtsd", url: "https://zhnews.bnuzh.edu.cn/mtsd/index.htm", channel: "媒体师大" },
        { id: "gysd", url: "https://zhnews.bnuzh.edu.cn/gysd/index.htm", channel: "光影师大" },
      ]),
    );
  });

  it("parses paginated headline cards with relative links and full dates", async () => {
    const page = createPage({
      requestId: "ttgz",
      requestUrl: "https://zhnews.bnuzh.edu.cn/ttgz/index.htm",
      finalUrl: "https://zhnews.bnuzh.edu.cn/ttgz/index.htm",
      bodyText: `
        <body>
          <section class="articleList02 articleList03 clearFix">
            <ul class="bnu-list01 clearFix">
              <li>
                <a href="02f237cb3d274b9cb7886f94daac5865.htm">
                  <div class="item-txt01">
                    <h3 class="fpx16">珠海校区召开2026年维护校园安全稳定工作会议</h3>
                    <span class="item-date01">2026-03-20</span>
                  </div>
                </a>
              </li>
              <li>
                <a href="https://mp.weixin.qq.com/s/VimMo3iuUkdcR-dfVAEmPw">
                  <div class="item-txt01">
                    <h3 class="fpx16">聚焦两会 | 这是北师大人的“教育好声音”！</h3>
                    <span class="item-date01">2026-03-12</span>
                  </div>
                </a>
              </li>
            </ul>
          </section>
        </body>
      `,
    });

    await expect(zhxqxwwParser.parse(page)).resolves.toEqual([
      {
        sourceId: "b3e7c5f24a434f788257a698f79c37ff",
        rawId: "02f237cb3d274b9cb7886f94daac5865.htm",
        rawTitle: "珠海校区召开2026年维护校园安全稳定工作会议",
        rawUrl: "https://zhnews.bnuzh.edu.cn/ttgz/02f237cb3d274b9cb7886f94daac5865.htm",
        rawPublishedAt: "2026-03-20",
        rawChannel: "头条关注",
        rawSummary: undefined,
        extras: {
          requestId: "ttgz",
        },
      },
      {
        sourceId: "b3e7c5f24a434f788257a698f79c37ff",
        rawId: "https://mp.weixin.qq.com/s/VimMo3iuUkdcR-dfVAEmPw",
        rawTitle: "聚焦两会 | 这是北师大人的“教育好声音”！",
        rawUrl: "https://mp.weixin.qq.com/s/VimMo3iuUkdcR-dfVAEmPw",
        rawPublishedAt: "2026-03-12",
        rawChannel: "头条关注",
        rawSummary: undefined,
        extras: {
          requestId: "ttgz",
        },
      },
    ]);
  });

  it("parses notice, report, media and photo-list layouts", async () => {
    const noticePage = createPage({
      requestId: "tzgg",
      requestUrl: "https://zhnews.bnuzh.edu.cn/tzgg/index.htm",
      finalUrl: "https://zhnews.bnuzh.edu.cn/tzgg/index.htm",
      bodyText: `
        <body>
          <section class="articleList02 articleList03 clearFix">
            <ul class="bnu-list02 clearFix">
              <li>
                <span class="list-date02"><strong>17</strong><span>2026-03</span></span>
                <a class="fpx16" href="../tzgs/79d34640faf147bab80fb2031e47eb9c.htm">【通知】2026年牛津大学暑期展望项目&学年访问生项目宣讲会通知</a>
              </li>
            </ul>
          </section>
        </body>
      `,
    });

    await expect(zhxqxwwParser.parse(noticePage)).resolves.toEqual([
      {
        sourceId: "b3e7c5f24a434f788257a698f79c37ff",
        rawId: "../tzgs/79d34640faf147bab80fb2031e47eb9c.htm",
        rawTitle: "【通知】2026年牛津大学暑期展望项目&学年访问生项目宣讲会通知",
        rawUrl: "https://zhnews.bnuzh.edu.cn/tzgs/79d34640faf147bab80fb2031e47eb9c.htm",
        rawPublishedAt: "2026-03-17",
        rawChannel: "通知公告",
        rawSummary: undefined,
        extras: {
          requestId: "tzgg",
        },
      },
    ]);

    const reportPage = createPage({
      requestId: "zhbd",
      requestUrl: "https://zhnews.bnuzh.edu.cn/zhbd/index.htm",
      finalUrl: "https://zhnews.bnuzh.edu.cn/zhbd/index.htm",
      bodyText: `
        <body>
          <section class="articleList02 articleList03 clearFix">
            <ul class="bnu-list02 clearFix">
              <li>
                <span class="list-date02"><strong>20</strong><span>2026-03</span></span>
                <a class="fpx16" href="http://www.bnuzh.edu.cn/zhxw/a4d12d982b5f43da9adfa28245a8497a.htm">珠海校区开展春季学期实战化应急疏散演练暨森林防火联防联训</a>
              </li>
            </ul>
          </section>
        </body>
      `,
    });

    await expect(zhxqxwwParser.parse(reportPage)).resolves.toEqual([
      {
        sourceId: "b3e7c5f24a434f788257a698f79c37ff",
        rawId: "http://www.bnuzh.edu.cn/zhxw/a4d12d982b5f43da9adfa28245a8497a.htm",
        rawTitle: "珠海校区开展春季学期实战化应急疏散演练暨森林防火联防联训",
        rawUrl: "http://www.bnuzh.edu.cn/zhxw/a4d12d982b5f43da9adfa28245a8497a.htm",
        rawPublishedAt: "2026-03-20",
        rawChannel: "综合报道",
        rawSummary: undefined,
        extras: {
          requestId: "zhbd",
        },
      },
    ]);

    const mediaPage = createPage({
      requestId: "mtsd",
      requestUrl: "https://zhnews.bnuzh.edu.cn/mtsd/index.htm",
      finalUrl: "https://zhnews.bnuzh.edu.cn/mtsd/index.htm",
      bodyText: `
        <body>
          <section class="articleList02 articleList03 clearFix">
            <ul class="bnu-list02 clearFix">
              <li>
                <span class="list-date02"><strong>20</strong><span>2026-03</span></span>
                <a class="fpx16" href="https://m.itouchtv.cn/article/8d1ac95b297414837b305ae8ca9faa16?shareId=1PIw%21plE">【广东广播电视台】《Nature Communications》刊发北师大珠海校区团队成果：社团结构是复杂网络路径多重性的关键</a>
              </li>
            </ul>
          </section>
        </body>
      `,
    });

    await expect(zhxqxwwParser.parse(mediaPage)).resolves.toEqual([
      {
        sourceId: "b3e7c5f24a434f788257a698f79c37ff",
        rawId: "https://m.itouchtv.cn/article/8d1ac95b297414837b305ae8ca9faa16?shareId=1PIw%21plE",
        rawTitle: "【广东广播电视台】《Nature Communications》刊发北师大珠海校区团队成果：社团结构是复杂网络路径多重性的关键",
        rawUrl: "https://m.itouchtv.cn/article/8d1ac95b297414837b305ae8ca9faa16?shareId=1PIw%21plE",
        rawPublishedAt: "2026-03-20",
        rawChannel: "媒体师大",
        rawSummary: undefined,
        extras: {
          requestId: "mtsd",
        },
      },
    ]);

    const photoPage = createPage({
      requestId: "gysd",
      requestUrl: "https://zhnews.bnuzh.edu.cn/gysd/index.htm",
      finalUrl: "https://zhnews.bnuzh.edu.cn/gysd/index.htm",
      bodyText: `
        <body>
          <section class="articleList02 articleList03 clearFix">
            <ul class="bnu-list03 clearFix">
              <li>
                <a href="0ec6b290f35b4b61a5eaa8ed2e9ef0c6.htm">
                  <span class="item-img03"><img src="../images/2021-01/f7a7f6f1e0974b659b38566ba4736672.jpg" alt=""></span>
                  <h3 class="fpx16">励教楼</h3>
                </a>
              </li>
            </ul>
          </section>
        </body>
      `,
    });

    await expect(zhxqxwwParser.parse(photoPage)).resolves.toEqual([
      {
        sourceId: "b3e7c5f24a434f788257a698f79c37ff",
        rawId: "0ec6b290f35b4b61a5eaa8ed2e9ef0c6.htm",
        rawTitle: "励教楼",
        rawUrl: "https://zhnews.bnuzh.edu.cn/gysd/0ec6b290f35b4b61a5eaa8ed2e9ef0c6.htm",
        rawPublishedAt: undefined,
        rawChannel: "光影师大",
        rawSummary: undefined,
        extras: {
          requestId: "gysd",
        },
      },
    ]);
  });
});
