// @vitest-environment jsdom

import { describe, expect, it } from "vitest";

import type { RawPage } from "@bnuz-feed/contracts";

import { tsgFetchTargets, tsgParser } from "./tsg";

function createPage(
  overrides: Partial<RawPage> & Pick<RawPage, "requestId" | "requestUrl" | "finalUrl" | "bodyText">,
): RawPage {
  return {
    sourceId: "55cf70db9df5483eb0a88ff3cf3eab54",
    fetchedAt: "2026-03-21T00:00:00.000Z",
    ...overrides,
  };
}

describe("tsgParser", () => {
  it("declares the expected public library targets", () => {
    expect(tsgFetchTargets).toEqual([
      {
        id: "zxxx",
        url: "https://library.bnuzh.edu.cn/zxxx/index.htm",
        channel: "最新消息",
      },
      {
        id: "zydt",
        url: "https://library.bnuzh.edu.cn/zy/zydt/index.htm",
        channel: "资源动态",
      },
      {
        id: "tpxw",
        url: "https://library.bnuzh.edu.cn/tpxw/index.htm",
        channel: "图片新闻",
      },
      {
        id: "xssd",
        url: "https://library.bnuzh.edu.cn/xssd/index.htm",
        channel: "新书速睇",
      },
      {
        id: "dttc",
        url: "https://library.bnuzh.edu.cn/dttc/index.htm",
        channel: "大套特藏",
      },
      {
        id: "pxjz",
        url: "https://library.bnuzh.edu.cn/pxjz/index.htm",
        channel: "培训讲座",
      },
    ]);
  });

  it("parses latest-news entries", async () => {
    const page = createPage({
      requestId: "zxxx",
      requestUrl: "https://library.bnuzh.edu.cn/zxxx/index.htm",
      finalUrl: "https://library.bnuzh.edu.cn/zxxx/index.htm",
      bodyText: `
        <main>
          <div class="common-page-layout-main">
            <ul>
              <li>
                <a class="item" href="notice-a.htm">
                  <span class="title">Library Notice A</span>
                  <span class="time">2026-03-13</span>
                </a>
              </li>
              <li>
                <a class="item" href="notice-b.htm">
                  <span class="title">Library Notice B</span>
                  <span class="time">2026-03-02</span>
                </a>
              </li>
            </ul>
          </div>
        </main>
      `,
    });

    const records = await tsgParser.parse(page);

    expect(records).toEqual([
      {
        sourceId: "55cf70db9df5483eb0a88ff3cf3eab54",
        rawId: "notice-a.htm",
        rawTitle: "Library Notice A",
        rawUrl: "https://library.bnuzh.edu.cn/zxxx/notice-a.htm",
        rawPublishedAt: "2026-03-13",
        rawChannel: "最新消息",
        rawSummary: undefined,
        extras: {
          requestId: "zxxx",
        },
      },
      {
        sourceId: "55cf70db9df5483eb0a88ff3cf3eab54",
        rawId: "notice-b.htm",
        rawTitle: "Library Notice B",
        rawUrl: "https://library.bnuzh.edu.cn/zxxx/notice-b.htm",
        rawPublishedAt: "2026-03-02",
        rawChannel: "最新消息",
        rawSummary: undefined,
        extras: {
          requestId: "zxxx",
        },
      },
    ]);
  });

  it("parses picture-news entries used by the homepage carousel", async () => {
    const page = createPage({
      requestId: "tpxw",
      requestUrl: "https://library.bnuzh.edu.cn/tpxw/index.htm",
      finalUrl: "https://library.bnuzh.edu.cn/tpxw/index.htm",
      bodyText: `
        <main>
          <ul>
            <li>
              <a class="item" href="../zxxx/featured-a.htm">
                <span class="title">Featured Library Story A</span>
                <span class="time">2026-01-21</span>
              </a>
            </li>
            <li>
              <a class="item" href="featured-b.htm">
                <span class="title">Featured Library Story B</span>
                <span class="time">2025-12-08</span>
              </a>
            </li>
          </ul>
        </main>
      `,
    });

    const records = await tsgParser.parse(page);

    expect(records).toEqual([
      {
        sourceId: "55cf70db9df5483eb0a88ff3cf3eab54",
        rawId: "../zxxx/featured-a.htm",
        rawTitle: "Featured Library Story A",
        rawUrl: "https://library.bnuzh.edu.cn/zxxx/featured-a.htm",
        rawPublishedAt: "2026-01-21",
        rawChannel: "图片新闻",
        rawSummary: undefined,
        extras: {
          requestId: "tpxw",
        },
      },
      {
        sourceId: "55cf70db9df5483eb0a88ff3cf3eab54",
        rawId: "featured-b.htm",
        rawTitle: "Featured Library Story B",
        rawUrl: "https://library.bnuzh.edu.cn/tpxw/featured-b.htm",
        rawPublishedAt: "2025-12-08",
        rawChannel: "图片新闻",
        rawSummary: undefined,
        extras: {
          requestId: "tpxw",
        },
      },
    ]);
  });

  it("parses resource updates with the same list shape", async () => {
    const page = createPage({
      requestId: "zydt",
      requestUrl: "https://library.bnuzh.edu.cn/zy/zydt/index.htm",
      finalUrl: "https://library.bnuzh.edu.cn/zy/zydt/index.htm",
      bodyText: `
        <main>
          <div class="common-page-layout-main">
            <ul>
              <li>
                <a class="item" href="resource-a.htm">
                  <span class="title">Resource Update A</span>
                  <span class="time">2026-03-18</span>
                </a>
              </li>
            </ul>
          </div>
        </main>
      `,
    });

    const records = await tsgParser.parse(page);

    expect(records).toEqual([
      {
        sourceId: "55cf70db9df5483eb0a88ff3cf3eab54",
        rawId: "resource-a.htm",
        rawTitle: "Resource Update A",
        rawUrl: "https://library.bnuzh.edu.cn/zy/zydt/resource-a.htm",
        rawPublishedAt: "2026-03-18",
        rawChannel: "资源动态",
        rawSummary: undefined,
        extras: {
          requestId: "zydt",
        },
      },
    ]);
  });

  it("parses new-book entries used by the homepage showcase", async () => {
    const page = createPage({
      requestId: "xssd",
      requestUrl: "https://library.bnuzh.edu.cn/xssd/index.htm",
      finalUrl: "https://library.bnuzh.edu.cn/xssd/index.htm",
      bodyText: `
        <main>
          <ul>
            <li>
              <a class="item" href="book-a.htm">
                <span class="title">Book A</span>
                <span class="time">2026-03-05</span>
              </a>
            </li>
            <li>
              <a class="item" href="book-b.htm">
                <span class="title">Book B</span>
                <span class="time">2026-03-04</span>
              </a>
            </li>
          </ul>
        </main>
      `,
    });

    const records = await tsgParser.parse(page);

    expect(records).toEqual([
      {
        sourceId: "55cf70db9df5483eb0a88ff3cf3eab54",
        rawId: "book-a.htm",
        rawTitle: "Book A",
        rawUrl: "https://library.bnuzh.edu.cn/xssd/book-a.htm",
        rawPublishedAt: "2026-03-05",
        rawChannel: "新书速睇",
        rawSummary: undefined,
        extras: {
          requestId: "xssd",
        },
      },
      {
        sourceId: "55cf70db9df5483eb0a88ff3cf3eab54",
        rawId: "book-b.htm",
        rawTitle: "Book B",
        rawUrl: "https://library.bnuzh.edu.cn/xssd/book-b.htm",
        rawPublishedAt: "2026-03-04",
        rawChannel: "新书速睇",
        rawSummary: undefined,
        extras: {
          requestId: "xssd",
        },
      },
    ]);
  });

  it("parses featured-collection entries from the dedicated archive list", async () => {
    const page = createPage({
      requestId: "dttc",
      requestUrl: "https://library.bnuzh.edu.cn/dttc/index.htm",
      finalUrl: "https://library.bnuzh.edu.cn/dttc/index.htm",
      bodyText: `
        <main>
          <ul>
            <li>
              <a class="item" href="7ed55a2482e142d189694604d3e30827.htm">
                <span class="title">《&lt;芥子园画传&gt;经典传世本集成 》</span>
                <span class="time">2025-05-15</span>
              </a>
            </li>
          </ul>
        </main>
      `,
    });

    const records = await tsgParser.parse(page);

    expect(records).toEqual([
      {
        sourceId: "55cf70db9df5483eb0a88ff3cf3eab54",
        rawId: "7ed55a2482e142d189694604d3e30827.htm",
        rawTitle: "《<芥子园画传>经典传世本集成 》",
        rawUrl: "https://library.bnuzh.edu.cn/dttc/7ed55a2482e142d189694604d3e30827.htm",
        rawPublishedAt: "2025-05-15",
        rawChannel: "大套特藏",
        rawSummary: undefined,
        extras: {
          requestId: "dttc",
        },
      },
    ]);
  });
});
