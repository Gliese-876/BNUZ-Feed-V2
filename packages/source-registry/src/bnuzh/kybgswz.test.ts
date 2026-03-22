// @vitest-environment jsdom

import { describe, expect, it } from "vitest";

import type { RawPage } from "@bnuz-feed/contracts";

import { kybgswzFetchTargets, kybgswzParser } from "./kybgswz";

function createPage(
  overrides: Partial<RawPage> & Pick<RawPage, "requestId" | "requestUrl" | "finalUrl" | "bodyText">,
): RawPage {
  return {
    sourceId: "9193b9297fc840aaaac832f8a8a2c6c3",
    fetchedAt: "2026-03-21T00:00:00.000Z",
    ...overrides,
  };
}

describe("kybgswz parser", () => {
  it("declares the confirmed public list pages", () => {
    expect(kybgswzFetchTargets).toHaveLength(62);

    expect(kybgswzFetchTargets.slice(0, 4)).toEqual([
      { id: "tpxw", url: "https://kyb.bnuzh.edu.cn/tpxw/index.htm", channel: "图片新闻" },
      { id: "kydt", url: "https://kyb.bnuzh.edu.cn/kydt/index.htm", channel: "科研动态" },
      { id: "kydt/index1", url: "https://kyb.bnuzh.edu.cn/kydt/index1.htm", channel: "科研动态" },
      { id: "kydt/index2", url: "https://kyb.bnuzh.edu.cn/kydt/index2.htm", channel: "科研动态" },
    ]);

    expect(kybgswzFetchTargets.filter((target) => target.id === "kydt" || target.id.startsWith("kydt/index"))).toHaveLength(17);
    expect(kybgswzFetchTargets.filter((target) => target.id === "sbtz" || target.id.startsWith("sbtz/index"))).toHaveLength(14);
    expect(kybgswzFetchTargets.filter((target) => target.id === "kyhd" || target.id.startsWith("kyhd/index"))).toHaveLength(19);
    expect(kybgswzFetchTargets).toContainEqual({
      id: "kxyjxgfg",
      url: "https://kyb.bnuzh.edu.cn/glgz/kxyjxgfg/index.htm",
      channel: "科学研究相关法规",
    });
    expect(kybgswzFetchTargets).toContainEqual({
      id: "xdhz",
      url: "https://kyb.bnuzh.edu.cn/xdhz/index.htm",
      channel: "校地合作",
    });
    expect(kybgswzFetchTargets.at(-1)).toEqual({
      id: "zlxz",
      url: "https://kyb.bnuzh.edu.cn/zlxz/index.blk.htm",
      channel: "资料下载",
    });
  });

  it("parses the public news stream and normalizes dates", async () => {
    const page = createPage({
      requestId: "kydt",
      requestUrl: "https://kyb.bnuzh.edu.cn/kydt/index.htm",
      finalUrl: "https://kyb.bnuzh.edu.cn/kydt/index.htm",
      bodyText: `
        <body>
          <div class="article-container">
            <ul class="article-list list-unstyled">
              <li class="item py-2 py-lg-3">
                <a href="https://news.bnu.edu.cn/zx/zhxw/281fab1d8d15422386b9a6ddf2e9e006.htm" class="d-flex">
                  <span class="title flex-grow-1 me-2">北师大召开2026年度国家自然科学基金项目申报宣讲会</span>
                  <span class="flex-shrink-0">2026/01/19</span>
                </a>
              </li>
              <li class="item py-2 py-lg-3">
                <a href="../docs/2026-03/demo.pdf" class="d-flex">
                  <span class="title flex-grow-1 me-2">科研动态测试条目</span>
                  <span class="flex-shrink-0">2026.03.16</span>
                </a>
              </li>
            </ul>
          </div>
        </body>
      `,
    });

    await expect(kybgswzParser.parse(page)).resolves.toEqual([
      {
        sourceId: "9193b9297fc840aaaac832f8a8a2c6c3",
        rawId: "https://news.bnu.edu.cn/zx/zhxw/281fab1d8d15422386b9a6ddf2e9e006.htm",
        rawTitle: "北师大召开2026年度国家自然科学基金项目申报宣讲会",
        rawUrl: "https://news.bnu.edu.cn/zx/zhxw/281fab1d8d15422386b9a6ddf2e9e006.htm",
        rawPublishedAt: "2026-01-19",
        rawChannel: "科研动态",
        rawSummary: undefined,
        extras: {
          requestId: "kydt",
        },
      },
      {
        sourceId: "9193b9297fc840aaaac832f8a8a2c6c3",
        rawId: "../docs/2026-03/demo.pdf",
        rawTitle: "科研动态测试条目",
        rawUrl: "https://kyb.bnuzh.edu.cn/docs/2026-03/demo.pdf",
        rawPublishedAt: "2026-03-16",
        rawChannel: "科研动态",
        rawSummary: undefined,
        extras: {
          requestId: "kydt",
        },
      },
    ]);
  });

  it("parses the guide and download pages with relative links", async () => {
    const guidePage = createPage({
      requestId: "xmgl",
      requestUrl: "https://kyb.bnuzh.edu.cn/ywzn/xmgl/index.htm",
      finalUrl: "https://kyb.bnuzh.edu.cn/ywzn/xmgl/index.htm",
      bodyText: `
        <body>
          <div class="article-container">
            <ul class="article-list list-unstyled">
              <li class="item py-2 py-lg-3">
                <a href="../../docs/2024-03/28dc5a74851e43c7a0274c57e18025b0.docx" class="d-flex">
                  <span class="title flex-grow-1 me-2">科研系统入账常见问题及解决办法</span>
                  <span class="flex-shrink-0">2024/03/22</span>
                </a>
              </li>
            </ul>
          </div>
        </body>
      `,
    });

    await expect(kybgswzParser.parse(guidePage)).resolves.toEqual([
      {
        sourceId: "9193b9297fc840aaaac832f8a8a2c6c3",
        rawId: "../../docs/2024-03/28dc5a74851e43c7a0274c57e18025b0.docx",
        rawTitle: "科研系统入账常见问题及解决办法",
        rawUrl: "https://kyb.bnuzh.edu.cn/docs/2024-03/28dc5a74851e43c7a0274c57e18025b0.docx",
        rawPublishedAt: "2024-03-22",
        rawChannel: "项目管理",
        rawSummary: undefined,
        extras: {
          requestId: "xmgl",
        },
      },
    ]);

    const downloadPage = createPage({
      requestId: "zlxz",
      requestUrl: "https://kyb.bnuzh.edu.cn/zlxz/index.blk.htm",
      finalUrl: "https://kyb.bnuzh.edu.cn/zlxz/index.blk.htm",
      bodyText: `
        <body>
          <div class="article-container">
            <ul class="article-list list-unstyled">
              <li class="item py-2 py-lg-3">
                <a href="../docs/2024-04/a35a5e9768354859b0b3bb778893d985.docx" class="d-flex">
                  <span class="title flex-grow-1 me-2">校印审批表</span>
                  <span class="flex-shrink-0">2024/04/02</span>
                </a>
              </li>
            </ul>
          </div>
        </body>
      `,
    });

    await expect(kybgswzParser.parse(downloadPage)).resolves.toEqual([
      {
        sourceId: "9193b9297fc840aaaac832f8a8a2c6c3",
        rawId: "../docs/2024-04/a35a5e9768354859b0b3bb778893d985.docx",
        rawTitle: "校印审批表",
        rawUrl: "https://kyb.bnuzh.edu.cn/docs/2024-04/a35a5e9768354859b0b3bb778893d985.docx",
        rawPublishedAt: "2024-04-02",
        rawChannel: "资料下载",
        rawSummary: undefined,
        extras: {
          requestId: "zlxz",
        },
      },
    ]);
  });
});
