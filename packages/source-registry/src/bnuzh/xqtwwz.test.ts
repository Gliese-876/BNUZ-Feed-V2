// @vitest-environment jsdom

import { describe, expect, it } from "vitest";

import type { RawPage } from "@bnuz-feed/contracts";

import { xqtwwzFetchTargets, xqtwwzParser } from "./xqtwwz";

function createPage(
  overrides: Partial<RawPage> & Pick<RawPage, "requestId" | "requestUrl" | "finalUrl" | "bodyText">,
): RawPage {
  return {
    sourceId: "5624a6f0b836401d8e9b6459da95b24e",
    fetchedAt: "2026-03-21T00:00:00.000Z",
    ...overrides,
  };
}

describe("xqtwwz", () => {
  it("declares the confirmed public message sources and paginated targets", () => {
    expect(xqtwwzFetchTargets).toEqual([
      { id: "xwdt", url: "https://youth.bnuzh.edu.cn/xwdt/index.htm", channel: "新闻动态" },
      { id: "xwdt/index1", url: "https://youth.bnuzh.edu.cn/xwdt/index1.htm", channel: "新闻动态" },
      { id: "xwdt/index2", url: "https://youth.bnuzh.edu.cn/xwdt/index2.htm", channel: "新闻动态" },
      { id: "xwdt/index3", url: "https://youth.bnuzh.edu.cn/xwdt/index3.htm", channel: "新闻动态" },
      { id: "xwdt/index4", url: "https://youth.bnuzh.edu.cn/xwdt/index4.htm", channel: "新闻动态" },
      { id: "tzgg", url: "https://youth.bnuzh.edu.cn/tzgg/index.htm", channel: "通知公告" },
      { id: "tzgg/index1", url: "https://youth.bnuzh.edu.cn/tzgg/index1.htm", channel: "通知公告" },
      { id: "tzgg/index2", url: "https://youth.bnuzh.edu.cn/tzgg/index2.htm", channel: "通知公告" },
      { id: "tzgg/index3", url: "https://youth.bnuzh.edu.cn/tzgg/index3.htm", channel: "通知公告" },
      { id: "tzgg/index4", url: "https://youth.bnuzh.edu.cn/tzgg/index4.htm", channel: "通知公告" },
      { id: "tzgg/index5", url: "https://youth.bnuzh.edu.cn/tzgg/index5.htm", channel: "通知公告" },
      { id: "tzgg/index6", url: "https://youth.bnuzh.edu.cn/tzgg/index6.htm", channel: "通知公告" },
      { id: "tzgg/index7", url: "https://youth.bnuzh.edu.cn/tzgg/index7.htm", channel: "通知公告" },
      { id: "tzgg/index8", url: "https://youth.bnuzh.edu.cn/tzgg/index8.htm", channel: "通知公告" },
      { id: "tzgg/index9", url: "https://youth.bnuzh.edu.cn/tzgg/index9.htm", channel: "通知公告" },
      { id: "llxx", url: "https://youth.bnuzh.edu.cn/llxx/index.htm", channel: "理论学习" },
      { id: "gzzd", url: "https://youth.bnuzh.edu.cn/gzzd/index.htm", channel: "规章制度" },
      { id: "yxtwfc", url: "https://youth.bnuzh.edu.cn/yxtwfc/index.htm", channel: "院系团委风采" },
      { id: "jchd", url: "https://youth.bnuzh.edu.cn/jchd/index.htm", channel: "精彩活动" },
      { id: "jchd/index1", url: "https://youth.bnuzh.edu.cn/jchd/index1.htm", channel: "精彩活动" },
      { id: "jchd/index2", url: "https://youth.bnuzh.edu.cn/jchd/index2.htm", channel: "精彩活动" },
      { id: "jchd/index3", url: "https://youth.bnuzh.edu.cn/jchd/index3.htm", channel: "精彩活动" },
      { id: "jchd/index4", url: "https://youth.bnuzh.edu.cn/jchd/index4.htm", channel: "精彩活动" },
    ]);
  });

  it("parses internal, external and document links from the confirmed article-list layout", async () => {
    const newsPage = createPage({
      requestId: "xwdt",
      requestUrl: "https://youth.bnuzh.edu.cn/xwdt/index.htm",
      finalUrl: "https://youth.bnuzh.edu.cn/xwdt/index.htm",
      bodyText: `
        <body>
          <ul class="article-list list-unstyled">
            <li class="item py-2 py-lg-3">
              <a class="d-flex" href="4c7e134b163942d48dc1b1b812ce0a3f.htm">
                <span class="title">北师大珠海校区志愿者服务第七届中国教育创新成果公益博览会</span>
                <span class="flex-shrink-0">2025/12/02</span>
              </a>
            </li>
            <li class="item py-2 py-lg-3">
              <a class="d-flex" href="https://mp.weixin.qq.com/s/i_w1xRbN1XzLnT7v72_bWA">
                <span class="title">第六届教博会志愿服务工作圆满收官</span>
                <span class="flex-shrink-0">2023/12/02</span>
              </a>
            </li>
          </ul>
        </body>
      `,
    });

    await expect(xqtwwzParser.parse(newsPage)).resolves.toEqual([
      {
        sourceId: "5624a6f0b836401d8e9b6459da95b24e",
        rawId: "4c7e134b163942d48dc1b1b812ce0a3f.htm",
        rawTitle: "北师大珠海校区志愿者服务第七届中国教育创新成果公益博览会",
        rawUrl: "https://youth.bnuzh.edu.cn/xwdt/4c7e134b163942d48dc1b1b812ce0a3f.htm",
        rawPublishedAt: "2025-12-02",
        rawChannel: "新闻动态",
        rawSummary: undefined,
        extras: {
          requestId: "xwdt",
        },
      },
      {
        sourceId: "5624a6f0b836401d8e9b6459da95b24e",
        rawId: "https://mp.weixin.qq.com/s/i_w1xRbN1XzLnT7v72_bWA",
        rawTitle: "第六届教博会志愿服务工作圆满收官",
        rawUrl: "https://mp.weixin.qq.com/s/i_w1xRbN1XzLnT7v72_bWA",
        rawPublishedAt: "2023-12-02",
        rawChannel: "新闻动态",
        rawSummary: undefined,
        extras: {
          requestId: "xwdt",
        },
      },
    ]);

    const rulesPage = createPage({
      requestId: "gzzd",
      requestUrl: "https://youth.bnuzh.edu.cn/gzzd/index.htm",
      finalUrl: "https://youth.bnuzh.edu.cn/gzzd/index.htm",
      bodyText: `
        <body>
          <ul class="article-list list-unstyled">
            <li class="item py-2 py-lg-3">
              <a class="d-flex" href="../docs/2022-05/6e03ffcdfa4b44c4ac7dba31b75ffef3.pdf">
                <span class="title">共青团中央关于印发 《中国共产主义青年团 团旗、 团徽、 团歌制作使用管理规定》 的通知</span>
                <span class="flex-shrink-0">2022/05/05</span>
              </a>
            </li>
          </ul>
        </body>
      `,
    });

    await expect(xqtwwzParser.parse(rulesPage)).resolves.toEqual([
      {
        sourceId: "5624a6f0b836401d8e9b6459da95b24e",
        rawId: "../docs/2022-05/6e03ffcdfa4b44c4ac7dba31b75ffef3.pdf",
        rawTitle: "共青团中央关于印发 《中国共产主义青年团 团旗、 团徽、 团歌制作使用管理规定》 的通知",
        rawUrl: "https://youth.bnuzh.edu.cn/docs/2022-05/6e03ffcdfa4b44c4ac7dba31b75ffef3.pdf",
        rawPublishedAt: "2022-05-05",
        rawChannel: "规章制度",
        rawSummary: undefined,
        extras: {
          requestId: "gzzd",
        },
      },
    ]);

    const learningPage = createPage({
      requestId: "llxx",
      requestUrl: "https://youth.bnuzh.edu.cn/llxx/index.htm",
      finalUrl: "https://youth.bnuzh.edu.cn/llxx/index.htm",
      bodyText: `
        <body>
          <ul class="article-list list-unstyled">
            <li class="item py-2 py-lg-3">
              <a class="d-flex" href="https://news.cn/politics/2022-05/10/c_1128636343.htm">
                <span class="title">【2022年05月】习近平：在庆祝中国共产主义青年团成立100周年大会上的讲话</span>
                <span class="flex-shrink-0">2022/05/10</span>
              </a>
            </li>
          </ul>
        </body>
      `,
    });

    await expect(xqtwwzParser.parse(learningPage)).resolves.toEqual([
      {
        sourceId: "5624a6f0b836401d8e9b6459da95b24e",
        rawId: "https://news.cn/politics/2022-05/10/c_1128636343.htm",
        rawTitle: "【2022年05月】习近平：在庆祝中国共产主义青年团成立100周年大会上的讲话",
        rawUrl: "https://news.cn/politics/2022-05/10/c_1128636343.htm",
        rawPublishedAt: "2022-05-10",
        rawChannel: "理论学习",
        rawSummary: undefined,
        extras: {
          requestId: "llxx",
        },
      },
    ]);
  });
});
