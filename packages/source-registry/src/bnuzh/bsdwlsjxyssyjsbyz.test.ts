// @vitest-environment jsdom

import { describe, expect, it } from "vitest";

import type { RawPage } from "@bnuz-feed/contracts";

import { bsdwlsjxyssyjsbyzParser } from "./bsdwlsjxyssyjsbyz";

describe("bsdwlsjxyssyjsbyzParser", () => {
  it("extracts project-directory items from a section page", async () => {
    const page: RawPage = {
      sourceId: "d0cbeecb90a14a169dfe9cdb2c97c270",
      requestId: "gszj",
      requestUrl: "https://sfd-degreeshow.bnuzh.edu.cn/gszj/index.htm",
      finalUrl: "https://sfd-degreeshow.bnuzh.edu.cn/gszj/index.htm",
      fetchedAt: "2026-03-21T00:00:00.000Z",
      bodyText: `
        <html>
          <body>
            <ul>
              <li class="enter-item" data-index="0">
                <a href="zym/index.htm">
                  <span class="name">
                    <span>钟远明</span>
                    <span class="en">Zhong Yuanming</span>
                  </span>
                  <img class="avatar" src="../gszj/zym/avatar.jpg" alt="">
                </a>
              </li>
              <li class="enter-item" data-index="1">
                <a href="zx/index.htm">
                  <span class="name">
                    <span>赵旭</span>
                    <span class="en">Zhao Xu</span>
                  </span>
                  <img class="avatar" src="../gszj/zx/avatar.jpg" alt="">
                </a>
              </li>
            </ul>
          </body>
        </html>
      `,
    };

    const records = await bsdwlsjxyssyjsbyzParser.parse(page);

    expect(records).toEqual([
      {
        sourceId: "d0cbeecb90a14a169dfe9cdb2c97c270",
        rawId: "zym/index.htm",
        rawTitle: "钟远明",
        rawUrl: "https://sfd-degreeshow.bnuzh.edu.cn/gszj/zym/index.htm",
        rawPublishedAt: undefined,
        rawChannel: "共生之间",
        rawSummary: "Zhong Yuanming",
        extras: {
          requestId: "gszj",
        },
      },
      {
        sourceId: "d0cbeecb90a14a169dfe9cdb2c97c270",
        rawId: "zx/index.htm",
        rawTitle: "赵旭",
        rawUrl: "https://sfd-degreeshow.bnuzh.edu.cn/gszj/zx/index.htm",
        rawPublishedAt: undefined,
        rawChannel: "共生之间",
        rawSummary: "Zhao Xu",
        extras: {
          requestId: "gszj",
        },
      },
    ]);
  });

  it("supports another section target with the same list structure", async () => {
    const page: RawPage = {
      sourceId: "d0cbeecb90a14a169dfe9cdb2c97c270",
      requestId: "gzzj",
      requestUrl: "https://sfd-degreeshow.bnuzh.edu.cn/gzzj/index.htm",
      finalUrl: "https://sfd-degreeshow.bnuzh.edu.cn/gzzj/index.htm",
      fetchedAt: "2026-03-21T00:00:00.000Z",
      bodyText: `
        <html>
          <body>
            <ul>
              <li class="enter-item" data-index="0">
                <a href="zyn/index.htm">
                  <span class="name">
                    <span>周云诺</span>
                    <span class="en">Zhou Yunnuo</span>
                  </span>
                </a>
              </li>
            </ul>
          </body>
        </html>
      `,
    };

    const records = await bsdwlsjxyssyjsbyzParser.parse(page);

    expect(records).toEqual([
      {
        sourceId: "d0cbeecb90a14a169dfe9cdb2c97c270",
        rawId: "zyn/index.htm",
        rawTitle: "周云诺",
        rawUrl: "https://sfd-degreeshow.bnuzh.edu.cn/gzzj/zyn/index.htm",
        rawPublishedAt: undefined,
        rawChannel: "感知之间",
        rawSummary: "Zhou Yunnuo",
        extras: {
          requestId: "gzzj",
        },
      },
    ]);
  });
});
