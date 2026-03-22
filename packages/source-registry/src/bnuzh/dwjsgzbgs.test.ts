// @vitest-environment jsdom

import { describe, expect, it } from "vitest";

import type { RawPage } from "@bnuz-feed/contracts";

import { dwjsgzbgsFetchTargets, dwjsgzbgsParser } from "./dwjsgzbgs";

function createPage(
  overrides: Partial<RawPage> & Pick<RawPage, "requestId" | "requestUrl" | "finalUrl" | "bodyText">,
): RawPage {
  return {
    sourceId: "a100866175714d5782818c210cec8060",
    fetchedAt: "2026-03-21T00:00:00.000Z",
    ...overrides,
  };
}

describe("dwjsgzbgsParser", () => {
  it("declares the confirmed public message-source pages and excludes static pages", () => {
    expect(dwjsgzbgsFetchTargets).toEqual([
      { id: "gzdt/xwdt", url: "https://dwjgb.bnuzh.edu.cn/gzdt/xwdt/index.htm", channel: "\u5de5\u4f5c\u52a8\u6001" },
      { id: "gzdt/tzgg", url: "https://dwjgb.bnuzh.edu.cn/gzdt/tzgg/index.htm", channel: "\u901a\u77e5\u516c\u544a" },
      { id: "jxwz", url: "https://dwjgb.bnuzh.edu.cn/jxwz/index.htm", channel: "\u7cbe\u9009\u6587\u7ae0" },
      {
        id: "zt/ysjh",
        url: "https://dwjgb.bnuzh.edu.cn/zt/ysjh/index.htm",
        channel: "\u201c\u4f18\u5e08\u8ba1\u5212\u201d\u56de\u4fe1\u7cbe\u795e",
      },
      {
        id: "zt/xxddesdjs",
        url: "https://dwjgb.bnuzh.edu.cn/zt/xxddesdjs/index.htm",
        channel: "\u5b66\u4e60\u515a\u7684\u4e8c\u5341\u5927\u7cbe\u795e",
      },
      { id: "zt/dxjt", url: "https://dwjgb.bnuzh.edu.cn/zt/dxjt/index.htm", channel: "\u5fb7\u99a8\u8bb2\u575b" },
      { id: "sdsf/sddf", url: "https://dwjgb.bnuzh.edu.cn/sdsf/sddf/index.htm", channel: "\u5e08\u5fb7\u5178\u8303" },
      { id: "sdsf/jsfc", url: "https://dwjgb.bnuzh.edu.cn/sdsf/jsfc/index.htm", channel: "\u6559\u5e08\u98ce\u91c7" },
      { id: "xxjy/llxx", url: "https://dwjgb.bnuzh.edu.cn/xxjy/llxx/index.htm", channel: "\u7406\u8bba\u5b66\u4e60" },
      { id: "xxjy/jypx", url: "https://dwjgb.bnuzh.edu.cn/xxjy/jypx/index.htm", channel: "\u6559\u80b2\u57f9\u8bad" },
      { id: "xxjy/jsjy", url: "https://dwjgb.bnuzh.edu.cn/xxjy/jsjy/index.htm", channel: "\u8b66\u793a\u6559\u80b2" },
      { id: "zdjs/sjwj", url: "https://dwjgb.bnuzh.edu.cn/zdjs/sjwj/index.htm", channel: "\u4e0a\u7ea7\u6587\u4ef6" },
      { id: "zdjs/xxwj", url: "https://dwjgb.bnuzh.edu.cn/zdjs/xxwj/index.htm", channel: "\u5b66\u6821\u6587\u4ef6" },
      { id: "sdjd/clgd", url: "https://dwjgb.bnuzh.edu.cn/sdjd/clgd/index.htm", channel: "\u5904\u7406\u89c4\u5b9a" },
      { id: "sdjd/qktb", url: "https://dwjgb.bnuzh.edu.cn/sdjd/qktb/index.htm", channel: "\u60c5\u51b5\u901a\u62a5" },
    ]);
  });

  it("parses the article-list layout with dates, relative links, and absolute links", async () => {
    const page = createPage({
      requestId: "gzdt/xwdt",
      requestUrl: "https://dwjgb.bnuzh.edu.cn/gzdt/xwdt/index.htm",
      finalUrl: "https://dwjgb.bnuzh.edu.cn/gzdt/xwdt/index.htm",
      bodyText: `
        <body>
          <div class="container my-3 my-lg-5">
            <div class="col-lg-9">
              <ul class="article-list list-unstyled mb-0 px-3 px-lg-5">
                <li>
                  <a class="article" href="https://news.example.edu.cn/story.htm">
                    <div class="content"><p class="title">Teacher Forum</p></div>
                    <div class="time">2025/09/06</div>
                  </a>
                </li>
                <li>
                  <a class="article" href="campus.htm">
                    <div class="content"><p class="title">Campus Event</p></div>
                    <div class="time">2024-10-29</div>
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </body>
      `,
    });

    await expect(dwjsgzbgsParser.parse(page)).resolves.toEqual([
      {
        sourceId: "a100866175714d5782818c210cec8060",
        rawId: "https://news.example.edu.cn/story.htm",
        rawTitle: "Teacher Forum",
        rawUrl: "https://news.example.edu.cn/story.htm",
        rawPublishedAt: "2025-09-06",
        rawChannel: "\u5de5\u4f5c\u52a8\u6001",
        rawSummary: undefined,
        extras: {
          requestId: "gzdt/xwdt",
        },
      },
      {
        sourceId: "a100866175714d5782818c210cec8060",
        rawId: "campus.htm",
        rawTitle: "Campus Event",
        rawUrl: "https://dwjgb.bnuzh.edu.cn/gzdt/xwdt/campus.htm",
        rawPublishedAt: "2024-10-29",
        rawChannel: "\u5de5\u4f5c\u52a8\u6001",
        rawSummary: undefined,
        extras: {
          requestId: "gzdt/xwdt",
        },
      },
    ]);
  });

  it("parses topic pages, document lists, and attachment URLs", async () => {
    const topicPage = createPage({
      requestId: "zt/dxjt",
      requestUrl: "https://dwjgb.bnuzh.edu.cn/zt/dxjt/index.htm",
      finalUrl: "https://dwjgb.bnuzh.edu.cn/zt/dxjt/index.htm",
      bodyText: `
        <body>
          <div class="container my-3 my-lg-5">
            <div class="col-lg-9">
              <ul class="article-list list-unstyled mb-0 px-3 px-lg-5">
                <li>
                  <a class="article" href="lecture.htm">
                    <div class="content"><p class="title">Dexin Talk</p></div>
                    <div class="time">2024\u5e7411\u670803\u65e5</div>
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </body>
      `,
    });

    const page = createPage({
      requestId: "zdjs/sjwj",
      requestUrl: "https://dwjgb.bnuzh.edu.cn/zdjs/sjwj/index.htm",
      finalUrl: "https://dwjgb.bnuzh.edu.cn/zdjs/sjwj/index.htm",
      bodyText: `
        <body>
          <div class="container my-3 my-lg-5">
            <div class="col-lg-9">
              <ul class="article-list list-unstyled mb-0 px-3 px-lg-5">
                <li><a class="article" href="http://www.gov.cn/policy.htm"><div class="content"><p class="title">National Policy</p></div></a></li>
                <li><a class="article" href="../../docs/2025-04/rules.pdf"><div class="content"><p class="title">School Rules PDF</p></div></a></li>
              </ul>
            </div>
          </div>
        </body>
      `,
    });

    await expect(dwjsgzbgsParser.parse(topicPage)).resolves.toEqual([
      {
        sourceId: "a100866175714d5782818c210cec8060",
        rawId: "lecture.htm",
        rawTitle: "Dexin Talk",
        rawUrl: "https://dwjgb.bnuzh.edu.cn/zt/dxjt/lecture.htm",
        rawPublishedAt: "2024-11-03",
        rawChannel: "\u5fb7\u99a8\u8bb2\u575b",
        rawSummary: undefined,
        extras: {
          requestId: "zt/dxjt",
        },
      },
    ]);

    await expect(dwjsgzbgsParser.parse(page)).resolves.toEqual([
      {
        sourceId: "a100866175714d5782818c210cec8060",
        rawId: "http://www.gov.cn/policy.htm",
        rawTitle: "National Policy",
        rawUrl: "http://www.gov.cn/policy.htm",
        rawPublishedAt: undefined,
        rawChannel: "\u4e0a\u7ea7\u6587\u4ef6",
        rawSummary: undefined,
        extras: {
          requestId: "zdjs/sjwj",
        },
      },
      {
        sourceId: "a100866175714d5782818c210cec8060",
        rawId: "../../docs/2025-04/rules.pdf",
        rawTitle: "School Rules PDF",
        rawUrl: "https://dwjgb.bnuzh.edu.cn/docs/2025-04/rules.pdf",
        rawPublishedAt: undefined,
        rawChannel: "\u4e0a\u7ea7\u6587\u4ef6",
        rawSummary: undefined,
        extras: {
          requestId: "zdjs/sjwj",
        },
      },
    ]);
  });
});
