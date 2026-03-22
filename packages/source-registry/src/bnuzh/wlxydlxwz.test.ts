// @vitest-environment jsdom

import { describe, expect, it } from "vitest";

import type { RawPage } from "@bnuz-feed/contracts";

import { wlxydlxwzFetchTargets, wlxydlxwzParser } from "./wlxydlxwz";

function createPage(
  overrides: Partial<RawPage> & Pick<RawPage, "requestId" | "requestUrl" | "finalUrl" | "bodyText">,
): RawPage {
  return {
    sourceId: "947b53536cf848cb93793fed0af208dc",
    fetchedAt: "2026-03-21T00:00:00.000Z",
    ...overrides,
  };
}

describe("wlxydlxwzParser", () => {
  it("declares the confirmed public list pages and excludes static intro pages", () => {
    expect(wlxydlxwzFetchTargets).toEqual([
      { id: "xwzx", url: "https://geo.bnuzh.edu.cn/xwzx/index.htm", channel: "\u65b0\u95fb\u4e2d\u5fc3" },
      { id: "dljg", url: "https://geo.bnuzh.edu.cn/kpzl/dljg/index.htm", channel: "\u5730\u7406\u666f\u89c2" },
      { id: "dlkp", url: "https://geo.bnuzh.edu.cn/kpzl/dlkp/index.htm", channel: "\u5730\u7406\u79d1\u666e" },
      { id: "kysj", url: "https://geo.bnuzh.edu.cn/xsyd/kysj/index.htm", channel: "\u79d1\u7814\u5b9e\u8df5" },
      { id: "jysj", url: "https://geo.bnuzh.edu.cn/xsyd/jysj/index.htm", channel: "\u6559\u80b2\u5b9e\u8df5" },
      { id: "xsfc", url: "https://geo.bnuzh.edu.cn/xsyd/xsfc/index.htm", channel: "\u5b66\u751f\u98ce\u91c7" },
      { id: "xsst", url: "https://geo.bnuzh.edu.cn/xsyd/xsst/index.htm", channel: "\u5b66\u751f\u793e\u56e2" },
      { id: "wjxz", url: "https://geo.bnuzh.edu.cn/cyxz/wjxz/index.htm", channel: "\u6587\u4ef6\u4e0b\u8f7d" },
      { id: "sxsy", url: "https://geo.bnuzh.edu.cn/syzx/jxzy/index.htm", channel: "\u5b9e\u4e60\u5b9e\u9a8c" },
    ]);
  });

  it("parses news-center list entries with summaries and dates", async () => {
    const page = createPage({
      requestId: "xwzx",
      requestUrl: "https://geo.bnuzh.edu.cn/xwzx/index.htm",
      finalUrl: "https://geo.bnuzh.edu.cn/xwzx/index.htm",
      bodyText: `
        <body>
          <ul class="channel-article-list">
            <li class="channel-article-item">
              <a class="channel-article" href="lecture.htm">
                <div class="title">Lecture Review</div>
                <div class="summary">Public geography lecture recap</div>
                <div class="time">2025/06/24</div>
              </a>
            </li>
            <li class="channel-article-item">
              <a class="channel-article" href="../xwzx/paper.htm">
                <div class="title">Research Paper Award</div>
                <div class="summary">Students published a joint paper</div>
                <div class="time">2026/01/22</div>
              </a>
            </li>
          </ul>
        </body>
      `,
    });

    await expect(wlxydlxwzParser.parse(page)).resolves.toEqual([
      {
        sourceId: "947b53536cf848cb93793fed0af208dc",
        rawId: "lecture.htm",
        rawTitle: "Lecture Review",
        rawUrl: "https://geo.bnuzh.edu.cn/xwzx/lecture.htm",
        rawPublishedAt: "2025/06/24",
        rawChannel: "\u65b0\u95fb\u4e2d\u5fc3",
        rawSummary: "Public geography lecture recap",
        extras: {
          requestId: "xwzx",
        },
      },
      {
        sourceId: "947b53536cf848cb93793fed0af208dc",
        rawId: "../xwzx/paper.htm",
        rawTitle: "Research Paper Award",
        rawUrl: "https://geo.bnuzh.edu.cn/xwzx/paper.htm",
        rawPublishedAt: "2026/01/22",
        rawChannel: "\u65b0\u95fb\u4e2d\u5fc3",
        rawSummary: "Students published a joint paper",
        extras: {
          requestId: "xwzx",
        },
      },
    ]);
  });

  it("parses download, student-style, and practice lists with absolute URL resolution", async () => {
    const studentPage = createPage({
      requestId: "xsfc",
      requestUrl: "https://geo.bnuzh.edu.cn/xsyd/xsfc/index.htm",
      finalUrl: "https://geo.bnuzh.edu.cn/xsyd/xsfc/index.htm",
      bodyText: `
        <body>
          <ul class="channel-article-list">
            <li class="channel-article-item">
              <a class="channel-article" href="student.htm">
                <div class="title">Student Showcase</div>
                <div class="summary">Fieldwork and competition highlights</div>
                <div class="time">2025/05/18</div>
              </a>
            </li>
          </ul>
        </body>
      `,
    });

    const downloadsPage = createPage({
      requestId: "wjxz",
      requestUrl: "https://geo.bnuzh.edu.cn/cyxz/wjxz/index.htm",
      finalUrl: "https://geo.bnuzh.edu.cn/cyxz/wjxz/index.htm",
      bodyText: `
        <body>
          <ul class="channel-article-list">
            <li class="channel-article-item">
              <a class="channel-article" href="guide.htm">
                <div class="title">Teaching Guide</div>
                <div class="summary">Preview and download materials</div>
                <div class="time">2025/01/30</div>
              </a>
            </li>
          </ul>
        </body>
      `,
    });

    const practicePage = createPage({
      requestId: "sxsy",
      requestUrl: "https://geo.bnuzh.edu.cn/syzx/jxzy/index.htm",
      finalUrl: "https://geo.bnuzh.edu.cn/syzx/jxzy/index.htm",
      bodyText: `
        <body>
          <ul class="channel-article-list">
            <li class="channel-article-item">
              <a class="channel-article" href="/syzx/jxzy/drone.htm">
                <div class="title">Drone Basics</div>
                <div class="summary">Mini drone field operation notes</div>
                <div class="time">2025/04/15</div>
              </a>
            </li>
          </ul>
        </body>
      `,
    });

    await expect(wlxydlxwzParser.parse(studentPage)).resolves.toEqual([
      {
        sourceId: "947b53536cf848cb93793fed0af208dc",
        rawId: "student.htm",
        rawTitle: "Student Showcase",
        rawUrl: "https://geo.bnuzh.edu.cn/xsyd/xsfc/student.htm",
        rawPublishedAt: "2025/05/18",
        rawChannel: "\u5b66\u751f\u98ce\u91c7",
        rawSummary: "Fieldwork and competition highlights",
        extras: {
          requestId: "xsfc",
        },
      },
    ]);

    await expect(wlxydlxwzParser.parse(downloadsPage)).resolves.toEqual([
      {
        sourceId: "947b53536cf848cb93793fed0af208dc",
        rawId: "guide.htm",
        rawTitle: "Teaching Guide",
        rawUrl: "https://geo.bnuzh.edu.cn/cyxz/wjxz/guide.htm",
        rawPublishedAt: "2025/01/30",
        rawChannel: "\u6587\u4ef6\u4e0b\u8f7d",
        rawSummary: "Preview and download materials",
        extras: {
          requestId: "wjxz",
        },
      },
    ]);

    await expect(wlxydlxwzParser.parse(practicePage)).resolves.toEqual([
      {
        sourceId: "947b53536cf848cb93793fed0af208dc",
        rawId: "/syzx/jxzy/drone.htm",
        rawTitle: "Drone Basics",
        rawUrl: "https://geo.bnuzh.edu.cn/syzx/jxzy/drone.htm",
        rawPublishedAt: "2025/04/15",
        rawChannel: "\u5b9e\u4e60\u5b9e\u9a8c",
        rawSummary: "Mini drone field operation notes",
        extras: {
          requestId: "sxsy",
        },
      },
    ]);
  });
});
