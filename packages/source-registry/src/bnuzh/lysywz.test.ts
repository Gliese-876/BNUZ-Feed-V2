// @vitest-environment jsdom

import { describe, expect, it } from "vitest";

import type { RawPage } from "@bnuz-feed/contracts";

import { lysywzFetchTargets, lysywzParser } from "./lysywz";

function createPage(
  overrides: Partial<RawPage> & Pick<RawPage, "requestId" | "requestUrl" | "finalUrl" | "bodyText">,
): RawPage {
  return {
    sourceId: "cc95de40844b45e8b14870dbf3d358cd",
    fetchedAt: "2026-03-21T00:00:00.000Z",
    ...overrides,
  };
}

describe("lysywz parser", () => {
  it("declares the confirmed public message sources", () => {
    expect(lysywzFetchTargets).toEqual([
      { id: "zhyw", url: "https://leyu.bnuzh.edu.cn/zhyw/index.htm", channel: "乐育要闻" },
      { id: "tzgg", url: "https://leyu.bnuzh.edu.cn/tzgg/index.htm", channel: "通知公告" },
      { id: "hdyg", url: "https://leyu.bnuzh.edu.cn/hdyg/index.htm", channel: "活动预告" },
      { id: "lyxs", url: "https://leyu.bnuzh.edu.cn/yrts/lyxs/index.htm", channel: "乐育学社" },
      { id: "lxxs", url: "https://leyu.bnuzh.edu.cn/yrts/lxxs/index.htm", channel: "凌霄学社" },
      { id: "dxxs", url: "https://leyu.bnuzh.edu.cn/yrts/dxxs/index.htm", channel: "笃行学社" },
      { id: "lypp", url: "https://leyu.bnuzh.edu.cn/yrts/lypp/index.htm", channel: "乐育品牌" },
      { id: "dshd", url: "https://leyu.bnuzh.edu.cn/dshd/index.htm", channel: "导师有约" },
      { id: "lygs", url: "https://leyu.bnuzh.edu.cn/lygs/index.htm", channel: "乐育风采" },
      { id: "zbfc", url: "https://leyu.bnuzh.edu.cn/djyl/zbfc/index.htm", channel: "支部风采" },
      { id: "txfc", url: "https://leyu.bnuzh.edu.cn/txfc/txfc/index.htm", channel: "团学风采" },
      { id: "jyfw", url: "https://leyu.bnuzh.edu.cn/syyh/jyfw/index.htm", channel: "就业服务" },
      { id: "jysd", url: "https://leyu.bnuzh.edu.cn/syyh/jysd/index.htm", channel: "就业速递" },
      { id: "bszn", url: "https://leyu.bnuzh.edu.cn/fwzn/bszn/index.htm", channel: "办事指南" },
      { id: "fwgzzd", url: "https://leyu.bnuzh.edu.cn/fwzn/gzzd/index.htm", channel: "服务指南-规章制度" },
      { id: "xyhd", url: "https://leyu.bnuzh.edu.cn/xyzj/xyhd/index.htm", channel: "校友活动" },
      { id: "xyzx", url: "https://leyu.bnuzh.edu.cn/xyzj/xyzx/index.htm", channel: "校友资讯" },
    ]);
  });

  it("parses mixed article links, normalizes relative URLs and ignores date-less navigation links", async () => {
    const page = createPage({
      requestId: "zhyw",
      requestUrl: "https://leyu.bnuzh.edu.cn/zhyw/index.htm",
      finalUrl: "https://leyu.bnuzh.edu.cn/zhyw/index.htm",
      bodyText: `
        <body>
          <nav>
            <a href="index.htm">首页</a>
            <a href="../xyzj/xyhd/index.htm">校友活动</a>
          </nav>
          <ul class="article-list">
            <li>
              <a href="https://mp.weixin.qq.com/s/example-a">
                <span class="date">3月 20</span>
                <span class="title">国奖风采录丨数学与应用数学①：研数海探真知，秉师心育桃李</span>
              </a>
            </li>
            <li>
              <a href="2025/03/10/demo-b.htm">
                <span class="date">2025/03/10</span>
                <span class="title">乐育风采｜一起来听“十佳”之声，学习榜样的力量！</span>
              </a>
            </li>
          </ul>
        </body>
      `,
    });

    await expect(lysywzParser.parse(page)).resolves.toEqual([
      {
        sourceId: "cc95de40844b45e8b14870dbf3d358cd",
        rawId: "https://mp.weixin.qq.com/s/example-a",
        rawTitle: "国奖风采录丨数学与应用数学①：研数海探真知，秉师心育桃李",
        rawUrl: "https://mp.weixin.qq.com/s/example-a",
        rawPublishedAt: "03-20",
        rawChannel: "乐育要闻",
        rawSummary: undefined,
        extras: {
          requestId: "zhyw",
        },
      },
      {
        sourceId: "cc95de40844b45e8b14870dbf3d358cd",
        rawId: "2025/03/10/demo-b.htm",
        rawTitle: "乐育风采｜一起来听“十佳”之声，学习榜样的力量！",
        rawUrl: "https://leyu.bnuzh.edu.cn/zhyw/2025/03/10/demo-b.htm",
        rawPublishedAt: "2025-03-10",
        rawChannel: "乐育要闻",
        rawSummary: undefined,
        extras: {
          requestId: "zhyw",
        },
      },
    ]);
  });

  it("parses notice-style cards with summaries and month-day dates", async () => {
    const page = createPage({
      requestId: "tzgg",
      requestUrl: "https://leyu.bnuzh.edu.cn/tzgg/index.htm",
      finalUrl: "https://leyu.bnuzh.edu.cn/tzgg/index.htm",
      bodyText: `
        <body>
          <ul class="article-list">
            <li>
              <a href="../tzgg/34dde3cb9f094fc79020d22a21072d67.htm">
                <span class="date">11月 25日</span>
                <span class="title">乐育书院关于开展2026年北京师范大学“向未来”文化使者助学金评选工作的通知</span>
                <span class="summary">乐育书院各位同学： “向未来”文化使者助学金由张定元先生携家人捐资设立...</span>
              </a>
            </li>
            <li>
              <a href="index.htm">
                <span class="title">通知公告</span>
              </a>
            </li>
          </ul>
        </body>
      `,
    });

    await expect(lysywzParser.parse(page)).resolves.toEqual([
      {
        sourceId: "cc95de40844b45e8b14870dbf3d358cd",
        rawId: "../tzgg/34dde3cb9f094fc79020d22a21072d67.htm",
        rawTitle: "乐育书院关于开展2026年北京师范大学“向未来”文化使者助学金评选工作的通知",
        rawUrl: "https://leyu.bnuzh.edu.cn/tzgg/34dde3cb9f094fc79020d22a21072d67.htm",
        rawPublishedAt: "11-25",
        rawChannel: "通知公告",
        rawSummary: "乐育书院各位同学： “向未来”文化使者助学金由张定元先生携家人捐资设立...",
        extras: {
          requestId: "tzgg",
        },
      },
    ]);
  });

  it("allows whitelisted external student-service links under the service-guide section", async () => {
    const page = createPage({
      requestId: "fwgzzd",
      requestUrl: "https://leyu.bnuzh.edu.cn/fwzn/gzzd/index.htm",
      finalUrl: "https://leyu.bnuzh.edu.cn/fwzn/gzzd/index.htm",
      bodyText: `
        <body>
          <ul class="article-list">
            <li>
              <a href="https://nic.bnuzh.edu.cn/bzzn/xsfwzn/ac5f23c244b042ebb7f97e6d0da96c74.htm">
                <span class="date">2025/03/18</span>
                <span class="title">企业微信解绑及身份变更指南</span>
              </a>
            </li>
            <li>
              <a href="https://example.com/other-service.htm">
                <span class="date">2025/03/18</span>
                <span class="title">不在白名单内的服务入口</span>
              </a>
            </li>
          </ul>
        </body>
      `,
    });

    await expect(lysywzParser.parse(page)).resolves.toEqual([
      {
        sourceId: "cc95de40844b45e8b14870dbf3d358cd",
        rawId: "https://nic.bnuzh.edu.cn/bzzn/xsfwzn/ac5f23c244b042ebb7f97e6d0da96c74.htm",
        rawTitle: "企业微信解绑及身份变更指南",
        rawUrl: "https://nic.bnuzh.edu.cn/bzzn/xsfwzn/ac5f23c244b042ebb7f97e6d0da96c74.htm",
        rawPublishedAt: "2025-03-18",
        rawChannel: "服务指南-规章制度",
        rawSummary: undefined,
        extras: {
          requestId: "fwgzzd",
        },
      },
    ]);
  });
});
