// @vitest-environment jsdom

import { describe, expect, it } from "vitest";

import type { RawPage } from "@bnuz-feed/contracts";

import { dagwzFetchTargets, dagwzParser } from "./dagwz";

function createPage(
  overrides: Partial<RawPage> & Pick<RawPage, "requestId" | "requestUrl" | "finalUrl" | "bodyText">,
): RawPage {
  return {
    sourceId: "c00aa4c1b0f64acb9a70432cec15c71c",
    fetchedAt: "2026-03-21T00:00:00.000Z",
    ...overrides,
  };
}

describe("dagwzParser", () => {
  it("declares the confirmed public sources and excludes static or utility pages", () => {
    expect(dagwzFetchTargets).toEqual([
      { id: "gzdt/xwdt", url: "https://dangan.bnuzh.edu.cn/gzdt/xwdt/index.htm", channel: "工作动态/新闻动态" },
      { id: "gzdt/tzgg", url: "https://dangan.bnuzh.edu.cn/gzdt/tzgg/index.htm", channel: "工作动态/通知公告" },
      { id: "fgzd/flfg", url: "https://dangan.bnuzh.edu.cn/fgzd/flfg/index.htm", channel: "法规制度/法律法规" },
      { id: "fgzd/bzgf", url: "https://dangan.bnuzh.edu.cn/fgzd/bzgf/index.htm", channel: "法规制度/标准规范" },
      { id: "fgzd/gzzd", url: "https://dangan.bnuzh.edu.cn/fgzd/gzzd/index.htm", channel: "法规制度/规章制度" },
      { id: "bszn/cdzn", url: "https://dangan.bnuzh.edu.cn/bszn/cdzn/index.htm", channel: "办事指南/综合档案" },
      { id: "bszn/gdzn", url: "https://dangan.bnuzh.edu.cn/bszn/gdzn/index.htm", channel: "办事指南/学生档案" },
      {
        id: "bszn/gdzn/xqxsda",
        url: "https://dangan.bnuzh.edu.cn/bszn/gdzn/xqxsda/index.htm",
        channel: "办事指南/学生档案",
      },
      { id: "bszn/cjwt", url: "https://dangan.bnuzh.edu.cn/bszn/cjwt/index.htm", channel: "办事指南/常见问题" },
      { id: "xgxz/zfly", url: "https://dangan.bnuzh.edu.cn/xgxz/zfly/index.htm", channel: "相关下载/综合档案" },
      { id: "xgxz/zfle", url: "https://dangan.bnuzh.edu.cn/xgxz/zfle/index.htm", channel: "相关下载/学生档案" },
    ]);
  });

  it("parses the work and regulation lists with dates embedded in the item template", async () => {
    const page = createPage({
      requestId: "fgzd/flfg",
      requestUrl: "https://dangan.bnuzh.edu.cn/fgzd/flfg/index.htm",
      finalUrl: "https://dangan.bnuzh.edu.cn/fgzd/flfg/index.htm",
      bodyText: `
        <body>
          <ul class="noticeUl">
            <li>
              <a href="6f75aade00d548a391080aa02e120a1a.htm">
                <span class="datew gp-f14 gp-fr">2023-05-17</span>
                <p class="gp-f16 gp-ellipsis">中华人民共和国档案法</p>
              </a>
            </li>
            <li>
              <a href="https://dangan.bnuzh.edu.cn/fgzd/flfg/e42ff7bd7559434392209a7238d3b4f9.htm">
                <span class="datew gp-f14 gp-fr">2024-01-26</span>
                <p class="gp-f16 gp-ellipsis">中华人民共和国档案法实施条例</p>
              </a>
            </li>
          </ul>
        </body>
      `,
    });

    await expect(dagwzParser.parse(page)).resolves.toEqual([
      {
        sourceId: "c00aa4c1b0f64acb9a70432cec15c71c",
        rawId: "6f75aade00d548a391080aa02e120a1a.htm",
        rawTitle: "中华人民共和国档案法",
        rawUrl: "https://dangan.bnuzh.edu.cn/fgzd/flfg/6f75aade00d548a391080aa02e120a1a.htm",
        rawPublishedAt: "2023-05-17",
        rawChannel: "法规制度/法律法规",
        rawSummary: undefined,
        extras: {
          requestId: "fgzd/flfg",
        },
      },
      {
        sourceId: "c00aa4c1b0f64acb9a70432cec15c71c",
        rawId: "https://dangan.bnuzh.edu.cn/fgzd/flfg/e42ff7bd7559434392209a7238d3b4f9.htm",
        rawTitle: "中华人民共和国档案法实施条例",
        rawUrl: "https://dangan.bnuzh.edu.cn/fgzd/flfg/e42ff7bd7559434392209a7238d3b4f9.htm",
        rawPublishedAt: "2024-01-26",
        rawChannel: "法规制度/法律法规",
        rawSummary: undefined,
        extras: {
          requestId: "fgzd/flfg",
        },
      },
    ]);
  });

  it("parses guide and download pages with absolute links and office document attachments", async () => {
    const guidePage = createPage({
      requestId: "bszn/gdzn",
      requestUrl: "https://dangan.bnuzh.edu.cn/bszn/gdzn/index.htm",
      finalUrl: "https://dangan.bnuzh.edu.cn/bszn/gdzn/index.htm",
      bodyText: `
        <body>
          <ul class="noticeUl">
            <li>
              <a href="https://dangan.bnuzh.edu.cn/gzdt/tzgg/864674e4ccd64055a975a52618029809.htm">
                <span class="datew gp-f14 gp-fr">2025-10-27</span>
                <p class="gp-f16 gp-ellipsis">毕业生开具档案证明工作流程</p>
              </a>
            </li>
          </ul>
        </body>
      `,
    });

    const downloadPage = createPage({
      requestId: "xgxz/zfle",
      requestUrl: "https://dangan.bnuzh.edu.cn/xgxz/zfle/index.htm",
      finalUrl: "https://dangan.bnuzh.edu.cn/xgxz/zfle/index.htm",
      bodyText: `
        <body>
          <ul class="noticeUl">
            <li>
              <a href="../../docs/2024-09/8c371fbd1cfd469296b9a70e06d033cf.xlsx">
                <span class="datew gp-f14 gp-fr">2024-09-01</span>
                <p class="gp-f16 gp-ellipsis">新生档案材料登记表</p>
              </a>
            </li>
            <li>
              <a href="../../docs/2023-08/41f369c22dec475781ddc6fc89ec44c9.docx">
                <span class="datew gp-f14 gp-fr">2023-05-17</span>
                <p class="gp-f16 gp-ellipsis">查阅档案介绍信（学生档案）</p>
              </a>
            </li>
          </ul>
        </body>
      `,
    });

    const studentArchiveGuidePage = createPage({
      requestId: "bszn/gdzn/xqxsda",
      requestUrl: "https://dangan.bnuzh.edu.cn/bszn/gdzn/xqxsda/index.htm",
      finalUrl: "https://dangan.bnuzh.edu.cn/bszn/gdzn/xqxsda/index.htm",
      bodyText: `
        <body>
          <ul class="noticeUl">
            <li>
              <a href="f2f5c7d5a349412b8f0188703123abcd.htm">
                <span class="datew gp-f14 gp-fr">2025-10-27</span>
                <p class="gp-f16 gp-ellipsis">校内相关单位查阅学生档案工作流程</p>
              </a>
            </li>
          </ul>
        </body>
      `,
    });

    await expect(dagwzParser.parse(guidePage)).resolves.toEqual([
      {
        sourceId: "c00aa4c1b0f64acb9a70432cec15c71c",
        rawId: "https://dangan.bnuzh.edu.cn/gzdt/tzgg/864674e4ccd64055a975a52618029809.htm",
        rawTitle: "毕业生开具档案证明工作流程",
        rawUrl: "https://dangan.bnuzh.edu.cn/gzdt/tzgg/864674e4ccd64055a975a52618029809.htm",
        rawPublishedAt: "2025-10-27",
        rawChannel: "办事指南/学生档案",
        rawSummary: undefined,
        extras: {
          requestId: "bszn/gdzn",
        },
      },
    ]);

    await expect(dagwzParser.parse(studentArchiveGuidePage)).resolves.toEqual([
      {
        sourceId: "c00aa4c1b0f64acb9a70432cec15c71c",
        rawId: "f2f5c7d5a349412b8f0188703123abcd.htm",
        rawTitle: "校内相关单位查阅学生档案工作流程",
        rawUrl: "https://dangan.bnuzh.edu.cn/bszn/gdzn/xqxsda/f2f5c7d5a349412b8f0188703123abcd.htm",
        rawPublishedAt: "2025-10-27",
        rawChannel: "办事指南/学生档案",
        rawSummary: undefined,
        extras: {
          requestId: "bszn/gdzn/xqxsda",
        },
      },
    ]);

    await expect(dagwzParser.parse(downloadPage)).resolves.toEqual([
      {
        sourceId: "c00aa4c1b0f64acb9a70432cec15c71c",
        rawId: "../../docs/2024-09/8c371fbd1cfd469296b9a70e06d033cf.xlsx",
        rawTitle: "新生档案材料登记表",
        rawUrl: "https://dangan.bnuzh.edu.cn/docs/2024-09/8c371fbd1cfd469296b9a70e06d033cf.xlsx",
        rawPublishedAt: "2024-09-01",
        rawChannel: "相关下载/学生档案",
        rawSummary: undefined,
        extras: {
          requestId: "xgxz/zfle",
        },
      },
      {
        sourceId: "c00aa4c1b0f64acb9a70432cec15c71c",
        rawId: "../../docs/2023-08/41f369c22dec475781ddc6fc89ec44c9.docx",
        rawTitle: "查阅档案介绍信（学生档案）",
        rawUrl: "https://dangan.bnuzh.edu.cn/docs/2023-08/41f369c22dec475781ddc6fc89ec44c9.docx",
        rawPublishedAt: "2023-05-17",
        rawChannel: "相关下载/学生档案",
        rawSummary: undefined,
        extras: {
          requestId: "xgxz/zfle",
        },
      },
    ]);
  });
});
