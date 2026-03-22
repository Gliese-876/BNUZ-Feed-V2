// @vitest-environment jsdom

import { describe, expect, it } from "vitest";

import type { RawPage } from "@bnuz-feed/contracts";

import { bnuzFetchTargets, bnuzParser } from "./bnuz";

function createPage(
  overrides: Partial<RawPage> & Pick<RawPage, "requestId" | "requestUrl" | "finalUrl" | "bodyText">,
): RawPage {
  return {
    sourceId: "f018e769b2bd4733a968e902befe7e17",
    fetchedAt: "2026-03-22T00:00:00.000Z",
    ...overrides,
  };
}

describe("bnuz parser", () => {
  it("declares the stable public message lists and pagination", () => {
    expect(bnuzFetchTargets).toHaveLength(30);
    expect(bnuzFetchTargets).toEqual(
      expect.arrayContaining([
        { id: "xqtt", url: "http://www.bnuzh.edu.cn/xqtt/index.htm", channel: "校区头条" },
        { id: "zhxw/index4", url: "http://www.bnuzh.edu.cn/zhxw/index4.htm", channel: "综合新闻" },
        { id: "tzgs", url: "http://www.bnuzh.edu.cn/tzgs/index.htm", channel: "通知公示" },
        { id: "mtsd/index1", url: "http://www.bnuzh.edu.cn/mtsd/index1.htm", channel: "媒体师大" },
        { id: "xshd/index4", url: "http://www.bnuzh.edu.cn/xshd/index4.htm", channel: "学术活动" },
        { id: "xqgs", url: "http://www.bnuzh.edu.cn/xqgs/index.htm", channel: "校区故事" },
      ]),
    );
  });

  it("extracts standard date-and-title news lists with relative and absolute links", async () => {
    const page = createPage({
      requestId: "xqtt",
      requestUrl: "http://www.bnuzh.edu.cn/xqtt/index.htm",
      finalUrl: "http://www.bnuzh.edu.cn/xqtt/index.htm",
      bodyText: `
        <body>
          <div class="gp-container genArticle whiteBg gp-clearFix">
            <ul class="bnuh-list20 bnuh-list21">
              <li>
                <span>2026-03-20</span>
                <a href="02f237cb3d274b9cb7886f94daac5865.htm">珠海校区召开2026年维护校园安全稳定工作会议</a>
              </li>
              <li>
                <span>2026-03-12</span>
                <a href="https://mp.weixin.qq.com/s/VimMo3iuUkdcR-dfVAEmPw?scene=1">聚焦两会 | 这是北师大人的“教育好声音”！</a>
              </li>
            </ul>
          </div>
        </body>
      `,
    });

    await expect(bnuzParser.parse(page)).resolves.toEqual([
      {
        sourceId: "f018e769b2bd4733a968e902befe7e17",
        rawId: "02f237cb3d274b9cb7886f94daac5865.htm",
        rawTitle: "珠海校区召开2026年维护校园安全稳定工作会议",
        rawUrl: "http://www.bnuzh.edu.cn/xqtt/02f237cb3d274b9cb7886f94daac5865.htm",
        rawPublishedAt: "2026-03-20",
        rawChannel: "校区头条",
        rawSummary: undefined,
        extras: {
          requestId: "xqtt",
        },
      },
      {
        sourceId: "f018e769b2bd4733a968e902befe7e17",
        rawId: "https://mp.weixin.qq.com/s/VimMo3iuUkdcR-dfVAEmPw?scene=1",
        rawTitle: "聚焦两会 | 这是北师大人的“教育好声音”！",
        rawUrl: "https://mp.weixin.qq.com/s/VimMo3iuUkdcR-dfVAEmPw?scene=1",
        rawPublishedAt: "2026-03-12",
        rawChannel: "校区头条",
        rawSummary: undefined,
        extras: {
          requestId: "xqtt",
        },
      },
    ]);
  });

  it("extracts featured academic cards with summaries from multiple blocks", async () => {
    const page = createPage({
      requestId: "xshd",
      requestUrl: "http://www.bnuzh.edu.cn/xshd/index.htm",
      finalUrl: "http://www.bnuzh.edu.cn/xshd/index.htm",
      bodyText: `
        <body>
          <div class="gp-container xshd gp-clearFix">
            <ul class="bnuh-list22 gp-avg-sm-2">
              <li>
                <a class="hdCol" href="https://news.bnu.edu.cn//zx/xzdt/b12b4c240e7f45fa8e8bfe7f68c947b5.htm">
                  <h3 class="gp-f16 gp-title">【观点】万喆：为全球南方共同发展注入新动能</h3>
                  <p class="gp-p1">刚刚落幕的十四届全国人大四次会议批准的“十五五”规划纲要。</p>
                  <span class="list-date4 list-date6 gp-ib"><i class="iconfont icon-date"></i>2026-03-18</span>
                </a>
              </li>
            </ul>
          </div>
          <div class="gp-container xshd2 gp-clearFix">
            <ul class="bnuh-list22 gp-avg-md-4 gp-avg-sm-2">
              <li>
                <a class="hdCol" href="7365df8231df42f1bed7b59138028a34.htm">
                  <h3 class="gp-f16 gp-title">【成果】文理学院梁燕婷团队在《Computers & Education》发表VR听力研究重要成果</h3>
                  <p class="gp-p1">该研究立足于“新文科”背景下的数字化建设。</p>
                  <span class="list-date4 list-date6 gp-ib"><i class="iconfont icon-date"></i>2026-03-10</span>
                </a>
              </li>
            </ul>
          </div>
        </body>
      `,
    });

    await expect(bnuzParser.parse(page)).resolves.toEqual([
      {
        sourceId: "f018e769b2bd4733a968e902befe7e17",
        rawId: "https://news.bnu.edu.cn//zx/xzdt/b12b4c240e7f45fa8e8bfe7f68c947b5.htm",
        rawTitle: "【观点】万喆：为全球南方共同发展注入新动能",
        rawUrl: "https://news.bnu.edu.cn//zx/xzdt/b12b4c240e7f45fa8e8bfe7f68c947b5.htm",
        rawPublishedAt: "2026-03-18",
        rawChannel: "学术活动",
        rawSummary: "刚刚落幕的十四届全国人大四次会议批准的“十五五”规划纲要。",
        extras: {
          requestId: "xshd",
        },
      },
      {
        sourceId: "f018e769b2bd4733a968e902befe7e17",
        rawId: "7365df8231df42f1bed7b59138028a34.htm",
        rawTitle: "【成果】文理学院梁燕婷团队在《Computers & Education》发表VR听力研究重要成果",
        rawUrl: "http://www.bnuzh.edu.cn/xshd/7365df8231df42f1bed7b59138028a34.htm",
        rawPublishedAt: "2026-03-10",
        rawChannel: "学术活动",
        rawSummary: "该研究立足于“新文科”背景下的数字化建设。",
        extras: {
          requestId: "xshd",
        },
      },
    ]);
  });
});
