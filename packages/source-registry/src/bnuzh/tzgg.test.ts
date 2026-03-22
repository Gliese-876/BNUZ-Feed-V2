// @vitest-environment jsdom

import { describe, expect, it } from "vitest";

import type { RawPage } from "@bnuz-feed/contracts";

import { tzggFetchTargets, tzggParser } from "./tzgg";

describe("tzgg parser", () => {
  it("declares the expected fetch target", () => {
    expect(tzggFetchTargets).toEqual([
      {
        id: "sdyp",
        url: "https://notice.bnuzh.edu.cn/sdyp/index.htm",
        channel: "师大云盘",
      },
    ]);
  });

  it("extracts notice entries from the public list page", async () => {
    const page: RawPage = {
      sourceId: "87fb9d8daa5d4b4ab7c9f5efe8dfd5cc",
      requestId: "sdyp",
      requestUrl: "https://notice.bnuzh.edu.cn/sdyp/index.htm",
      finalUrl: "https://notice.bnuzh.edu.cn/sdyp/index.htm",
      fetchedAt: "2026-03-21T00:00:00.000Z",
      bodyText: `
        <!DOCTYPE html>
        <html lang="zh-CN">
          <head>
            <meta charset="UTF-8" />
            <title>师大云盘 - 通知公告</title>
          </head>
          <body>
            <div class="common-article-list-box">
              <h3 class="channel-name mb-3">师大云盘通知公告</h3>
              <ul class="common-article-list list-unstyled mb-0">
                <li>
                  <a class="item" href="b27c3213e8e4404bb8d04e60996b0407.htm">
                    <span class="title">《升级公告》</span>
                    <span class="time">2025-06-10</span>
                  </a>
                </li>
              </ul>
            </div>
          </body>
        </html>
      `,
    };

    const records = await tzggParser.parse(page);

    expect(records).toEqual([
      {
        sourceId: "87fb9d8daa5d4b4ab7c9f5efe8dfd5cc",
        rawTitle: "《升级公告》",
        rawUrl: "https://notice.bnuzh.edu.cn/sdyp/b27c3213e8e4404bb8d04e60996b0407.htm",
        rawPublishedAt: "2025-06-10",
        rawChannel: "师大云盘",
        rawSummary: undefined,
        extras: {
          requestId: "sdyp",
        },
      },
    ]);
  });
});
