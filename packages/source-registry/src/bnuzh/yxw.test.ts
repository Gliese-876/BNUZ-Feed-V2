// @vitest-environment jsdom

import { describe, expect, it } from "vitest";

import type { RawPage } from "@bnuz-feed/contracts";

import { yxwFetchTargets, yxwParser } from "./yxw";

function createPage(
  overrides: Partial<RawPage> & Pick<RawPage, "requestId" | "requestUrl" | "finalUrl" | "bodyText">,
): RawPage {
  return {
    sourceId: "c5ba1fc8bc32462d9299d79a8d0d0ee1",
    fetchedAt: "2026-03-21T00:00:00.000Z",
    ...overrides,
  };
}

describe("yxw", () => {
  it("declares the confirmed welcome site message sources and paginated targets", () => {
    expect(yxwFetchTargets).toEqual([
      { id: "yxkx/index", url: "https://welcome.bnuzh.edu.cn/yxkx/index.htm", channel: "迎新快讯" },
      { id: "yxkx/index1", url: "https://welcome.bnuzh.edu.cn/yxkx/index1.htm", channel: "迎新快讯" },
      { id: "yxzy/index", url: "https://welcome.bnuzh.edu.cn/yxzy/index.htm", channel: "迎新指引" },
      { id: "xzbsd/index", url: "https://welcome.bnuzh.edu.cn/xzbsd/index.htm", channel: "学在北师大" },
      { id: "zzbsd/index", url: "https://welcome.bnuzh.edu.cn/zzbsd/index.htm", channel: "住在北师大" },
      { id: "lzbsd/index", url: "https://welcome.bnuzh.edu.cn/lzbsd/index.blk.htm", channel: "乐在北师大" },
    ]);
  });

  it("parses dated list entries and normalizes relative article links", async () => {
    const page = createPage({
      requestId: "yxkx/index",
      requestUrl: "https://welcome.bnuzh.edu.cn/yxkx/index.htm",
      finalUrl: "https://welcome.bnuzh.edu.cn/yxkx/index.htm",
      bodyText: `
        <body>
          <article>
            <div class="main-lf-con rt">
              <div class="subPage">
                <div class="listShow">
                  <ul>
                    <li>
                      <div>
                        <span class="rightDate">
                          <span class="date">28</span>
                          <span class="year">2025-07</span>
                        </span>
                        <span class="artTxt">
                          <a href="130449baa1ae4385acd66051265685e2.htm">【入学须知】北京师范大学珠海校区2025级本科交流学习新生入学指南</a>
                        </span>
                      </div>
                    </li>
                    <li>
                      <div>
                        <span class="rightDate">
                          <span class="date">05</span>
                          <span class="year">2025-09</span>
                        </span>
                        <span class="artTxt">
                          <a href="../yxkx/d662a7786d114d5abdfbfce0c3caa300.htm">【通知公告】关于开展珠海校区2025-2026学年家庭经济困难学生认定...</a>
                        </span>
                      </div>
                    </li>
                    <li>
                      <a href="index.htm">上一页</a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </article>
        </body>
      `,
    });

    await expect(yxwParser.parse(page)).resolves.toEqual([
      {
        sourceId: "c5ba1fc8bc32462d9299d79a8d0d0ee1",
        rawId: "130449baa1ae4385acd66051265685e2.htm",
        rawTitle: "【入学须知】北京师范大学珠海校区2025级本科交流学习新生入学指南",
        rawUrl: "https://welcome.bnuzh.edu.cn/yxkx/130449baa1ae4385acd66051265685e2.htm",
        rawPublishedAt: "2025-07-28",
        rawChannel: "迎新快讯",
        rawSummary: undefined,
        extras: {
          requestId: "yxkx/index",
        },
      },
      {
        sourceId: "c5ba1fc8bc32462d9299d79a8d0d0ee1",
        rawId: "../yxkx/d662a7786d114d5abdfbfce0c3caa300.htm",
        rawTitle: "【通知公告】关于开展珠海校区2025-2026学年家庭经济困难学生认定...",
        rawUrl: "https://welcome.bnuzh.edu.cn/yxkx/d662a7786d114d5abdfbfce0c3caa300.htm",
        rawPublishedAt: "2025-09-05",
        rawChannel: "迎新快讯",
        rawSummary: undefined,
        extras: {
          requestId: "yxkx/index",
        },
      },
    ]);
  });

  it("parses the single-page guide and card-based sections with the same list skeleton", async () => {
    const page = createPage({
      requestId: "lzbsd/index",
      requestUrl: "https://welcome.bnuzh.edu.cn/lzbsd/index.blk.htm",
      finalUrl: "https://welcome.bnuzh.edu.cn/lzbsd/index.blk.htm",
      bodyText: `
        <body>
          <article>
            <div class="main-lf-con rt">
              <div class="subPage">
                <div class="listShow">
                  <ul>
                    <li>
                      <div>
                        <span class="rightDate">
                          <span class="date">09</span>
                          <span class="year">2023-08</span>
                        </span>
                        <span class="artTxt">
                          <a href="./01f6d20c4b674aef8405ca8cfed0fc26.blk.htm">校团委文化活动介绍</a>
                        </span>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </article>
        </body>
      `,
    });

    await expect(yxwParser.parse(page)).resolves.toEqual([
      {
        sourceId: "c5ba1fc8bc32462d9299d79a8d0d0ee1",
        rawId: "./01f6d20c4b674aef8405ca8cfed0fc26.blk.htm",
        rawTitle: "校团委文化活动介绍",
        rawUrl: "https://welcome.bnuzh.edu.cn/lzbsd/01f6d20c4b674aef8405ca8cfed0fc26.blk.htm",
        rawPublishedAt: "2023-08-09",
        rawChannel: "乐在北师大",
        rawSummary: undefined,
        extras: {
          requestId: "lzbsd/index",
        },
      },
    ]);
  });
});
