// @vitest-environment jsdom

import { describe, expect, it } from "vitest";

import type { RawPage } from "@bnuz-feed/contracts";

import { jsjysjwFetchTargets, jsjysjwParser } from "./jsjysjw";

function createPage(
  overrides: Partial<RawPage> & Pick<RawPage, "requestId" | "requestUrl" | "finalUrl" | "bodyText">,
): RawPage {
  return {
    sourceId: "a26211ac66e84356ae7726f5ceb8deb3",
    fetchedAt: "2026-03-21T00:00:00.000Z",
    ...overrides,
  };
}

describe("jsjysjwParser", () => {
  it("declares the stable archive pages and pagination targets", () => {
    expect(jsjysjwFetchTargets).toEqual([
      { id: "sxfc", url: "https://jwb.bnuzh.edu.cn/jsjysjw/sxfc/index.htm", channel: "实习风采" },
      { id: "sxfc/index1", url: "https://jwb.bnuzh.edu.cn/jsjysjw/sxfc/index1.htm", channel: "实习风采" },
      { id: "sxfc/index2", url: "https://jwb.bnuzh.edu.cn/jsjysjw/sxfc/index2.htm", channel: "实习风采" },
      { id: "sxfc/index3", url: "https://jwb.bnuzh.edu.cn/jsjysjw/sxfc/index3.htm", channel: "实习风采" },
      { id: "sxfc/index4", url: "https://jwb.bnuzh.edu.cn/jsjysjw/sxfc/index4.htm", channel: "实习风采" },
      { id: "sxfc/index5", url: "https://jwb.bnuzh.edu.cn/jsjysjw/sxfc/index5.htm", channel: "实习风采" },
      { id: "yxja", url: "https://jwb.bnuzh.edu.cn/jsjysjw/yxja/index.htm", channel: "优秀教案" },
      { id: "yxja/index1", url: "https://jwb.bnuzh.edu.cn/jsjysjw/yxja/index1.htm", channel: "优秀教案" },
      { id: "yxbzrgzfa", url: "https://jwb.bnuzh.edu.cn/jsjysjw/yxbzrgzfa/index.htm", channel: "优秀班主任工作方案" },
      { id: "yxkl", url: "https://jwb.bnuzh.edu.cn/jsjysjw/yxkl/index.htm", channel: "优秀课例" },
    ]);
  });

  it("parses实习风采 cards with external absolute links", async () => {
    const page = createPage({
      requestId: "sxfc",
      requestUrl: "https://jwb.bnuzh.edu.cn/jsjysjw/sxfc/index.htm",
      finalUrl: "https://jwb.bnuzh.edu.cn/jsjysjw/sxfc/index.htm",
      bodyText: `
        <body>
          <ul class="block-list64 list-unstyled gp-clearFix gpAvgList gp-li-mb0 gpLiMarginB gpFontSize gpFontColor">
            <li>
              <a class="gpTextArea" href="https://mp.weixin.qq.com/s/_fhM3TCW7f71BbI8RpBZvA">
                <span class="gp-f14 gpArticleDate">2025-11-04</span>
                <p class="gp-f16 gpArticleTitle gp-ellipsis">教育实习启航 | 北京师范大学珠海校区学子赴中山市第一中学开展教育实习</p>
              </a>
            </li>
            <li>
              <a class="gpTextArea" href="https://mp.weixin.qq.com/s/TGhUq_0d3fwPFZ5Ldns4iA">
                <span class="gp-f14 gpArticleDate">2025-11-04</span>
                <p class="gp-f16 gpArticleTitle gp-ellipsis">教育实习启航 | 北京师范大学珠海校区学子赴贵安新区附属学校开展教育实习</p>
              </a>
            </li>
          </ul>
        </body>
      `,
    });

    await expect(jsjysjwParser.parse(page)).resolves.toEqual([
      {
        sourceId: "a26211ac66e84356ae7726f5ceb8deb3",
        rawId: "https://mp.weixin.qq.com/s/_fhM3TCW7f71BbI8RpBZvA",
        rawTitle: "教育实习启航 | 北京师范大学珠海校区学子赴中山市第一中学开展教育实习",
        rawUrl: "https://mp.weixin.qq.com/s/_fhM3TCW7f71BbI8RpBZvA",
        rawPublishedAt: "2025-11-04",
        rawChannel: "实习风采",
        rawSummary: undefined,
        extras: {
          requestId: "sxfc",
        },
      },
      {
        sourceId: "a26211ac66e84356ae7726f5ceb8deb3",
        rawId: "https://mp.weixin.qq.com/s/TGhUq_0d3fwPFZ5Ldns4iA",
        rawTitle: "教育实习启航 | 北京师范大学珠海校区学子赴贵安新区附属学校开展教育实习",
        rawUrl: "https://mp.weixin.qq.com/s/TGhUq_0d3fwPFZ5Ldns4iA",
        rawPublishedAt: "2025-11-04",
        rawChannel: "实习风采",
        rawSummary: undefined,
        extras: {
          requestId: "sxfc",
        },
      },
    ]);
  });

  it("parses优秀班主任工作方案 cards with relative and legacy absolute URLs", async () => {
    const page = createPage({
      requestId: "yxbzrgzfa",
      requestUrl: "https://jwb.bnuzh.edu.cn/jsjysjw/yxbzrgzfa/index.htm",
      finalUrl: "https://jwb.bnuzh.edu.cn/jsjysjw/yxbzrgzfa/index.htm",
      bodyText: `
        <body>
          <ul class="block-list64 list-unstyled gp-clearFix gpAvgList gp-li-mb0 gpLiMarginB gpFontSize gpFontColor">
            <li>
              <a class="gpTextArea" href="d3442ddda34f47bf81e4e5e8c93ca534.htm">
                <span class="gp-f14 gpArticleDate">2023-11-02</span>
                <p class="gp-f16 gpArticleTitle gp-ellipsis">“学会专注--拥有学习的凸透镜“</p>
              </a>
            </li>
            <li>
              <a class="gpTextArea" href="https://jsjysj.bnu.edu.cn/yxbzrgzfa/62007.html">
                <span class="gp-f14 gpArticleDate">2019-01-09</span>
                <p class="gp-f16 gpArticleTitle gp-ellipsis">“畅享读书美，领略书中玉”</p>
              </a>
            </li>
          </ul>
        </body>
      `,
    });

    await expect(jsjysjwParser.parse(page)).resolves.toEqual([
      {
        sourceId: "a26211ac66e84356ae7726f5ceb8deb3",
        rawId: "d3442ddda34f47bf81e4e5e8c93ca534.htm",
        rawTitle: "“学会专注--拥有学习的凸透镜“",
        rawUrl: "https://jwb.bnuzh.edu.cn/jsjysjw/yxbzrgzfa/d3442ddda34f47bf81e4e5e8c93ca534.htm",
        rawPublishedAt: "2023-11-02",
        rawChannel: "优秀班主任工作方案",
        rawSummary: undefined,
        extras: {
          requestId: "yxbzrgzfa",
        },
      },
      {
        sourceId: "a26211ac66e84356ae7726f5ceb8deb3",
        rawId: "https://jsjysj.bnu.edu.cn/yxbzrgzfa/62007.html",
        rawTitle: "“畅享读书美，领略书中玉”",
        rawUrl: "https://jsjysj.bnu.edu.cn/yxbzrgzfa/62007.html",
        rawPublishedAt: "2019-01-09",
        rawChannel: "优秀班主任工作方案",
        rawSummary: undefined,
        extras: {
          requestId: "yxbzrgzfa",
        },
      },
    ]);
  });
});
