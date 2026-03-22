// @vitest-environment jsdom

import { describe, expect, it } from "vitest";

import type { RawPage } from "@bnuz-feed/contracts";

import { lxsyFetchTargets, lxsyParser } from "./lxsy";

function createPage(
  overrides: Partial<RawPage> & Pick<RawPage, "requestId" | "requestUrl" | "finalUrl" | "bodyText">,
): RawPage {
  return {
    sourceId: "def14df8e70e46fbb1bc9e78159aa9fb",
    fetchedAt: "2026-03-21T00:00:00.000Z",
    ...overrides,
  };
}

describe("lxsyParser", () => {
  it("declares the public list pages we can scrape from the site", () => {
    expect(lxsyFetchTargets).toEqual([
      {
        id: "xwdt",
        url: "https://lixing.bnuzh.edu.cn/xwdt/index1.htm",
        channel: "新闻动态",
      },
      {
        id: "tzgg",
        url: "https://lixing.bnuzh.edu.cn/tzgg/index.htm",
        channel: "通知公告",
      },
      {
        id: "hdyg",
        url: "https://lixing.bnuzh.edu.cn/hdyg/index.htm",
        channel: "活动预告",
      },
      {
        id: "lxgy",
        url: "https://lixing.bnuzh.edu.cn/lxgy/index.htm",
        channel: "砺行光影",
      },
      {
        id: "xssw/btjs",
        url: "https://lixing.bnuzh.edu.cn/xssw/btjs/index.htm",
        channel: "班团建设",
      },
      {
        id: "xssw/xsdj",
        url: "https://lixing.bnuzh.edu.cn/xssw/xsdj/index.htm",
        channel: "学生党建",
      },
      {
        id: "xssw/txfc",
        url: "https://lixing.bnuzh.edu.cn/xssw/txfc/index.htm",
        channel: "团学风采",
      },
      {
        id: "xssw/xssq",
        url: "https://lixing.bnuzh.edu.cn/xssw/xssq/index.htm",
        channel: "学生社群",
      },
      {
        id: "xssw/xyfz",
        url: "https://lixing.bnuzh.edu.cn/xssw/xyfz/index.htm",
        channel: "学业发展",
      },
      {
        id: "xssw/xsjz",
        url: "https://lixing.bnuzh.edu.cn/xssw/xsjz/index.htm",
        channel: "学生奖助",
      },
      {
        id: "xssw/gfjy",
        url: "https://lixing.bnuzh.edu.cn/xssw/gfjy/index.htm",
        channel: "国防教育",
      },
      {
        id: "xssw/xkfw",
        url: "https://lixing.bnuzh.edu.cn/xssw/xkfw/index.htm",
        channel: "心康服务",
      },
      {
        id: "xssw/sjjl",
        url: "https://lixing.bnuzh.edu.cn/xssw/sjjl/index.htm",
        channel: "实践交流",
      },
      {
        id: "xssw/jyfw",
        url: "https://lixing.bnuzh.edu.cn/xssw/jyfw/index.htm",
        channel: "就业服务",
      },
      {
        id: "syfw/gzzd",
        url: "https://lixing.bnuzh.edu.cn/syfw/gzzd/index.htm",
        channel: "规章制度",
      },
      {
        id: "syfw/bszn",
        url: "https://lixing.bnuzh.edu.cn/syfw/bszn/index.htm",
        channel: "办事指南",
      },
      {
        id: "syfw/cyxz",
        url: "https://lixing.bnuzh.edu.cn/syfw/cyxz/index.htm",
        channel: "常用下载",
      },
    ]);
  });

  it("parses the news list, strips a leading date, and filters unrelated anchors", async () => {
    const page = createPage({
      requestId: "xwdt",
      requestUrl: "https://lixing.bnuzh.edu.cn/xwdt/index1.htm",
      finalUrl: "https://lixing.bnuzh.edu.cn/xwdt/index1.htm",
      bodyText: `
        <body>
          <header>
            <a href="https://www.bnu.edu.cn">学校官网</a>
          </header>
          <main>
            <a href="../xwdt/20251228001.htm">12 月 28 日 赛事回顾丨第三届师范生体育节乒乓球联赛圆满落幕</a>
            <a href="https://mp.weixin.qq.com/s/1VLiNinqPx_epEC1kzvj1g">12 月 30 日 “宿”造惊喜，“舍”放精彩丨宿舍文化节投票通道开启啦！</a>
            <a href="../tzgg/ignored.htm">12 月 31 日 这条来自其他栏目，不该进入新闻动态</a>
          </main>
        </body>
      `,
    });

    const records = await lxsyParser.parse(page);

    expect(records).toEqual([
      {
        sourceId: "def14df8e70e46fbb1bc9e78159aa9fb",
        rawId: "../xwdt/20251228001.htm",
        rawTitle: "赛事回顾丨第三届师范生体育节乒乓球联赛圆满落幕",
        rawUrl: "https://lixing.bnuzh.edu.cn/xwdt/20251228001.htm",
        rawPublishedAt: "12-28",
        rawChannel: "新闻动态",
        rawSummary: undefined,
        extras: {
          requestId: "xwdt",
        },
      },
      {
        sourceId: "def14df8e70e46fbb1bc9e78159aa9fb",
        rawId: "https://mp.weixin.qq.com/s/1VLiNinqPx_epEC1kzvj1g",
        rawTitle: "“宿”造惊喜，“舍”放精彩丨宿舍文化节投票通道开启啦！",
        rawUrl: "https://mp.weixin.qq.com/s/1VLiNinqPx_epEC1kzvj1g",
        rawPublishedAt: "12-30",
        rawChannel: "新闻动态",
        rawSummary: undefined,
        extras: {
          requestId: "xwdt",
        },
      },
    ]);
  });

  it("parses a category list with trailing dates and relative links", async () => {
    const page = createPage({
      requestId: "xssw/btjs",
      requestUrl: "https://lixing.bnuzh.edu.cn/xssw/btjs/index.htm",
      finalUrl: "https://lixing.bnuzh.edu.cn/xssw/btjs/index.htm",
      bodyText: `
        <body>
          <main>
            <a href="20241207001.htm">优秀班集体丨2024级英语2班：笃行筑梦绽芳华，担当砺行向未来 12-07</a>
            <a href="../btjs/20241206002.htm">班级风采丨赓续红色基因，传承师大之魂，2025级生物科学2班主题班会纪实 11-01</a>
            <a href="/xssw/xyfz/ignore.htm">学业发展相关内容，不属于班团建设</a>
          </main>
        </body>
      `,
    });

    const records = await lxsyParser.parse(page);

    expect(records).toEqual([
      {
        sourceId: "def14df8e70e46fbb1bc9e78159aa9fb",
        rawId: "20241207001.htm",
        rawTitle: "优秀班集体丨2024级英语2班：笃行筑梦绽芳华，担当砺行向未来",
        rawUrl: "https://lixing.bnuzh.edu.cn/xssw/btjs/20241207001.htm",
        rawPublishedAt: "12-07",
        rawChannel: "班团建设",
        rawSummary: undefined,
        extras: {
          requestId: "xssw/btjs",
        },
      },
      {
        sourceId: "def14df8e70e46fbb1bc9e78159aa9fb",
        rawId: "../btjs/20241206002.htm",
        rawTitle: "班级风采丨赓续红色基因，传承师大之魂，2025级生物科学2班主题班会纪实",
        rawUrl: "https://lixing.bnuzh.edu.cn/xssw/btjs/20241206002.htm",
        rawPublishedAt: "11-01",
        rawChannel: "班团建设",
        rawSummary: undefined,
        extras: {
          requestId: "xssw/btjs",
        },
      },
    ]);
  });

  it("parses the lxgy list as a first-class message channel", async () => {
    const page = createPage({
      requestId: "lxgy",
      requestUrl: "https://lixing.bnuzh.edu.cn/lxgy/index.htm",
      finalUrl: "https://lixing.bnuzh.edu.cn/lxgy/index.htm",
      bodyText: `
        <body>
          <main>
            <a href="https://mp.weixin.qq.com/s/Rdz6PposolZ3ha2P9Thk0g">10 月 20 日 军训特辑丨迷彩足迹，铸就成长之路</a>
            <a href="2d0bf36f30f04167ab9aef948be56f2f.htm">09 月 10 日 于吉红校长走访视察砺行书院</a>
            <a href="/sygk/syjj/index.htm">书院简介</a>
          </main>
        </body>
      `,
    });

    const records = await lxsyParser.parse(page);

    expect(records).toEqual([
      {
        sourceId: "def14df8e70e46fbb1bc9e78159aa9fb",
        rawId: "https://mp.weixin.qq.com/s/Rdz6PposolZ3ha2P9Thk0g",
        rawTitle: "军训特辑丨迷彩足迹，铸就成长之路",
        rawUrl: "https://mp.weixin.qq.com/s/Rdz6PposolZ3ha2P9Thk0g",
        rawPublishedAt: "10-20",
        rawChannel: "砺行光影",
        rawSummary: undefined,
        extras: {
          requestId: "lxgy",
        },
      },
      {
        sourceId: "def14df8e70e46fbb1bc9e78159aa9fb",
        rawId: "2d0bf36f30f04167ab9aef948be56f2f.htm",
        rawTitle: "于吉红校长走访视察砺行书院",
        rawUrl: "https://lixing.bnuzh.edu.cn/lxgy/2d0bf36f30f04167ab9aef948be56f2f.htm",
        rawPublishedAt: "09-10",
        rawChannel: "砺行光影",
        rawSummary: undefined,
        extras: {
          requestId: "lxgy",
        },
      },
    ]);
  });

  it("uses the configured channel name for the student aid list", async () => {
    const page = createPage({
      requestId: "xssw/xsjz",
      requestUrl: "https://lixing.bnuzh.edu.cn/xssw/xsjz/index.htm",
      finalUrl: "https://lixing.bnuzh.edu.cn/xssw/xsjz/index.htm",
      bodyText: `
        <body>
          <main>
            <a href="./531908786d3f4037b47dea26faa0acf5.htm">〖奖助〗关于办理2025-2026学年秋季学期永平自立贷学金的通知 10-14</a>
            <a href="https://www.bnu.edu.cn">学校官网</a>
          </main>
        </body>
      `,
    });

    const records = await lxsyParser.parse(page);
    const record = records[0];

    expect(record).toBeDefined();
    expect(record?.rawChannel).toBe("学生奖助");
    expect(record?.rawUrl).toBe("https://lixing.bnuzh.edu.cn/xssw/xsjz/531908786d3f4037b47dea26faa0acf5.htm");
  });

  it("parses service-area download lists with the configured channel", async () => {
    const page = createPage({
      requestId: "syfw/cyxz",
      requestUrl: "https://lixing.bnuzh.edu.cn/syfw/cyxz/index.htm",
      finalUrl: "https://lixing.bnuzh.edu.cn/syfw/cyxz/index.htm",
      bodyText: `
        <body>
          <main>
            <a href="adb0a437a7e24006874420f477b0309b.htm">北京师范大学2025-2026年第二学期校历 01-05</a>
            <a href="245f91d37f0b405b96c59628a5452af7.htm">砺行书院学生活动策划案（模板） 10-02</a>
          </main>
        </body>
      `,
    });

    const records = await lxsyParser.parse(page);

    expect(records).toEqual([
      {
        sourceId: "def14df8e70e46fbb1bc9e78159aa9fb",
        rawId: "adb0a437a7e24006874420f477b0309b.htm",
        rawTitle: "北京师范大学2025-2026年第二学期校历",
        rawUrl: "https://lixing.bnuzh.edu.cn/syfw/cyxz/adb0a437a7e24006874420f477b0309b.htm",
        rawPublishedAt: "01-05",
        rawChannel: "常用下载",
        rawSummary: undefined,
        extras: {
          requestId: "syfw/cyxz",
        },
      },
      {
        sourceId: "def14df8e70e46fbb1bc9e78159aa9fb",
        rawId: "245f91d37f0b405b96c59628a5452af7.htm",
        rawTitle: "砺行书院学生活动策划案（模板）",
        rawUrl: "https://lixing.bnuzh.edu.cn/syfw/cyxz/245f91d37f0b405b96c59628a5452af7.htm",
        rawPublishedAt: "10-02",
        rawChannel: "常用下载",
        rawSummary: undefined,
        extras: {
          requestId: "syfw/cyxz",
        },
      },
    ]);
  });
});
