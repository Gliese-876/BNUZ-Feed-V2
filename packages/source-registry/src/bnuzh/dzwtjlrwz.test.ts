// @vitest-environment jsdom

import { describe, expect, it } from "vitest";

import type { RawPage } from "@bnuz-feed/contracts";

import { dzwtjlrwzFetchTargets, dzwtjlrwzParser } from "./dzwtjlrwz";

function createPage(
  overrides: Partial<RawPage> & Pick<RawPage, "requestId" | "requestUrl" | "finalUrl" | "bodyText">,
): RawPage {
  return {
    sourceId: "31631a3717734412baa24e2d6706961f",
    fetchedAt: "2026-03-21T00:00:00.000Z",
    ...overrides,
  };
}

describe("dzwtjlrwzParser", () => {
  it("declares the confirmed public message sources", () => {
    expect(dzwtjlrwzFetchTargets).toEqual([
      { id: "zxdt", url: "https://ihap.bnuzh.edu.cn/zxdt/index.htm", channel: "\u6700\u65b0\u52a8\u6001" },
      { id: "dwtj", url: "https://ihap.bnuzh.edu.cn/kpjy/dwtj/index.htm", channel: "\u52a8\u7269\u56fe\u9274" },
      { id: "zwtj", url: "https://ihap.bnuzh.edu.cn/kpjy/zwtj/index.htm", channel: "\u690d\u7269\u56fe\u9274" },
      { id: "dtfb/lyl", url: "https://ihap.bnuzh.edu.cn/dtfb/lyl/index.htm", channel: "\u4e50\u80b2\u697c" },
      { id: "dtfb/hhy", url: "https://ihap.bnuzh.edu.cn/dtfb/hhy/index.htm", channel: "\u6d77\u534e\u82d1" },
      { id: "dtfb/hwl", url: "https://ihap.bnuzh.edu.cn/dtfb/hwl/index.htm", channel: "\u5f18\u6587\u697c" },
      { id: "dtfb/tsg", url: "https://ihap.bnuzh.edu.cn/dtfb/tsg/index.htm", channel: "\u56fe\u4e66\u9986" },
      { id: "dtfb/yhy2", url: "https://ihap.bnuzh.edu.cn/dtfb/yhy2/index.htm", channel: "\u7ca4\u534e\u82d1" },
    ]);
  });

  it("parses latest-news cards and ignores preview links", async () => {
    const page = createPage({
      requestId: "zxdt",
      requestUrl: "https://ihap.bnuzh.edu.cn/zxdt/index.htm",
      finalUrl: "https://ihap.bnuzh.edu.cn/zxdt/index.htm",
      bodyText: `
        <main>
          <section class="news">
            <a href="alpha.htm"><span class="title">Atlas Update</span><span class="summary">New species record</span></a>
            <a href="beta.htm"><span class="title">Campus Bird Note</span><span class="summary">Observation summary</span></a>
            <a href="index.htm">\u67e5\u770b\u66f4\u591a</a>
          </section>
        </main>
      `,
    });

    await expect(dzwtjlrwzParser.parse(page)).resolves.toEqual([
      {
        sourceId: "31631a3717734412baa24e2d6706961f",
        rawId: "alpha.htm",
        rawTitle: "Atlas Update",
        rawUrl: "https://ihap.bnuzh.edu.cn/zxdt/alpha.htm",
        rawPublishedAt: undefined,
        rawChannel: "\u6700\u65b0\u52a8\u6001",
        rawSummary: "New species record",
        extras: {
          requestId: "zxdt",
        },
      },
      {
        sourceId: "31631a3717734412baa24e2d6706961f",
        rawId: "beta.htm",
        rawTitle: "Campus Bird Note",
        rawUrl: "https://ihap.bnuzh.edu.cn/zxdt/beta.htm",
        rawPublishedAt: undefined,
        rawChannel: "\u6700\u65b0\u52a8\u6001",
        rawSummary: "Observation summary",
        extras: {
          requestId: "zxdt",
        },
      },
    ]);
  });

  it("parses animal and plant catalog cards, splitting titles from scientific names", async () => {
    const animalPage = createPage({
      requestId: "dwtj",
      requestUrl: "https://ihap.bnuzh.edu.cn/kpjy/dwtj/index.htm",
      finalUrl: "https://ihap.bnuzh.edu.cn/kpjy/dwtj/index.htm",
      bodyText: `
        <main>
          <a href="h/snake.htm">\u9ec4\u6591\u6e38\u86c7 Xenochrophis flavipunctatus \u4e86\u89e3\u8be6\u60c5</a>
          <a href="h/index.htm">H</a>
          <a href="index.htm">\u5168\u90e8</a>
        </main>
      `,
    });

    const plantPage = createPage({
      requestId: "zwtj",
      requestUrl: "https://ihap.bnuzh.edu.cn/kpjy/zwtj/index.htm",
      finalUrl: "https://ihap.bnuzh.edu.cn/kpjy/zwtj/index.htm",
      bodyText: `
        <main>
          <a href="m/tree.htm">\u7f8e\u4e3d\u5f02\u6728\u68c9 Ceiba speciosa \u4e86\u89e3\u8be6\u60c5</a>
          <a href="index.htm">\u5168\u90e8</a>
          <a href="a/index.htm">A</a>
        </main>
      `,
    });

    await expect(dzwtjlrwzParser.parse(animalPage)).resolves.toEqual([
      {
        sourceId: "31631a3717734412baa24e2d6706961f",
        rawId: "h/snake.htm",
        rawTitle: "\u9ec4\u6591\u6e38\u86c7",
        rawUrl: "https://ihap.bnuzh.edu.cn/kpjy/dwtj/h/snake.htm",
        rawPublishedAt: undefined,
        rawChannel: "\u52a8\u7269\u56fe\u9274",
        rawSummary: "Xenochrophis flavipunctatus",
        extras: {
          requestId: "dwtj",
        },
      },
    ]);

    await expect(dzwtjlrwzParser.parse(plantPage)).resolves.toEqual([
      {
        sourceId: "31631a3717734412baa24e2d6706961f",
        rawId: "m/tree.htm",
        rawTitle: "\u7f8e\u4e3d\u5f02\u6728\u68c9",
        rawUrl: "https://ihap.bnuzh.edu.cn/kpjy/zwtj/m/tree.htm",
        rawPublishedAt: undefined,
        rawChannel: "\u690d\u7269\u56fe\u9274",
        rawSummary: "Ceiba speciosa",
        extras: {
          requestId: "zwtj",
        },
      },
    ]);
  });

  it("parses non-empty map-distribution pages and keeps the location as the channel", async () => {
    const page = createPage({
      requestId: "dtfb/hwl",
      requestUrl: "https://ihap.bnuzh.edu.cn/dtfb/hwl/index.htm",
      finalUrl: "https://ihap.bnuzh.edu.cn/dtfb/hwl/index.htm",
      bodyText: `
        <main>
          <a href="../../kpjy/zwtj/d/alpha.htm">\u5927\u82b1\u7d2b\u8587 \u4e86\u89e3\u8be6\u60c5</a>
          <a href="../../kpjy/zwtj/f/beta.htm">\u6728\u68c9 Bombax ceiba \u4e86\u89e3\u8be6\u60c5</a>
          <a href="index.htm">\u8fd4\u56de</a>
        </main>
      `,
    });

    await expect(dzwtjlrwzParser.parse(page)).resolves.toEqual([
      {
        sourceId: "31631a3717734412baa24e2d6706961f",
        rawId: "../../kpjy/zwtj/d/alpha.htm",
        rawTitle: "\u5927\u82b1\u7d2b\u8587",
        rawUrl: "https://ihap.bnuzh.edu.cn/kpjy/zwtj/d/alpha.htm",
        rawPublishedAt: undefined,
        rawChannel: "\u5f18\u6587\u697c",
        rawSummary: undefined,
        extras: {
          requestId: "dtfb/hwl",
        },
      },
      {
        sourceId: "31631a3717734412baa24e2d6706961f",
        rawId: "../../kpjy/zwtj/f/beta.htm",
        rawTitle: "\u6728\u68c9",
        rawUrl: "https://ihap.bnuzh.edu.cn/kpjy/zwtj/f/beta.htm",
        rawPublishedAt: undefined,
        rawChannel: "\u5f18\u6587\u697c",
        rawSummary: "Bombax ceiba",
        extras: {
          requestId: "dtfb/hwl",
        },
      },
    ]);
  });
});
