// @vitest-environment jsdom

import { describe, expect, it } from "vitest";

import type { RawPage } from "@bnuz-feed/contracts";

import { ConfiguredHtmlListParser } from "./configuredHtmlListParser";

describe("ConfiguredHtmlListParser", () => {
  it("extracts normalized records from a configured HTML list", async () => {
    const parser = new ConfiguredHtmlListParser({
      parserKey: "bnuzh/example",
      targets: [
        {
          requestId: "news",
          itemSelector: ".news li",
          channel: "新闻中心",
          title: ".title",
          url: { selector: "a", attr: "href" },
          publishedAt: ".date",
          summary: ".summary",
          rawId: { selector: "a", attr: "data-id" },
        },
      ],
    });

    const page: RawPage = {
      sourceId: "example",
      requestId: "news",
      requestUrl: "https://example.bnuzh.edu.cn/news/index.htm",
      finalUrl: "https://example.bnuzh.edu.cn/news/index.htm",
      fetchedAt: "2026-03-21T00:00:00.000Z",
      bodyText: `
        <ul class="news">
          <li>
            <a href="items/a.htm" data-id="a-1">
              <span class="title">
                第一条新闻
              </span>
            </a>
            <span class="date">2026-03-20</span>
            <p class="summary"> 摘要 文本 </p>
          </li>
        </ul>
      `,
      channel: "默认频道",
    };

    const records = await parser.parse(page);

    expect(records).toEqual([
      {
        sourceId: "example",
        rawId: "a-1",
        rawTitle: "第一条新闻",
        rawUrl: "https://example.bnuzh.edu.cn/news/items/a.htm",
        rawPublishedAt: "2026-03-20",
        rawChannel: "新闻中心",
        rawSummary: "摘要 文本",
        extras: {
          requestId: "news",
        },
      },
    ]);
  });
});
