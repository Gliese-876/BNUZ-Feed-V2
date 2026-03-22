// @vitest-environment jsdom

import { describe, expect, it } from "vitest";

import type { RawPage } from "@bnuz-feed/contracts";

import { wxmhFetchTargets, wxmhParser } from "./wxmh";

function createPage(
  overrides: Partial<RawPage> & Pick<RawPage, "requestId" | "requestUrl" | "finalUrl" | "bodyText">,
): RawPage {
  return {
    sourceId: "c9f778e52e5f43808a1a89b836c6be4f",
    fetchedAt: "2026-03-21T00:00:00.000Z",
    ...overrides,
  };
}

describe("wxmhParser", () => {
  it("declares the public homepage target", () => {
    expect(wxmhFetchTargets).toEqual([
      {
        id: "index",
        url: "https://wx.bnuzh.edu.cn/",
        channel: "微信门户",
      },
    ]);
  });

  it("parses the homepage guide sections and resolves relative image URLs", async () => {
    const page = createPage({
      requestId: "index",
      requestUrl: "https://wx.bnuzh.edu.cn/",
      finalUrl: "https://wx.bnuzh.edu.cn/",
      bodyText: `
        <header>
          <div class="gp-container">
            <div class="logo">
              <img src="images/logo.png" alt="">
              <a class="logo1" href="https://www.bnuzh.edu.cn/"></a>
              <a class="logo2" href="index.htm"></a>
            </div>
          </div>
        </header>
        <div class="content">
          <div class="gp-container">
            <div class="index_01 article">
              <h2>一、北京师范大学珠海校区企业微信服务指南</h2>
              <p><img src="images/img1.png" alt=""></p>
              <span class="scroll_tip">向右滑动查看更多</span>
              <p><img src="images/img2.png" alt=""></p>
              <span class="scroll_tip">向右滑动查看更多</span>
              <h2>二、企业微信解绑及身份变更指南</h2>
              <p><img src="images/img3.png" alt=""></p>
              <span class="scroll_tip">向右滑动查看更多</span>
              <h2>三、企业微信号接受不到消息常见情况及解决方法</h2>
              <p><img src="images/img4.png" alt=""></p>
              <span class="scroll_tip">向右滑动查看更多</span>
              <p><img src="images/img5.png" alt=""></p>
              <span class="scroll_tip">向右滑动查看更多</span>
            </div>
          </div>
        </div>
      `,
    });

    const records = await wxmhParser.parse(page);

    expect(records).toEqual([
      {
        sourceId: "c9f778e52e5f43808a1a89b836c6be4f",
        rawId: "一、北京师范大学珠海校区企业微信服务指南",
        rawTitle: "一、北京师范大学珠海校区企业微信服务指南",
        rawUrl: "https://wx.bnuzh.edu.cn/",
        rawPublishedAt: undefined,
        rawChannel: "微信门户",
        rawSummary: "https://wx.bnuzh.edu.cn/images/img1.png | https://wx.bnuzh.edu.cn/images/img2.png",
        extras: {
          requestId: "index",
        },
      },
      {
        sourceId: "c9f778e52e5f43808a1a89b836c6be4f",
        rawId: "二、企业微信解绑及身份变更指南",
        rawTitle: "二、企业微信解绑及身份变更指南",
        rawUrl: "https://wx.bnuzh.edu.cn/",
        rawPublishedAt: undefined,
        rawChannel: "微信门户",
        rawSummary: "https://wx.bnuzh.edu.cn/images/img3.png",
        extras: {
          requestId: "index",
        },
      },
      {
        sourceId: "c9f778e52e5f43808a1a89b836c6be4f",
        rawId: "三、企业微信号接受不到消息常见情况及解决方法",
        rawTitle: "三、企业微信号接受不到消息常见情况及解决方法",
        rawUrl: "https://wx.bnuzh.edu.cn/",
        rawPublishedAt: undefined,
        rawChannel: "微信门户",
        rawSummary: "https://wx.bnuzh.edu.cn/images/img4.png | https://wx.bnuzh.edu.cn/images/img5.png",
        extras: {
          requestId: "index",
        },
      },
    ]);
  });
});
