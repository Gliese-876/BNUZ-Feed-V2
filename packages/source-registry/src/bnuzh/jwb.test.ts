// @vitest-environment jsdom

import { describe, expect, it } from "vitest";

import type { RawPage } from "@bnuz-feed/contracts";

import { jwbFetchTargets, jwbParser } from "./jwb";

function createPage(
  overrides: Partial<RawPage> & Pick<RawPage, "requestId" | "requestUrl" | "finalUrl" | "bodyText">,
): RawPage {
  return {
    sourceId: "c3b1d4c6c2f84f26b6f2f5d8d0b3d7c8",
    fetchedAt: "2026-03-21T00:00:00.000Z",
    ...overrides,
  };
}

describe("jwbFetchTargets", () => {
  it("declares the confirmed public list pages and paginated archives", () => {
    expect(jwbFetchTargets).toHaveLength(129);
    expect(jwbFetchTargets).toEqual(
      expect.arrayContaining([
        { id: "tzgg", url: "https://jwb.bnuzh.edu.cn/tzgg/index.htm", channel: "通知公告" },
        { id: "tzgg/index49", url: "https://jwb.bnuzh.edu.cn/tzgg/index49.htm", channel: "通知公告" },
        { id: "zhxw", url: "https://jwb.bnuzh.edu.cn/zhxw/index.htm", channel: "综合新闻" },
        { id: "zhxw/index8", url: "https://jwb.bnuzh.edu.cn/zhxw/index8.htm", channel: "综合新闻" },
        { id: "jsjy/qsgc", url: "https://jwb.bnuzh.edu.cn/jsjy/qsgc/index.htm", channel: "强师工程" },
        { id: "jsjy/sflzyrz", url: "https://jwb.bnuzh.edu.cn/jsjy/sflzyrz/index.htm", channel: "师范专业认证" },
        { id: "bszn/gzzd", url: "https://jwb.bnuzh.edu.cn/bszn/index.htm", channel: "规章制度" },
        { id: "bszn/jshysyy", url: "https://jwb.bnuzh.edu.cn/bszn/index.htm", channel: "教室/会议室预约" },
        { id: "cyxz/kskh", url: "https://jwb.bnuzh.edu.cn/cyxz/index.htm", channel: "考试考核" },
        { id: "cyxz/jxzy", url: "https://jwb.bnuzh.edu.cn/cyxz/index.htm", channel: "教学资源" },
        { id: "pygc/tzgg/index5", url: "https://jwb.bnuzh.edu.cn/pygc/index5.htm", channel: "通知公告" },
        { id: "jxzy/tzgg/index3", url: "https://jwb.bnuzh.edu.cn/jxzy/index3.htm", channel: "通知公告" },
      ]),
    );

    expect(jwbFetchTargets.filter((target) => target.id === "tzgg" || target.id.startsWith("tzgg/"))).toHaveLength(50);
    expect(jwbFetchTargets.filter((target) => target.id === "zhxw" || target.id.startsWith("zhxw/"))).toHaveLength(9);
    expect(jwbFetchTargets.filter((target) => target.id === "jsjy/tzgg" || target.id.startsWith("jsjy/tzgg/"))).toHaveLength(2);
    expect(jwbFetchTargets.filter((target) => target.id === "zlbz/tzgg" || target.id.startsWith("zlbz/tzgg/"))).toHaveLength(3);
    expect(jwbFetchTargets.filter((target) => target.id === "pygc/tzgg" || target.id.startsWith("pygc/tzgg/"))).toHaveLength(6);
    expect(jwbFetchTargets.filter((target) => target.id === "jxzy/tzgg" || target.id.startsWith("jxzy/tzgg/"))).toHaveLength(4);
    expect(jwbFetchTargets.filter((target) => target.id.startsWith("bszn/"))).toHaveLength(9);
    expect(jwbFetchTargets.filter((target) => target.id.startsWith("cyxz/"))).toHaveLength(6);
  });
});

