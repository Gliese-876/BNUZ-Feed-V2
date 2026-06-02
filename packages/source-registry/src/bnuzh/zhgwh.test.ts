// @vitest-environment jsdom

import { describe, expect, it } from "vitest";

import type { RawPage } from "@bnuz-feed/contracts";

import { zhgwhFetchTargets, zhgwhParser } from "./zhgwh";

function createPage(
  overrides: Partial<RawPage> & Pick<RawPage, "requestId" | "requestUrl" | "finalUrl" | "bodyText">,
): RawPage {
  return {
    sourceId: "cededbda72044b06bea8893d2c43c8c7",
    fetchedAt: "2026-06-02T00:00:00.000Z",
    ...overrides,
  };
}

describe("zhgwh parser", () => {
  it("declares the comprehensive guide source", () => {
    expect(zhgwhFetchTargets).toEqual([
      {
        id: "zhzn",
        url: "https://zhb.bnu.edu.cn/zhzn/index.htm",
        channel: "综合指南",
      },
    ]);
  });

  it("parses comprehensive guide list items", async () => {
    const page = createPage({
      requestId: "zhzn",
      requestUrl: "https://zhb.bnu.edu.cn/zhzn/index.htm",
      finalUrl: "https://zhb.bnu.edu.cn/zhzn/index.htm",
      bodyText: `
        <body>
          <ul class="listconrl">
            <li>
              <span class="listconrls"></span>
              <a href="ea648b622c2449d8895173afbb3733e8.htm" class="listconrla">
                北京师范大学珠海校区关于领导接待日安排的通知（2026年6月）
              </a>
              <div class="item-bottom03 item-bottom02">
                <span class="news-dates">2026-05-27</span>
              </div>
            </li>
            <li>
              <span class="listconrls"></span>
              <a href="b6854aeabd0b41a6b38f1067e02c3d1d.htm" class="listconrla">
                管委会办公室转发通知申请
              </a>
              <div class="item-bottom03 item-bottom02">
                <span class="news-dates">2025-10-30</span>
              </div>
            </li>
          </ul>
        </body>
      `,
    });

    await expect(zhgwhParser.parse(page)).resolves.toEqual([
      {
        sourceId: "cededbda72044b06bea8893d2c43c8c7",
        rawId: "ea648b622c2449d8895173afbb3733e8.htm",
        rawTitle: "北京师范大学珠海校区关于领导接待日安排的通知（2026年6月）",
        rawUrl: "https://zhb.bnu.edu.cn/zhzn/ea648b622c2449d8895173afbb3733e8.htm",
        rawPublishedAt: "2026-05-27",
        rawChannel: "综合指南",
        rawSummary: undefined,
        extras: {
          requestId: "zhzn",
        },
      },
      {
        sourceId: "cededbda72044b06bea8893d2c43c8c7",
        rawId: "b6854aeabd0b41a6b38f1067e02c3d1d.htm",
        rawTitle: "管委会办公室转发通知申请",
        rawUrl: "https://zhb.bnu.edu.cn/zhzn/b6854aeabd0b41a6b38f1067e02c3d1d.htm",
        rawPublishedAt: "2025-10-30",
        rawChannel: "综合指南",
        rawSummary: undefined,
        extras: {
          requestId: "zhzn",
        },
      },
    ]);
  });
});
