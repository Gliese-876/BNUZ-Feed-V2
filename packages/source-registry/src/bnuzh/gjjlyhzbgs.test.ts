// @vitest-environment jsdom

import { describe, expect, it } from "vitest";

import type { RawPage } from "@bnuz-feed/contracts";

import { gjjlyhzbgsFetchTargets, gjjlyhzbgsParser } from "./gjjlyhzbgs";

function createPage(
  overrides: Partial<RawPage> & Pick<RawPage, "requestId" | "requestUrl" | "finalUrl" | "bodyText">,
): RawPage {
  return {
    sourceId: "f8b68f1c9a724254a4feb6285bb8cef3",
    fetchedAt: "2026-03-21T00:00:00.000Z",
    ...overrides,
  };
}

describe("gjjlyhzbgs parser", () => {
  it("declares the confirmed public message sources and paginated targets", () => {
    expect(gjjlyhzbgsFetchTargets).toEqual([
      { id: "xwsd", url: "https://io.bnuzh.edu.cn/xwsd/index.htm", channel: "新闻速递" },
      { id: "xwsd/index1", url: "https://io.bnuzh.edu.cn/xwsd/index1.htm", channel: "新闻速递" },
      { id: "xwsd/index2", url: "https://io.bnuzh.edu.cn/xwsd/index2.htm", channel: "新闻速递" },
      { id: "xwsd/index3", url: "https://io.bnuzh.edu.cn/xwsd/index3.htm", channel: "新闻速递" },
      { id: "xwsd/index4", url: "https://io.bnuzh.edu.cn/xwsd/index4.htm", channel: "新闻速递" },
      { id: "xxgg", url: "https://io.bnuzh.edu.cn/xxgg/index.htm", channel: "信息公告" },
      { id: "xxgg/index1", url: "https://io.bnuzh.edu.cn/xxgg/index1.htm", channel: "信息公告" },
      { id: "xxgg/index2", url: "https://io.bnuzh.edu.cn/xxgg/index2.htm", channel: "信息公告" },
      { id: "xxgg/index3", url: "https://io.bnuzh.edu.cn/xxgg/index3.htm", channel: "信息公告" },
      { id: "xxgg/index4", url: "https://io.bnuzh.edu.cn/xxgg/index4.htm", channel: "信息公告" },
      { id: "Newsletter", url: "https://io.bnuzh.edu.cn/Newsletter/index.htm", channel: "BNU Zhuhai Newsletter" },
      { id: "gzdt", url: "https://io.bnuzh.edu.cn/ztbd/gzdt/index.htm", channel: "工作动态" },
      {
        id: "bjsfdxzhxqgjwhj",
        url: "https://io.bnuzh.edu.cn/ztbd/bjsfdxzhxqgjwhj/index.htm",
        channel: "北京师范大学珠海校区国际文化节",
      },
      { id: "zxzg", url: "https://io.bnuzh.edu.cn/ztbd/zxzg/index.htm", channel: "知行中国" },
      { id: "gjxzxskdwq", url: "https://io.bnuzh.edu.cn/ztbd/gjxzxskdwq/index.htm", channel: "国际学者学生看大湾区" },
      { id: "jsxsqqsyj", url: "https://io.bnuzh.edu.cn/ztbd/jsxsqqsyj/index.htm", channel: "京师学生全球视野节" },
      {
        id: "gzzgsghxnyjysyydsclsh",
        url: "https://io.bnuzh.edu.cn/ztbd/gzzgsghxnyjysyydsclsh/index.htm",
        channel: "感知中国 山谷回响 南有佳音 双语云端诗词朗诵会",
      },
      { id: "yfksj", url: "https://io.bnuzh.edu.cn/ztbd/yfksj/index.htm", channel: "扬帆看世界" },
      { id: "zxtz", url: "https://io.bnuzh.edu.cn/jsfw/ywrs/zxtz/index.htm", channel: "最新通知" },
      {
        id: "gjhy/zxtzgjhy",
        url: "https://io.bnuzh.edu.cn/gjhy/zxtzgjhy/index.htm",
        channel: "国际会议/最新通知",
      },
      { id: "YESxm", url: "https://io.bnuzh.edu.cn/jsfw/xmsb/YESxm/index.htm", channel: "YES项目" },
    ]);
  });

  it("parses dated cards, normalizes relative URLs and preserves the configured channel", async () => {
    const page = createPage({
      requestId: "xwsd",
      requestUrl: "https://io.bnuzh.edu.cn/xwsd/index.htm",
      finalUrl: "https://io.bnuzh.edu.cn/xwsd/index.htm",
      bodyText: `
        <body>
          <ul class="article-list">
            <li>
              <a href="../index.htm">首页</a>
            </li>
            <li>
              <a href="2b23814ce63b4d048774311fabe9be03.htm">
                <img alt="" />
                <span class="title">BNU Zhuhai Bimonthly Newsletter Issue 5</span>
                <span class="summary">March roundup for international exchange news</span>
                <span class="date">2026-03-19</span>
              </a>
            </li>
            <li>
              <a href="https://www.bnuzh.edu.cn/zhxw/afc8e1a9b10146f2b35a7b53a29bb3f5.htm">
                <img alt="" />
                <span class="date">2026-01-19</span>
                <span class="title">北京师范大学珠海校区2025年度广东省政府来粤留学生奖学金颁奖仪式举行</span>
                <span class="summary">1月13日，北京师范大学珠海校区举行2025年度广东省政府来粤留学生奖学金颁奖仪式。</span>
              </a>
            </li>
          </ul>
        </body>
      `,
    });

    await expect(gjjlyhzbgsParser.parse(page)).resolves.toEqual([
      {
        sourceId: "f8b68f1c9a724254a4feb6285bb8cef3",
        rawId: "2b23814ce63b4d048774311fabe9be03.htm",
        rawTitle: "BNU Zhuhai Bimonthly Newsletter Issue 5",
        rawUrl: "https://io.bnuzh.edu.cn/xwsd/2b23814ce63b4d048774311fabe9be03.htm",
        rawPublishedAt: "2026-03-19",
        rawChannel: "新闻速递",
        rawSummary: "March roundup for international exchange news",
        extras: {
          requestId: "xwsd",
        },
      },
      {
        sourceId: "f8b68f1c9a724254a4feb6285bb8cef3",
        rawId: "https://www.bnuzh.edu.cn/zhxw/afc8e1a9b10146f2b35a7b53a29bb3f5.htm",
        rawTitle: "北京师范大学珠海校区2025年度广东省政府来粤留学生奖学金颁奖仪式举行",
        rawUrl: "https://www.bnuzh.edu.cn/zhxw/afc8e1a9b10146f2b35a7b53a29bb3f5.htm",
        rawPublishedAt: "2026-01-19",
        rawChannel: "新闻速递",
        rawSummary: "1月13日，北京师范大学珠海校区举行2025年度广东省政府来粤留学生奖学金颁奖仪式。",
        extras: {
          requestId: "xwsd",
        },
      },
    ]);
  });

  it("parses dated content cards rendered outside list items", async () => {
    const page = createPage({
      requestId: "xwsd",
      requestUrl: "https://io.bnuzh.edu.cn/xwsd/index.htm",
      finalUrl: "https://io.bnuzh.edu.cn/xwsd/index.htm",
      bodyText: `
        <body>
          <div class="content">
            <a href="2b23814ce63b4d048774311fabe9be03.htm">
              <div class="left">
                <div class="img"><img alt="" /></div>
              </div>
              <div class="right">
                <div class="title fs18">BNU Zhuhai Bimonthly Newsletter Issue 5</div>
                <div class="info fs14">March roundup for international exchange news</div>
                <div class="time fs14">2026-03-19</div>
              </div>
            </a>
          </div>
        </body>
      `,
    });

    await expect(gjjlyhzbgsParser.parse(page)).resolves.toEqual([
      {
        sourceId: "f8b68f1c9a724254a4feb6285bb8cef3",
        rawId: "2b23814ce63b4d048774311fabe9be03.htm",
        rawTitle: "BNU Zhuhai Bimonthly Newsletter Issue 5",
        rawUrl: "https://io.bnuzh.edu.cn/xwsd/2b23814ce63b4d048774311fabe9be03.htm",
        rawPublishedAt: "2026-03-19",
        rawChannel: "新闻速递",
        rawSummary: "March roundup for international exchange news",
        extras: {
          requestId: "xwsd",
        },
      },
    ]);
  });

  it("parses issue entries without publication dates", async () => {
    const page = createPage({
      requestId: "Newsletter",
      requestUrl: "https://io.bnuzh.edu.cn/Newsletter/index.htm",
      finalUrl: "https://io.bnuzh.edu.cn/Newsletter/index.htm",
      bodyText: `
        <body>
          <ul class="article-list">
            <li>
              <a href="9530162b684942c8a58f09902e3321a9.htm">
                <img alt="" />
                <span class="title">BNU Zhuhai Newsletter Issue 14</span>
              </a>
            </li>
            <li>
              <a href="a4563b9e0afa4d2e9e1b3c6be0475bd7.htm">
                <img alt="" />
                <span class="title">BNU Zhuhai Newsletter Issue 13</span>
              </a>
            </li>
            <li>
              <a href="index.htm">Newsletter</a>
            </li>
          </ul>
        </body>
      `,
    });

    await expect(gjjlyhzbgsParser.parse(page)).resolves.toEqual([
      {
        sourceId: "f8b68f1c9a724254a4feb6285bb8cef3",
        rawId: "9530162b684942c8a58f09902e3321a9.htm",
        rawTitle: "BNU Zhuhai Newsletter Issue 14",
        rawUrl: "https://io.bnuzh.edu.cn/Newsletter/9530162b684942c8a58f09902e3321a9.htm",
        rawPublishedAt: undefined,
        rawChannel: "BNU Zhuhai Newsletter",
        rawSummary: undefined,
        extras: {
          requestId: "Newsletter",
        },
      },
      {
        sourceId: "f8b68f1c9a724254a4feb6285bb8cef3",
        rawId: "a4563b9e0afa4d2e9e1b3c6be0475bd7.htm",
        rawTitle: "BNU Zhuhai Newsletter Issue 13",
        rawUrl: "https://io.bnuzh.edu.cn/Newsletter/a4563b9e0afa4d2e9e1b3c6be0475bd7.htm",
        rawPublishedAt: undefined,
        rawChannel: "BNU Zhuhai Newsletter",
        rawSummary: undefined,
        extras: {
          requestId: "Newsletter",
        },
      },
    ]);
  });

  it("parses plain attachment notices without fabricating dates", async () => {
    const page = createPage({
      requestId: "gjhy/zxtzgjhy",
      requestUrl: "https://io.bnuzh.edu.cn/gjhy/zxtzgjhy/index.htm",
      finalUrl: "https://io.bnuzh.edu.cn/gjhy/zxtzgjhy/index.htm",
      bodyText: `
        <body>
          <p><a href="../../docs/2024-04/e758c715a4d24951bca82ab6f61d1e09.pdf">关于做好2024年国际会议预报和管理工作的通知</a></p>
          <p><a href="index.htm">返回列表</a></p>
        </body>
      `,
    });

    await expect(gjjlyhzbgsParser.parse(page)).resolves.toEqual([
      {
        sourceId: "f8b68f1c9a724254a4feb6285bb8cef3",
        rawId: "../../docs/2024-04/e758c715a4d24951bca82ab6f61d1e09.pdf",
        rawTitle: "关于做好2024年国际会议预报和管理工作的通知",
        rawUrl: "https://io.bnuzh.edu.cn/docs/2024-04/e758c715a4d24951bca82ab6f61d1e09.pdf",
        rawPublishedAt: undefined,
        rawChannel: "国际会议/最新通知",
        rawSummary: undefined,
        extras: {
          requestId: "gjhy/zxtzgjhy",
        },
      },
    ]);
  });
});