describe("jwbParser", () => {
  it("parses article-list blocks, strips paging labels, and resolves relative links", async () => {
    const page = createPage({
      requestId: "pygc/tzgg",
      requestUrl: "https://jwb.bnuzh.edu.cn/pygc/index.htm",
      finalUrl: "https://jwb.bnuzh.edu.cn/pygc/index.htm",
      bodyText: `
        <body>
          <div class="article-list">
            <div class="tit">通知公告 1/6, 共 29 篇</div>
            <div class="boxlist">
              <ul>
                <li>
                  <a href="jwyx/abfc306f2826490f9b80754331e30f96.htm" title="关于2025-2026学年春季学期珠海校区学士学位外语（英语）考试的通知">
                    <span>【教务学务】 关于2025-2026学年春季学期珠海校区学士学位外语（英语）考试的通知</span>
                  </a>
                  <span class="fr text-muted">2026-03-18</span>
                </li>
                <li>
                  <a href="https://one.bnuzh.edu.cn/up/view?m=pim#act=up/pim/showpim&id=32571934197829632" title="关于启用新的学生自助打印设备的通知">
                    <span>【教务学务】 关于启用新的学生自助打印设备的通知</span>
                  </a>
                  <span class="fr text-muted">2026年3月17日</span>
                </li>
              </ul>
            </div>
          </div>
          <div class="article-list">
            <div class="tit">教学运行 更多</div>
            <div class="boxlist">
              <ul>
                <li>
                  <a href="jwyx/ignored.htm" title="不应被抓取的内容">
                    <span>不应被抓取的内容</span>
                  </a>
                  <span class="fr text-muted">2026-03-01</span>
                </li>
              </ul>
            </div>
          </div>
        </body>
      `,
    });

    await expect(jwbParser.parse(page)).resolves.toEqual([
      {
        sourceId: "c3b1d4c6c2f84f26b6f2f5d8d0b3d7c8",
        rawId: "jwyx/abfc306f2826490f9b80754331e30f96.htm",
        rawTitle: "关于2025-2026学年春季学期珠海校区学士学位外语（英语）考试的通知",
        rawUrl: "https://jwb.bnuzh.edu.cn/pygc/jwyx/abfc306f2826490f9b80754331e30f96.htm",
        rawPublishedAt: "2026-03-18",
        rawChannel: "通知公告",
        rawSummary: undefined,
        extras: {
          requestId: "pygc/tzgg",
        },
      },
      {
        sourceId: "c3b1d4c6c2f84f26b6f2f5d8d0b3d7c8",
        rawId: "https://one.bnuzh.edu.cn/up/view?m=pim#act=up/pim/showpim&id=32571934197829632",
        rawTitle: "关于启用新的学生自助打印设备的通知",
        rawUrl: "https://one.bnuzh.edu.cn/up/view?m=pim#act=up/pim/showpim&id=32571934197829632",
        rawPublishedAt: "2026-03-17",
        rawChannel: "通知公告",
        rawSummary: undefined,
        extras: {
          requestId: "pygc/tzgg",
        },
      },
    ]);
  });

  it("filters side-nav article-list pages by block title", async () => {
    const page = createPage({
      requestId: "bszn/xjgl",
      requestUrl: "https://jwb.bnuzh.edu.cn/bszn/index.htm",
      finalUrl: "https://jwb.bnuzh.edu.cn/bszn/index.htm",
      bodyText: `
        <body>
          <div class="article-list">
            <div class="tit">规章制度 更多</div>
            <div class="boxlist">
              <ul>
                <li>
                  <a href="gzzd/example.htm" title="规章制度示例">
                    <span>规章制度示例</span>
                  </a>
                  <span class="fr text-muted">2026-03-10</span>
                </li>
              </ul>
            </div>
          </div>
          <div class="article-list">
            <div class="tit">学籍管理 更多</div>
            <div class="boxlist">
              <ul>
                <li>
                  <a href="xjgl/keep.htm" title="关于办理学籍异动的通知">
                    <span>【学籍管理】 关于办理学籍异动的通知</span>
                  </a>
                  <span class="fr text-muted">2026年3月21日</span>
                </li>
              </ul>
            </div>
          </div>
        </body>
      `,
    });

    await expect(jwbParser.parse(page)).resolves.toEqual([
      {
        sourceId: "c3b1d4c6c2f84f26b6f2f5d8d0b3d7c8",
        rawId: "xjgl/keep.htm",
        rawTitle: "关于办理学籍异动的通知",
        rawUrl: "https://jwb.bnuzh.edu.cn/bszn/xjgl/keep.htm",
        rawPublishedAt: "2026-03-21",
        rawChannel: "学籍管理",
        rawSummary: undefined,
        extras: {
          requestId: "bszn/xjgl",
        },
      },
    ]);
  });

  it("parses li.line lists and strips the leading category label from titles", async () => {
    const page = createPage({
      requestId: "tzgg",
      requestUrl: "https://jwb.bnuzh.edu.cn/tzgg/index.htm",
      finalUrl: "https://jwb.bnuzh.edu.cn/tzgg/index.htm",
      bodyText: `
        <body>
          <ul>
            <li class="line">
              <a href="../jsjy/sjjxtxjs/821f7a4f656a4e8fae2b9e342b5d5131.htm" title="关于2026年度本科师范生和硕士研究生教育实习与教育研习工作安排的通知">
                <span>【教师教育】 关于2026年度本科师范生和硕士研究生教育实习与教育研习工作安排的通知</span>
              </a>
              <span class="fr text-muted">2026/03/20</span>
            </li>
            <li class="line">
              <a href="https://eea.gd.gov.cn/tzgg/content/post_4836805.html" title="广东省2026年上半年中小学教师资格考试笔试通告">
                <span>【教师资格证】 广东省2026年上半年中小学教师资格考试笔试通告</span>
              </a>
              <span class="fr text-muted">2025-12-31</span>
            </li>
          </ul>
        </body>
      `,
    });

    await expect(jwbParser.parse(page)).resolves.toEqual([
      {
        sourceId: "c3b1d4c6c2f84f26b6f2f5d8d0b3d7c8",
        rawId: "../jsjy/sjjxtxjs/821f7a4f656a4e8fae2b9e342b5d5131.htm",
        rawTitle: "关于2026年度本科师范生和硕士研究生教育实习与教育研习工作安排的通知",
        rawUrl: "https://jwb.bnuzh.edu.cn/jsjy/sjjxtxjs/821f7a4f656a4e8fae2b9e342b5d5131.htm",
        rawPublishedAt: "2026-03-20",
        rawChannel: "通知公告",
        rawSummary: undefined,
        extras: {
          requestId: "tzgg",
        },
      },
      {
        sourceId: "c3b1d4c6c2f84f26b6f2f5d8d0b3d7c8",
        rawId: "https://eea.gd.gov.cn/tzgg/content/post_4836805.html",
        rawTitle: "广东省2026年上半年中小学教师资格考试笔试通告",
        rawUrl: "https://eea.gd.gov.cn/tzgg/content/post_4836805.html",
        rawPublishedAt: "2025-12-31",
        rawChannel: "通知公告",
        rawSummary: undefined,
        extras: {
          requestId: "tzgg",
        },
      },
    ]);
  });
});
