// @vitest-environment jsdom

import { describe, expect, it } from "vitest";

import type { RawPage } from "@bnuz-feed/contracts";

import { xcxyFetchTargets, xcxyParser } from "./xcxy";

function createPage(
  overrides: Partial<RawPage> & Pick<RawPage, "requestId" | "requestUrl" | "finalUrl" | "bodyText">,
): RawPage {
  return {
    sourceId: "944f1df5c6ed4ef8a94db5d8f6f72aa9",
    fetchedAt: "2026-03-21T00:00:00.000Z",
    ...overrides,
  };
}

describe("xcxy parser", () => {
  it("declares the confirmed public list and content targets", () => {
    expect(xcxyFetchTargets).toEqual([
      { id: "xwdt/index", url: "https://tcc.bnuzh.edu.cn/xwdt/index.htm", channel: "新闻动态" },
      { id: "xwdt/index1", url: "https://tcc.bnuzh.edu.cn/xwdt/index1.htm", channel: "新闻动态" },
      { id: "xwdt/index2", url: "https://tcc.bnuzh.edu.cn/xwdt/index2.htm", channel: "新闻动态" },
      { id: "xwdt/index3", url: "https://tcc.bnuzh.edu.cn/xwdt/index3.htm", channel: "新闻动态" },
      { id: "xydt/index", url: "https://tcc.bnuzh.edu.cn/xyll/xydt/index.htm", channel: "校友动态" },
    ]);
  });

  it("parses the paginated news list and normalizes relative article links", async () => {
    const page = createPage({
      requestId: "xwdt/index",
      requestUrl: "https://tcc.bnuzh.edu.cn/xwdt/index.htm",
      finalUrl: "https://tcc.bnuzh.edu.cn/xwdt/index.htm",
      bodyText: `
        <body>
          <article class="d-md-flex mg-posts-sec-post">
            <div class="mg-post-thumb back-img md">
              <a class="link-div" href="4fa65361f61c47f49df37c576e7008dd.htm"></a>
            </div>
            <div class="mg-sec-top-post py-3 col">
              <div class="mg-blog-category">
                <a class="newsup-categories category-color-1" href="4fa65361f61c47f49df37c576e7008dd.htm">新闻动态</a>
              </div>
              <h4 class="entry-title title">
                <a href="4fa65361f61c47f49df37c576e7008dd.htm" target="_blank">北师大新时代乡村振兴领军人才--乡镇长培训工程学员遴选持续进行</a>
              </h4>
              <div class="mg-blog-meta">
                <span class="mg-blog-date"><i></i>2022-04-07</span>
              </div>
              <p></p>
            </div>
          </article>
          <article class="d-md-flex mg-posts-sec-post">
            <div class="mg-post-thumb back-img md">
              <a class="link-div" href="../xydt/17fa58956c5d4fa985dd4472022c09d6.htm"></a>
            </div>
            <div class="mg-sec-top-post py-3 col">
              <div class="mg-blog-category">
                <a class="newsup-categories category-color-1" href="../xydt/17fa58956c5d4fa985dd4472022c09d6.htm">校友动态</a>
              </div>
              <h4 class="entry-title title">
                <a href="../xydt/17fa58956c5d4fa985dd4472022c09d6.htm" target="_blank">满怀赤诚之心 投身乡村振兴新征程——乡长学院首期学员结业！</a>
              </h4>
              <div class="mg-blog-meta">
                <span class="mg-blog-date"><i></i>2021-09-07</span>
              </div>
              <p>他们，来自五湖四海，四面八方满怀赤诚之心，只为乡村振兴</p>
            </div>
          </article>
        </body>
      `,
    });

    await expect(xcxyParser.parse(page)).resolves.toEqual([
      {
        sourceId: "944f1df5c6ed4ef8a94db5d8f6f72aa9",
        rawId: "4fa65361f61c47f49df37c576e7008dd.htm",
        rawTitle: "北师大新时代乡村振兴领军人才--乡镇长培训工程学员遴选持续进行",
        rawUrl: "https://tcc.bnuzh.edu.cn/xwdt/4fa65361f61c47f49df37c576e7008dd.htm",
        rawPublishedAt: "2022-04-07",
        rawChannel: "新闻动态",
        rawSummary: undefined,
        extras: {
          requestId: "xwdt/index",
        },
      },
      {
        sourceId: "944f1df5c6ed4ef8a94db5d8f6f72aa9",
        rawId: "../xydt/17fa58956c5d4fa985dd4472022c09d6.htm",
        rawTitle: "满怀赤诚之心 投身乡村振兴新征程——乡长学院首期学员结业！",
        rawUrl: "https://tcc.bnuzh.edu.cn/xydt/17fa58956c5d4fa985dd4472022c09d6.htm",
        rawPublishedAt: "2021-09-07",
        rawChannel: "新闻动态",
        rawSummary: "他们，来自五湖四海，四面八方满怀赤诚之心，只为乡村振兴",
        extras: {
          requestId: "xwdt/index",
        },
      },
    ]);
  });

  it("parses the public alumni story page even when the date block is absent", async () => {
    const page = createPage({
      requestId: "xydt/index",
      requestUrl: "https://tcc.bnuzh.edu.cn/xyll/xydt/index.htm",
      finalUrl: "https://tcc.bnuzh.edu.cn/xyll/xydt/index.htm",
      bodyText: `
        <body>
          <article class="d-md-flex mg-posts-sec-post">
            <div class="mg-post-thumb back-img md">
              <a class="link-div" href="17fa58956c5d4fa985dd4472022c09d6.htm"></a>
            </div>
            <div class="mg-sec-top-post py-3 col">
              <div class="mg-blog-category">
                <a class="newsup-categories category-color-1" href="17fa58956c5d4fa985dd4472022c09d6.htm">校友动态</a>
              </div>
              <h4 class="entry-title title">
                <a href="17fa58956c5d4fa985dd4472022c09d6.htm" target="_blank">满怀赤诚之心 投身乡村振兴新征程——乡长学院首期学员结业！</a>
              </h4>
              <p>他们，来自五湖四海，四面八方满怀赤诚之心，只为乡村振兴</p>
            </div>
          </article>
        </body>
      `,
    });

    await expect(xcxyParser.parse(page)).resolves.toEqual([
      {
        sourceId: "944f1df5c6ed4ef8a94db5d8f6f72aa9",
        rawId: "17fa58956c5d4fa985dd4472022c09d6.htm",
        rawTitle: "满怀赤诚之心 投身乡村振兴新征程——乡长学院首期学员结业！",
        rawUrl: "https://tcc.bnuzh.edu.cn/xyll/xydt/17fa58956c5d4fa985dd4472022c09d6.htm",
        rawPublishedAt: undefined,
        rawChannel: "校友动态",
        rawSummary: "他们，来自五湖四海，四面八方满怀赤诚之心，只为乡村振兴",
        extras: {
          requestId: "xydt/index",
        },
      },
    ]);
  });
});
