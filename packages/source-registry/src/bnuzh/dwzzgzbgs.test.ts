// @vitest-environment jsdom

import { describe, expect, it } from "vitest";

import type { RawPage } from "@bnuz-feed/contracts";

import { dwzzgzbgsFetchTargets, dwzzgzbgsParser } from "./dwzzgzbgs";

function createPage(
  overrides: Partial<RawPage> & Pick<RawPage, "requestId" | "requestUrl" | "finalUrl" | "bodyText">,
): RawPage {
  return {
    sourceId: "01e60809114c446dad43a679c9573fe7",
    fetchedAt: "2026-03-21T00:00:00.000Z",
    ...overrides,
  };
}

describe("dwzzgzbgsParser", () => {
  it("declares the anonymous stable message-source pages and excludes directories and empty sections", () => {
    expect(dwzzgzbgsFetchTargets).toEqual([
      { id: "sygzdt", url: "https://dwzgb.bnuzh.edu.cn/sygzdt/index.htm", channel: "工作动态" },
      { id: "sytzgg", url: "https://dwzgb.bnuzh.edu.cn/sytzgg/index.htm", channel: "通知公告" },
      { id: "dwjs", url: "https://dwzgb.bnuzh.edu.cn/dwjs/index.htm", channel: "队伍建设" },
      { id: "djgz/gzdt", url: "https://dwzgb.bnuzh.edu.cn/djgz/gzdt/index.htm", channel: "工作动态" },
      { id: "djgz/tzgg", url: "https://dwzgb.bnuzh.edu.cn/djgz/tzgg/index.htm", channel: "通知公告" },
      { id: "gbgz/gbpy", url: "https://dwzgb.bnuzh.edu.cn/gbgz/gbpy/index.htm", channel: "干部培养" },
      { id: "gbgz/gbgl", url: "https://dwzgb.bnuzh.edu.cn/gbgz/gbgl/index.htm", channel: "干部管理" },
      { id: "zdwj", url: "https://dwzgb.bnuzh.edu.cn/zdwj/index.htm", channel: "制度文件" },
      { id: "xzzq", url: "https://dwzgb.bnuzh.edu.cn/xzzq/index.htm", channel: "下载专区" },
      { id: "cjwd", url: "https://dwzgb.bnuzh.edu.cn/cjwd/index.htm", channel: "常见问答" },
    ]);
  });

  it("parses the工作动态 card list with summaries and calendar dates", async () => {
    const page = createPage({
      requestId: "sygzdt",
      requestUrl: "https://dwzgb.bnuzh.edu.cn/sygzdt/index.htm",
      finalUrl: "https://dwzgb.bnuzh.edu.cn/sygzdt/index.htm",
      bodyText: `
        <body>
          <main>
            <ul class="common-article-list2">
              <li>
                <a class="item" href="dc2b44a4ba3e4c5bbdd567cb5225c000.htm">
                  <p class="title">珠海校区承办珠海市直教育系统2025年党务工作者暨“香山园丁计划”教师思政能力提升培训班</p>
                  <p class="summary">党委组织工作办公室组织开展专题培训。</p>
                  <div class="common-calendar">
                    <span>09</span><span>月</span><span>/</span><span>23</span><span>日</span>
                  </div>
                </a>
              </li>
            </ul>
          </main>
        </body>
      `,
    });

    const records = await dwzzgzbgsParser.parse(page);

    expect(records).toEqual([
      {
        sourceId: "01e60809114c446dad43a679c9573fe7",
        rawId: "dc2b44a4ba3e4c5bbdd567cb5225c000.htm",
        rawTitle: "珠海校区承办珠海市直教育系统2025年党务工作者暨“香山园丁计划”教师思政能力提升培训班",
        rawUrl: "https://dwzgb.bnuzh.edu.cn/sygzdt/dc2b44a4ba3e4c5bbdd567cb5225c000.htm",
        rawPublishedAt: "09-23",
        rawChannel: "工作动态",
        rawSummary: "党委组织工作办公室组织开展专题培训。",
        extras: {
          requestId: "sygzdt",
        },
      },
    ]);
  });

  it("parses the通知公告 and队伍建设 lists with stable relative and absolute URLs", async () => {
    const noticePage = createPage({
      requestId: "sytzgg",
      requestUrl: "https://dwzgb.bnuzh.edu.cn/sytzgg/index.htm",
      finalUrl: "https://dwzgb.bnuzh.edu.cn/sytzgg/index.htm",
      bodyText: `
        <body>
          <main>
            <ul class="common-article-list">
              <li>
                <a class="item" href="../sytzgg/be2c46e49521434dacdb00a7e513a604.htm">
                  <span class="title">【深入贯彻中央八项规定精神学习教育】警示教育视频资源</span>
                  <span class="summary">供大家学习使用。</span>
                  <span class="time">2025年6月17日</span>
                </a>
              </li>
            </ul>
          </main>
        </body>
      `,
    });

    const teamPage = createPage({
      requestId: "dwjs",
      requestUrl: "https://dwzgb.bnuzh.edu.cn/dwjs/index.htm",
      finalUrl: "https://dwzgb.bnuzh.edu.cn/dwjs/index.htm",
      bodyText: `
        <body>
          <main>
            <ul class="common-article-list">
              <li>
                <a class="item" href="https://www.bnuzh.edu.cn/zhxw/dc2b44a4ba3e4c5bbdd567cb5225c000.htm">
                  <span class="title">珠海校区举办党务工作者能力提升培训班</span>
                  <span class="time">2025-7-11</span>
                </a>
              </li>
            </ul>
          </main>
        </body>
      `,
    });

    await expect(dwzzgzbgsParser.parse(noticePage)).resolves.toEqual([
      {
        sourceId: "01e60809114c446dad43a679c9573fe7",
        rawId: "../sytzgg/be2c46e49521434dacdb00a7e513a604.htm",
        rawTitle: "【深入贯彻中央八项规定精神学习教育】警示教育视频资源",
        rawUrl: "https://dwzgb.bnuzh.edu.cn/sytzgg/be2c46e49521434dacdb00a7e513a604.htm",
        rawPublishedAt: "2025-06-17",
        rawChannel: "通知公告",
        rawSummary: "供大家学习使用。",
        extras: {
          requestId: "sytzgg",
        },
      },
    ]);

    await expect(dwzzgzbgsParser.parse(teamPage)).resolves.toEqual([
      {
        sourceId: "01e60809114c446dad43a679c9573fe7",
        rawId: "https://www.bnuzh.edu.cn/zhxw/dc2b44a4ba3e4c5bbdd567cb5225c000.htm",
        rawTitle: "珠海校区举办党务工作者能力提升培训班",
        rawUrl: "https://www.bnuzh.edu.cn/zhxw/dc2b44a4ba3e4c5bbdd567cb5225c000.htm",
        rawPublishedAt: "2025-07-11",
        rawChannel: "队伍建设",
        rawSummary: undefined,
        extras: {
          requestId: "dwjs",
        },
      },
    ]);
  });

  it("parses干部培养、干部管理和制度文件 style lists", async () => {
    const trainingPage = createPage({
      requestId: "gbgz/gbpy",
      requestUrl: "https://dwzgb.bnuzh.edu.cn/gbgz/gbpy/index.htm",
      finalUrl: "https://dwzgb.bnuzh.edu.cn/gbgz/gbpy/index.htm",
      bodyText: `
        <body>
          <main>
            <ul class="common-article-list">
              <li>
                <a class="item" href="2025/08/01/1f38a8b49b964025b9b187440ba345d0.htm">
                  <span class="title">干部培训专题班顺利举行</span>
                  <span class="summary">围绕干部素质能力提升开展。</span>
                  <span class="time">2025-08-01</span>
                </a>
              </li>
            </ul>
          </main>
        </body>
      `,
    });

    const docsPage = createPage({
      requestId: "zdwj",
      requestUrl: "https://dwzgb.bnuzh.edu.cn/zdwj/index.htm",
      finalUrl: "https://dwzgb.bnuzh.edu.cn/zdwj/index.htm",
      bodyText: `
        <body>
          <main>
            <ul class="common-article-list">
              <li>
                <a class="item" href="../docs/2025-12/manual.pdf">
                  <span class="title">珠海校区组织建设工作手册</span>
                  <span class="time">2024.06.13</span>
                </a>
              </li>
            </ul>
          </main>
        </body>
      `,
    });

    await expect(dwzzgzbgsParser.parse(trainingPage)).resolves.toEqual([
      {
        sourceId: "01e60809114c446dad43a679c9573fe7",
        rawId: "2025/08/01/1f38a8b49b964025b9b187440ba345d0.htm",
        rawTitle: "干部培训专题班顺利举行",
        rawUrl: "https://dwzgb.bnuzh.edu.cn/gbgz/gbpy/2025/08/01/1f38a8b49b964025b9b187440ba345d0.htm",
        rawPublishedAt: "2025-08-01",
        rawChannel: "干部培养",
        rawSummary: "围绕干部素质能力提升开展。",
        extras: {
          requestId: "gbgz/gbpy",
        },
      },
    ]);

    await expect(dwzzgzbgsParser.parse(docsPage)).resolves.toEqual([
      {
        sourceId: "01e60809114c446dad43a679c9573fe7",
        rawId: "../docs/2025-12/manual.pdf",
        rawTitle: "珠海校区组织建设工作手册",
        rawUrl: "https://dwzgb.bnuzh.edu.cn/docs/2025-12/manual.pdf",
        rawPublishedAt: "2024-06-13",
        rawChannel: "制度文件",
        rawSummary: undefined,
        extras: {
          requestId: "zdwj",
        },
      },
    ]);
  });

  it("parses downloads and common Q&A entries as stable detail links", async () => {
    const downloadPage = createPage({
      requestId: "xzzq",
      requestUrl: "https://dwzgb.bnuzh.edu.cn/xzzq/index.htm",
      finalUrl: "https://dwzgb.bnuzh.edu.cn/xzzq/index.htm",
      bodyText: `
        <body>
          <main>
            <ul class="common-article-list">
              <li>
                <a class="item" href="../docs/2025-12/d6fdfef8d3b542e897779e915a338ccb.pdf">
                  <span class="title">珠海校区党员发展材料模板.docx</span>
                  <span class="time">2025-12-30</span>
                </a>
              </li>
            </ul>
          </main>
        </body>
      `,
    });

    const qnaPage = createPage({
      requestId: "cjwd",
      requestUrl: "https://dwzgb.bnuzh.edu.cn/cjwd/index.htm",
      finalUrl: "https://dwzgb.bnuzh.edu.cn/cjwd/index.htm",
      bodyText: `
        <body>
          <main>
            <ul class="common-article-list">
              <li>
                <a class="item" href="c6acc09afe344dd1bc38d65f655104fc.htm">
                  <span class="title">政治审查内容与政审报告怎么写？</span>
                  <span class="time">2024.06.13</span>
                </a>
              </li>
            </ul>
          </main>
        </body>
      `,
    });

    await expect(dwzzgzbgsParser.parse(downloadPage)).resolves.toEqual([
      {
        sourceId: "01e60809114c446dad43a679c9573fe7",
        rawId: "../docs/2025-12/d6fdfef8d3b542e897779e915a338ccb.pdf",
        rawTitle: "珠海校区党员发展材料模板.docx",
        rawUrl: "https://dwzgb.bnuzh.edu.cn/docs/2025-12/d6fdfef8d3b542e897779e915a338ccb.pdf",
        rawPublishedAt: "2025-12-30",
        rawChannel: "下载专区",
        rawSummary: undefined,
        extras: {
          requestId: "xzzq",
        },
      },
    ]);

    await expect(dwzzgzbgsParser.parse(qnaPage)).resolves.toEqual([
      {
        sourceId: "01e60809114c446dad43a679c9573fe7",
        rawId: "c6acc09afe344dd1bc38d65f655104fc.htm",
        rawTitle: "政治审查内容与政审报告怎么写？",
        rawUrl: "https://dwzgb.bnuzh.edu.cn/cjwd/c6acc09afe344dd1bc38d65f655104fc.htm",
        rawPublishedAt: "2024-06-13",
        rawChannel: "常见问答",
        rawSummary: undefined,
        extras: {
          requestId: "cjwd",
        },
      },
    ]);
  });
});
