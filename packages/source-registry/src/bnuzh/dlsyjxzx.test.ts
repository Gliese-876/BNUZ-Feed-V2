// @vitest-environment jsdom

import { describe, expect, it } from "vitest";

import type { RawPage } from "@bnuz-feed/contracts";

import { dlsyjxzxFetchTargets, dlsyjxzxParser } from "./dlsyjxzx";

describe("dlsyjxzx parser", () => {
  it("declares the expected fetch targets", () => {
    expect(dlsyjxzxFetchTargets.map((target) => target.id)).toEqual([
      "xwzx",
      "sjhd",
      "xsqy",
      "kpzl",
      "cgzs",
      "xkjs",
      "cxcy",
    ]);
  });

  it("extracts news-center entries from the standard list layout", async () => {
    const page: RawPage = {
      sourceId: "f1dfc3dc45e84156b470f7b860ea9956",
      requestId: "xwzx",
      requestUrl: "https://sczx.bnuzh.edu.cn/dlsyjxzx/xwzx/index.htm",
      finalUrl: "https://sczx.bnuzh.edu.cn/dlsyjxzx/xwzx/index.htm",
      fetchedAt: "2026-03-21T00:00:00.000Z",
      bodyText: `
        <div class="page-list12">
          <ul class="block-list gp-avg-sm-3 gpLiMarginB gpAvgList gp-avg-md-1">
            <li>
              <a target="_self" class="gpTextArea" href="6ee253395ad64b3292519ef80c15f3ce.htm">
                <strong class="list-date2 gpArticleDate">2025.11.19</strong>
                <h3 class="gp-f16 gpArticleTitle">学术成果|广东海陆交互带人地耦合系统野外科学观测研究站杨晓帆教授团队在微塑料调控红树林土壤碳循环中取得系列进展</h3>
              </a>
            </li>
          </ul>
        </div>
      `,
    };

    const records = await dlsyjxzxParser.parse(page);

    expect(records).toEqual([
      {
        sourceId: "f1dfc3dc45e84156b470f7b860ea9956",
        rawTitle:
          "学术成果|广东海陆交互带人地耦合系统野外科学观测研究站杨晓帆教授团队在微塑料调控红树林土壤碳循环中取得系列进展",
        rawUrl: "https://sczx.bnuzh.edu.cn/dlsyjxzx/xwzx/6ee253395ad64b3292519ef80c15f3ce.htm",
        rawPublishedAt: "2025.11.19",
        rawChannel: "新闻中心",
        rawSummary: undefined,
        extras: {
          requestId: "xwzx",
        },
      },
    ]);
  });

  it("extracts showcase entries from the carousel layout", async () => {
    const page: RawPage = {
      sourceId: "f1dfc3dc45e84156b470f7b860ea9956",
      requestId: "cgzs",
      requestUrl: "https://sczx.bnuzh.edu.cn/dlsyjxzx/index.htm",
      finalUrl: "https://sczx.bnuzh.edu.cn/dlsyjxzx/index.htm",
      fetchedAt: "2026-03-21T00:00:00.000Z",
      bodyText: `
        <div class="carousel57">
          <div class="slick-images2 gpCarousel">
            <div class="slick-slider">
              <a href="cgzs/9ec2c7656d8b48099fa6dfe736b091a6.htm" target="" class="gpTextArea">
                <span class="gp-img-responsive gpImgSize slick-img">
                  <img src="../images/2025-11/24e3fc22eb0645bfada6290eda663780.png">
                </span>
                <div class="info slick-txt">
                  <div class="gp-f16 date gpArticleDate">Nov 19, 2025</div>
                  <div class="gp-f16 title gpArticleTitle">学术论文</div>
                </div>
              </a>
            </div>
          </div>
        </div>
      `,
    };

    const records = await dlsyjxzxParser.parse(page);

    expect(records).toEqual([
      {
        sourceId: "f1dfc3dc45e84156b470f7b860ea9956",
        rawId: undefined,
        rawTitle: "学术论文",
        rawUrl: "https://sczx.bnuzh.edu.cn/dlsyjxzx/cgzs/9ec2c7656d8b48099fa6dfe736b091a6.htm",
        rawPublishedAt: "Nov 19, 2025",
        rawChannel: "成果展示",
        rawSummary: undefined,
        extras: {
          requestId: "cgzs",
        },
      },
    ]);
  });

  it("extracts practice-innovation entries from the standard list layout", async () => {
    const page: RawPage = {
      sourceId: "f1dfc3dc45e84156b470f7b860ea9956",
      requestId: "xkjs",
      requestUrl: "https://sczx.bnuzh.edu.cn/dlsyjxzx/sjcx/xkjs/index.htm",
      finalUrl: "https://sczx.bnuzh.edu.cn/dlsyjxzx/sjcx/xkjs/index.htm",
      fetchedAt: "2026-03-21T00:00:00.000Z",
      bodyText: `
        <div class="page-list12">
          <ul class="block-list gp-avg-sm-3 gpLiMarginB gpAvgList gp-avg-md-1">
            <li>
              <a target="_self" class="gpTextArea" href="9c14ecf7145e4d93a25e8fb498bfe2e4.htm">
                <strong class="list-date2 gpArticleDate">2025-11-19</strong>
                <h3 class="gp-f16 gpArticleTitle">学科竞赛</h3>
              </a>
            </li>
          </ul>
        </div>
      `,
    };

    const records = await dlsyjxzxParser.parse(page);

    expect(records).toEqual([
      {
        sourceId: "f1dfc3dc45e84156b470f7b860ea9956",
        rawTitle: "学科竞赛",
        rawUrl: "https://sczx.bnuzh.edu.cn/dlsyjxzx/sjcx/xkjs/9c14ecf7145e4d93a25e8fb498bfe2e4.htm",
        rawPublishedAt: "2025-11-19",
        rawChannel: "学科竞赛",
        rawSummary: undefined,
        extras: {
          requestId: "xkjs",
        },
      },
    ]);
  });
});
