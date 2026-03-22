// @vitest-environment jsdom

import { describe, expect, it } from "vitest";

import type { RawPage } from "@bnuz-feed/contracts";

import { bjsfdxetbwgFetchTargets, bjsfdxetbwgParser } from "./bjsfdxetbwg";

describe("bjsfdxetbwg parser", () => {
  it("exposes the five selected public targets", () => {
    expect(bjsfdxetbwgFetchTargets).toHaveLength(5);
    expect(bjsfdxetbwgFetchTargets.map((target) => target.id)).toEqual(["latest", "bgxw", "zcjd", "xydc", "hdhg"]);
  });

  it("extracts latest news items with resolved relative links and channel name", async () => {
    const page: RawPage = {
      sourceId: "1f38a8b49b964025b9b187440ba345d0",
      requestId: "latest",
      requestUrl: "https://childrensmuseum.bnuzh.edu.cn/zxdt/index.htm",
      finalUrl: "https://childrensmuseum.bnuzh.edu.cn/zxdt/index.htm",
      fetchedAt: "2026-03-21T00:00:00.000Z",
      bodyText: `
        <ul class="common-pic-article-list">
          <li>
            <a href="../xwdt/bgxw/2841b7afb5974ae7a2b3455dc52de4a5.htm" class="article">
              <div class="article-cover-box"></div>
              <div class="article-publish-time">2025-09-21</div>
              <div class="article-title">北师大与老牛基金会携手共推儿童博物馆建设</div>
              <div class="article-link">查看详情</div>
            </a>
          </li>
          <li>
            <a href="https://mp.weixin.qq.com/s/1VLiNinqPx_epEC1kzvj1g" class="article">
              <div class="article-cover-box"></div>
              <div class="article-publish-time">2025-09-21</div>
              <div class="article-title">BNU博物馆图鉴</div>
              <div class="article-link">查看详情</div>
            </a>
          </li>
        </ul>
      `,
    };

    const records = await bjsfdxetbwgParser.parse(page);

    expect(records).toEqual([
      {
        sourceId: "1f38a8b49b964025b9b187440ba345d0",
        rawId: "../xwdt/bgxw/2841b7afb5974ae7a2b3455dc52de4a5.htm",
        rawTitle: "北师大与老牛基金会携手共推儿童博物馆建设",
        rawUrl: "https://childrensmuseum.bnuzh.edu.cn/xwdt/bgxw/2841b7afb5974ae7a2b3455dc52de4a5.htm",
        rawPublishedAt: "2025-09-21",
        rawChannel: "最新动态",
        rawSummary: undefined,
        extras: {
          requestId: "latest",
        },
      },
      {
        sourceId: "1f38a8b49b964025b9b187440ba345d0",
        rawId: "https://mp.weixin.qq.com/s/1VLiNinqPx_epEC1kzvj1g",
        rawTitle: "BNU博物馆图鉴",
        rawUrl: "https://mp.weixin.qq.com/s/1VLiNinqPx_epEC1kzvj1g",
        rawPublishedAt: "2025-09-21",
        rawChannel: "最新动态",
        rawSummary: undefined,
        extras: {
          requestId: "latest",
        },
      },
    ]);
  });

  it("uses the configured channel for category pages", async () => {
    const page: RawPage = {
      sourceId: "1f38a8b49b964025b9b187440ba345d0",
      requestId: "bgxw",
      requestUrl: "https://childrensmuseum.bnuzh.edu.cn/xwdt/bgxw/index.htm",
      finalUrl: "https://childrensmuseum.bnuzh.edu.cn/xwdt/bgxw/index.htm",
      fetchedAt: "2026-03-21T00:00:00.000Z",
      bodyText: `
        <ul class="common-pic-article-list">
          <li>
            <a href="2841b7afb5974ae7a2b3455dc52de4a5.htm" class="article">
              <div class="article-publish-time">2025-09-21</div>
              <div class="article-title">北师大与老牛基金会携手共推儿童博物馆建设</div>
            </a>
          </li>
        </ul>
      `,
    };

    const records = await bjsfdxetbwgParser.parse(page);
    const record = records[0];

    expect(record).toBeDefined();
    expect(record?.rawChannel).toBe("本馆新闻");
    expect(record?.rawUrl).toBe("https://childrensmuseum.bnuzh.edu.cn/xwdt/bgxw/2841b7afb5974ae7a2b3455dc52de4a5.htm");
  });
});
