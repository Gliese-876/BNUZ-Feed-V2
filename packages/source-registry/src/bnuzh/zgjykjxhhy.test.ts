// @vitest-environment jsdom

import { describe, expect, it } from "vitest";

import type { RawPage } from "@bnuz-feed/contracts";

import { zgjykjxhhyFetchTargets, zgjykjxhhyParser } from "./zgjykjxhhy";

function createPage(
  overrides: Partial<RawPage> & Pick<RawPage, "requestId" | "requestUrl" | "finalUrl" | "bodyText">,
): RawPage {
  return {
    sourceId: "20a9c6f38cf246239bc912fec4be08b6",
    fetchedAt: "2026-03-21T00:00:00.000Z",
    ...overrides,
  };
}

describe("zgjykjxhhyParser", () => {
  it("declares the expected public targets", () => {
    expect(zgjykjxhhyFetchTargets).toEqual([
      {
        id: "news",
        url: "https://easc.bnuzh.edu.cn/",
        channel: "新闻通知",
      },
      {
        id: "schedule",
        url: "https://easc.bnuzh.edu.cn/",
        channel: "会议安排",
      },
    ]);
  });

  it("prefers the dated homepage news list over the carousel preview", async () => {
    const page = createPage({
      requestId: "news",
      requestUrl: "https://easc.bnuzh.edu.cn/",
      finalUrl: "https://easc.bnuzh.edu.cn/",
      bodyText: `
        <main>
          <ul class="news-list px-0 mb-0">
            <li>
              <a href="xwtz/f1d3729fd68d477cb7659c02fa04d0ca.htm">会议温馨提示</a>
              <span>4月14</span>
            </li>
            <li>
              <a href="xwtz/8d78f7053a24440ab4e2396284f2813e.htm">关于举办第八届第二次理事会会议和学术年会的通知</a>
              <span>3月16</span>
            </li>
          </ul>
          <div id="news-swiper">
            <div class="swiper-wrapper">
              <div class="swiper-slide swiper-slide-duplicate">
                <a class="thumb-new" href="xwtz/dup.htm">
                  <div class="title">Duplicate Slide</div>
                </a>
              </div>
              <div class="swiper-slide">
                <a class="thumb-new" href="xwtz/8d78f7053a24440ab4e2396284f2813e.htm">
                  <div class="title">关于举办第八届第二次理事会会议 暨中国教育会计学会学术年会（2023）的通知</div>
                </a>
              </div>
              <div class="swiper-slide swiper-slide-duplicate">
                <a class="thumb-new" href="xwtz/dup-2.htm">
                  <div class="title">Duplicate Slide 2</div>
                </a>
              </div>
            </div>
          </div>
        </main>
      `,
    });

    const records = await zgjykjxhhyParser.parse(page);

    expect(records).toEqual([
      {
        sourceId: "20a9c6f38cf246239bc912fec4be08b6",
        rawId: "xwtz/f1d3729fd68d477cb7659c02fa04d0ca.htm",
        rawTitle: "会议温馨提示",
        rawUrl: "https://easc.bnuzh.edu.cn/xwtz/f1d3729fd68d477cb7659c02fa04d0ca.htm",
        rawPublishedAt: "04-14",
        rawChannel: "新闻通知",
        rawSummary: undefined,
        extras: {
          requestId: "news",
        },
      },
      {
        sourceId: "20a9c6f38cf246239bc912fec4be08b6",
        rawId: "xwtz/8d78f7053a24440ab4e2396284f2813e.htm",
        rawTitle: "关于举办第八届第二次理事会会议和学术年会的通知",
        rawUrl: "https://easc.bnuzh.edu.cn/xwtz/8d78f7053a24440ab4e2396284f2813e.htm",
        rawPublishedAt: "03-16",
        rawChannel: "新闻通知",
        rawSummary: undefined,
        extras: {
          requestId: "news",
        },
      },
    ]);
  });

  it("parses the meeting schedule cards with relative-link normalization and time fields", async () => {
    const page = createPage({
      requestId: "schedule",
      requestUrl: "https://easc.bnuzh.edu.cn/",
      finalUrl: "https://easc.bnuzh.edu.cn/",
      bodyText: `
        <main>
          <div id="cms-schedule-list" class="d-none">
            <div class="schedule" url="../hyap/5368c72dc2dd4a64999941fa73257fb6.htm" img="images/2023-03/ce9995439f0a456898a8ba7efe252600.png" title="中国教育会计学会第八届理事会第四次常务理事会" day="2023-04-16" time="16:20"></div>
            <div class="schedule" url="hyap/b4875f8363e4466595ac7b4257284593.htm" img="images/2023-03/54bf9a96178c44a9a95e11029f56ed12.png" title="中国教育会计学会第八届第二次理事会" day="2023-04-16" time="17:00"></div>
            <div class="schedule" url="hyap/7170957754c741f9bef71f2999874d5b.htm" img="images/2023-03/634481aab07e4d9c9d088d1ef270f5e6.png" title="中国教育会计学会学术年会（2023）" day="2023-04-17" time="全天"></div>
          </div>
        </main>
      `,
    });

    const records = await zgjykjxhhyParser.parse(page);

    expect(records).toEqual([
      {
        sourceId: "20a9c6f38cf246239bc912fec4be08b6",
        rawId: "../hyap/5368c72dc2dd4a64999941fa73257fb6.htm",
        rawTitle: "中国教育会计学会第八届理事会第四次常务理事会",
        rawUrl: "https://easc.bnuzh.edu.cn/hyap/5368c72dc2dd4a64999941fa73257fb6.htm",
        rawPublishedAt: "2023-04-16",
        rawChannel: "会议安排",
        rawSummary: "16:20",
        extras: {
          requestId: "schedule",
        },
      },
      {
        sourceId: "20a9c6f38cf246239bc912fec4be08b6",
        rawId: "hyap/b4875f8363e4466595ac7b4257284593.htm",
        rawTitle: "中国教育会计学会第八届第二次理事会",
        rawUrl: "https://easc.bnuzh.edu.cn/hyap/b4875f8363e4466595ac7b4257284593.htm",
        rawPublishedAt: "2023-04-16",
        rawChannel: "会议安排",
        rawSummary: "17:00",
        extras: {
          requestId: "schedule",
        },
      },
      {
        sourceId: "20a9c6f38cf246239bc912fec4be08b6",
        rawId: "hyap/7170957754c741f9bef71f2999874d5b.htm",
        rawTitle: "中国教育会计学会学术年会（2023）",
        rawUrl: "https://easc.bnuzh.edu.cn/hyap/7170957754c741f9bef71f2999874d5b.htm",
        rawPublishedAt: "2023-04-17",
        rawChannel: "会议安排",
        rawSummary: "全天",
        extras: {
          requestId: "schedule",
        },
      },
    ]);
  });
});
