// @vitest-environment jsdom

import { describe, expect, it } from "vitest";

import type { RawPage } from "@bnuz-feed/contracts";

import { xddjjdgjztwFetchTargets, xddjjdgjztwParser } from "./xddjjdgjztw";

function createPage(
  overrides: Partial<RawPage> & Pick<RawPage, "requestId" | "requestUrl" | "finalUrl" | "bodyText">,
): RawPage {
  return {
    sourceId: "8f2630501d2b497b93b895da12d0903a",
    fetchedAt: "2026-03-21T00:00:00.000Z",
    ...overrides,
  };
}

describe("xddjjdgjztwParser", () => {
  it("declares the five confirmed public message sources", () => {
    expect(xddjjdgjztwFetchTargets).toEqual([
      { id: "zydt", url: "https://djjd.bnuzh.edu.cn/zydt/index.htm", channel: "\u91cd\u8981\u52a8\u6001" },
      { id: "twdt", url: "https://djjd.bnuzh.edu.cn/twdt/index.htm", channel: "\u56fe\u6587\u52a8\u6001" },
      { id: "gzdt", url: "https://djjd.bnuzh.edu.cn/gzdt/index.htm", channel: "\u5de5\u4f5c\u52a8\u6001" },
      { id: "tzgg", url: "https://djjd.bnuzh.edu.cn/tzgg/index.htm", channel: "\u901a\u77e5\u516c\u544a" },
      { id: "xxzl", url: "https://djjd.bnuzh.edu.cn/xxzl/index.htm", channel: "\u5b66\u4e60\u8d44\u6599" },
    ]);
  });

  it("parses important-dynamic entries with date normalization and cross-directory links", async () => {
    const page = createPage({
      requestId: "zydt",
      requestUrl: "https://djjd.bnuzh.edu.cn/zydt/index.htm",
      finalUrl: "https://djjd.bnuzh.edu.cn/zydt/index.htm",
      bodyText: `
        <body>
          <div class="container my-3 my-lg-5">
            <ul class="channel-article-list list-unstyled">
              <li><a class="link" href="alpha.htm"><div class="title">Alpha News</div><div class="date">2024\u5e7411\u670827\u65e5</div></a></li>
              <li><a class="link" href="../gzdt/beta.htm"><div class="title">Cross Directory Item</div><div class="date">2023-05-21</div></a></li>
            </ul>
          </div>
        </body>
      `,
    });

    await expect(xddjjdgjztwParser.parse(page)).resolves.toEqual([
      {
        sourceId: "8f2630501d2b497b93b895da12d0903a",
        rawId: "alpha.htm",
        rawTitle: "Alpha News",
        rawUrl: "https://djjd.bnuzh.edu.cn/zydt/alpha.htm",
        rawPublishedAt: "2024-11-27",
        rawChannel: "\u91cd\u8981\u52a8\u6001",
        rawSummary: undefined,
        extras: {
          requestId: "zydt",
        },
      },
      {
        sourceId: "8f2630501d2b497b93b895da12d0903a",
        rawId: "../gzdt/beta.htm",
        rawTitle: "Cross Directory Item",
        rawUrl: "https://djjd.bnuzh.edu.cn/gzdt/beta.htm",
        rawPublishedAt: "2023-05-21",
        rawChannel: "\u91cd\u8981\u52a8\u6001",
        rawSummary: undefined,
        extras: {
          requestId: "zydt",
        },
      },
    ]);
  });

  it("parses picture-dynamic, work-dynamic, and notice lists", async () => {
    const twdtPage = createPage({
      requestId: "twdt",
      requestUrl: "https://djjd.bnuzh.edu.cn/twdt/index.htm",
      finalUrl: "https://djjd.bnuzh.edu.cn/twdt/index.htm",
      bodyText: `
        <body>
          <div class="container my-3 my-lg-5">
            <ul class="channel-article-list list-unstyled">
              <li><a class="link" href="photo.htm"><div class="title">Photo Story</div><div class="date">2025\u5e7412\u670831\u65e5</div></a></li>
            </ul>
          </div>
        </body>
      `,
    });

    const gzdtPage = createPage({
      requestId: "gzdt",
      requestUrl: "https://djjd.bnuzh.edu.cn/gzdt/index.htm",
      finalUrl: "https://djjd.bnuzh.edu.cn/gzdt/index.htm",
      bodyText: `
        <body>
          <div class="container my-3 my-lg-5">
            <ul class="channel-article-list list-unstyled">
              <li><a class="link" href="work.htm"><div class="title">Work Update</div><div class="date">2025/12/01</div></a></li>
            </ul>
          </div>
        </body>
      `,
    });

    const tzggPage = createPage({
      requestId: "tzgg",
      requestUrl: "https://djjd.bnuzh.edu.cn/tzgg/index.htm",
      finalUrl: "https://djjd.bnuzh.edu.cn/tzgg/index.htm",
      bodyText: `
        <body>
          <div class="container my-3 my-lg-5">
            <ul class="channel-article-list list-unstyled">
              <li><a class="link" href="notice.htm"><div class="title">Notice One</div><div class="date">2023\u5e7405\u670805\u65e5</div></a></li>
              <li><a class="link" href="notice-2.htm"><div class="title">Notice Two</div><div class="date">2023\u5e7404\u670803\u65e5</div></a></li>
            </ul>
          </div>
        </body>
      `,
    });

    await expect(xddjjdgjztwParser.parse(twdtPage)).resolves.toEqual([
      {
        sourceId: "8f2630501d2b497b93b895da12d0903a",
        rawId: "photo.htm",
        rawTitle: "Photo Story",
        rawUrl: "https://djjd.bnuzh.edu.cn/twdt/photo.htm",
        rawPublishedAt: "2025-12-31",
        rawChannel: "\u56fe\u6587\u52a8\u6001",
        rawSummary: undefined,
        extras: {
          requestId: "twdt",
        },
      },
    ]);

    await expect(xddjjdgjztwParser.parse(gzdtPage)).resolves.toEqual([
      {
        sourceId: "8f2630501d2b497b93b895da12d0903a",
        rawId: "work.htm",
        rawTitle: "Work Update",
        rawUrl: "https://djjd.bnuzh.edu.cn/gzdt/work.htm",
        rawPublishedAt: "2025-12-01",
        rawChannel: "\u5de5\u4f5c\u52a8\u6001",
        rawSummary: undefined,
        extras: {
          requestId: "gzdt",
        },
      },
    ]);

    await expect(xddjjdgjztwParser.parse(tzggPage)).resolves.toEqual([
      {
        sourceId: "8f2630501d2b497b93b895da12d0903a",
        rawId: "notice.htm",
        rawTitle: "Notice One",
        rawUrl: "https://djjd.bnuzh.edu.cn/tzgg/notice.htm",
        rawPublishedAt: "2023-05-05",
        rawChannel: "\u901a\u77e5\u516c\u544a",
        rawSummary: undefined,
        extras: {
          requestId: "tzgg",
        },
      },
      {
        sourceId: "8f2630501d2b497b93b895da12d0903a",
        rawId: "notice-2.htm",
        rawTitle: "Notice Two",
        rawUrl: "https://djjd.bnuzh.edu.cn/tzgg/notice-2.htm",
        rawPublishedAt: "2023-04-03",
        rawChannel: "\u901a\u77e5\u516c\u544a",
        rawSummary: undefined,
        extras: {
          requestId: "tzgg",
        },
      },
    ]);
  });

  it("parses study-material entries and keeps html filenames intact", async () => {
    const page = createPage({
      requestId: "xxzl",
      requestUrl: "https://djjd.bnuzh.edu.cn/xxzl/index.htm",
      finalUrl: "https://djjd.bnuzh.edu.cn/xxzl/index.htm",
      bodyText: `
        <body>
          <div class="container my-3 my-lg-5">
            <ul class="channel-article-list list-unstyled">
              <li><a class="link" href="charter.htm"><div class="title">Party Charter</div><div class="date">2022\u5e7410\u670822\u65e5</div></a></li>
              <li><a class="link" href="report-2022.html"><div class="title">Investigation Report</div><div class="date">2023\u5e7405\u670831\u65e5</div></a></li>
            </ul>
          </div>
        </body>
      `,
    });

    await expect(xddjjdgjztwParser.parse(page)).resolves.toEqual([
      {
        sourceId: "8f2630501d2b497b93b895da12d0903a",
        rawId: "charter.htm",
        rawTitle: "Party Charter",
        rawUrl: "https://djjd.bnuzh.edu.cn/xxzl/charter.htm",
        rawPublishedAt: "2022-10-22",
        rawChannel: "\u5b66\u4e60\u8d44\u6599",
        rawSummary: undefined,
        extras: {
          requestId: "xxzl",
        },
      },
      {
        sourceId: "8f2630501d2b497b93b895da12d0903a",
        rawId: "report-2022.html",
        rawTitle: "Investigation Report",
        rawUrl: "https://djjd.bnuzh.edu.cn/xxzl/report-2022.html",
        rawPublishedAt: "2023-05-31",
        rawChannel: "\u5b66\u4e60\u8d44\u6599",
        rawSummary: undefined,
        extras: {
          requestId: "xxzl",
        },
      },
    ]);
  });
});
