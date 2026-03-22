// @vitest-environment jsdom

import { describe, expect, it } from "vitest";

import type { RawPage } from "@bnuz-feed/contracts";

import { lgsyptwzFetchTargets, lgsyptwzParser } from "./lgsyptwz";

function createPage(
  overrides: Partial<RawPage> & Pick<RawPage, "requestId" | "requestUrl" | "finalUrl" | "bodyText">,
): RawPage {
  return {
    sourceId: "16e7de8fdc4a47cfbbcfd69bad3087b8",
    fetchedAt: "2026-03-21T00:00:00.000Z",
    ...overrides,
  };
}

describe("lgsyptwzParser", () => {
  it("declares the confirmed pages, pagination targets, and center directories", () => {
    expect(lgsyptwzFetchTargets).toEqual([
      { id: "ptxw", url: "https://iscst.bnuzh.edu.cn/ptxw/index.htm", channel: "平台新闻" },
      { id: "ptxw/index1", url: "https://iscst.bnuzh.edu.cn/ptxw/index1.htm", channel: "平台新闻" },
      { id: "ptxw/index2", url: "https://iscst.bnuzh.edu.cn/ptxw/index2.htm", channel: "平台新闻" },
      { id: "tzgg", url: "https://iscst.bnuzh.edu.cn/xwgg/tzgg/index.htm", channel: "通知公告" },
      { id: "tzgg/index1", url: "https://iscst.bnuzh.edu.cn/xwgg/tzgg/index1.htm", channel: "通知公告" },
      { id: "pxap", url: "https://iscst.bnuzh.edu.cn/xwgg/pxap/index.htm", channel: "培训安排" },
      { id: "pxap/index1", url: "https://iscst.bnuzh.edu.cn/xwgg/pxap/index1.htm", channel: "培训安排" },
      { id: "pxap/index2", url: "https://iscst.bnuzh.edu.cn/xwgg/pxap/index2.htm", channel: "培训安排" },
      { id: "pxap/index3", url: "https://iscst.bnuzh.edu.cn/xwgg/pxap/index3.htm", channel: "培训安排" },
      { id: "pxap/index4", url: "https://iscst.bnuzh.edu.cn/xwgg/pxap/index4.htm", channel: "培训安排" },
      { id: "pxap/index5", url: "https://iscst.bnuzh.edu.cn/xwgg/pxap/index5.htm", channel: "培训安排" },
      { id: "pxap/index6", url: "https://iscst.bnuzh.edu.cn/xwgg/pxap/index6.htm", channel: "培训安排" },
      { id: "pxap/index7", url: "https://iscst.bnuzh.edu.cn/xwgg/pxap/index7.htm", channel: "培训安排" },
      { id: "pxap/index8", url: "https://iscst.bnuzh.edu.cn/xwgg/pxap/index8.htm", channel: "培训安排" },
      { id: "pxap/index9", url: "https://iscst.bnuzh.edu.cn/xwgg/pxap/index9.htm", channel: "培训安排" },
      { id: "pxap/index10", url: "https://iscst.bnuzh.edu.cn/xwgg/pxap/index10.htm", channel: "培训安排" },
      { id: "djzt", url: "https://iscst.bnuzh.edu.cn/djzt/index.htm", channel: "党建专题" },
      { id: "djzt/index1", url: "https://iscst.bnuzh.edu.cn/djzt/index1.htm", channel: "党建专题" },
      { id: "djzt/index2", url: "https://iscst.bnuzh.edu.cn/djzt/index2.htm", channel: "党建专题" },
      { id: "aqzt", url: "https://iscst.bnuzh.edu.cn/aqzt/index.htm", channel: "安全专题" },
      { id: "gzzd", url: "https://iscst.bnuzh.edu.cn/gzzd/index.htm", channel: "规章制度" },
      { id: "rczp", url: "https://iscst.bnuzh.edu.cn/rczp/index.htm", channel: "人才招聘" },
      { id: "yylc", url: "https://iscst.bnuzh.edu.cn/fwzn/yylc/index.htm", channel: "预约流程" },
      { id: "sfbz", url: "https://iscst.bnuzh.edu.cn/fwzn/sfbz/index.htm", channel: "收费标准" },
      { id: "alzs", url: "https://iscst.bnuzh.edu.cn/alzs/index.htm", channel: "案例展示" },
      { id: "cffxzx", url: "https://iscst.bnuzh.edu.cn/yqsb/cffxzx/index.htm", channel: "成分分析中心" },
      { id: "bmfxzx", url: "https://iscst.bnuzh.edu.cn/yqsb/bmfxzx/index.htm", channel: "表面分析中心" },
      { id: "wqfxzx", url: "https://iscst.bnuzh.edu.cn/yqsb/wqfxzx/index.htm", channel: "微区分析中心" },
      { id: "jgfxzx", url: "https://iscst.bnuzh.edu.cn/yqsb/jgfxzx/index.htm", channel: "结构分析中心" },
      { id: "fzfxzx", url: "https://iscst.bnuzh.edu.cn/yqsb/fzfxzx/index.htm", channel: "分子分析中心" },
    ]);
  });

  it("parses paginated articles and normalizes cross-directory links", async () => {
    const page = createPage({
      requestId: "pxap/index10",
      requestUrl: "https://iscst.bnuzh.edu.cn/xwgg/pxap/index10.htm",
      finalUrl: "https://iscst.bnuzh.edu.cn/xwgg/pxap/index10.htm",
      bodyText: `
        <body>
          <ul class="article-list">
            <li class="item py-2 py-lg-3">
              <a href="10a420f4f2c04194806c81f4dcfc20e6.htm" title="2023-2024学年第二学期第五期培训：超高分辨率低损伤扫描电镜及前期制样设备联合系统（第3期）" class="d-flex">
                <div class="square"></div>
                <span class="title flex-grow-1 me-2">2023-2024学年第二学期第五期培训：超高分辨率低损伤扫描电镜及前期制样设备联合系统（第3期）</span>
                <span class="flex-shrink-0">2024/03/13</span>
              </a>
            </li>
            <li class="item py-2 py-lg-3">
              <a href="../pxap/legacy.htm" title="2023-2024学年第二学期第四期培训：扫描电镜样品制备" class="d-flex">
                <div class="square"></div>
                <span class="title flex-grow-1 me-2">2023-2024学年第二学期第四期培训：扫描电镜样品制备</span>
                <span class="flex-shrink-0">2024.03.06</span>
              </a>
            </li>
          </ul>
        </body>
      `,
    });

    await expect(lgsyptwzParser.parse(page)).resolves.toEqual([
      {
        sourceId: "16e7de8fdc4a47cfbbcfd69bad3087b8",
        rawId: "10a420f4f2c04194806c81f4dcfc20e6.htm",
        rawTitle: "2023-2024学年第二学期第五期培训：超高分辨率低损伤扫描电镜及前期制样设备联合系统（第3期）",
        rawUrl: "https://iscst.bnuzh.edu.cn/xwgg/pxap/10a420f4f2c04194806c81f4dcfc20e6.htm",
        rawPublishedAt: "2024-03-13",
        rawChannel: "培训安排",
        rawSummary: undefined,
        extras: {
          requestId: "pxap/index10",
        },
      },
      {
        sourceId: "16e7de8fdc4a47cfbbcfd69bad3087b8",
        rawId: "../pxap/legacy.htm",
        rawTitle: "2023-2024学年第二学期第四期培训：扫描电镜样品制备",
        rawUrl: "https://iscst.bnuzh.edu.cn/xwgg/pxap/legacy.htm",
        rawPublishedAt: "2024-03-06",
        rawChannel: "培训安排",
        rawSummary: undefined,
        extras: {
          requestId: "pxap/index10",
        },
      },
    ]);
  });

  it("parses announcement pages with direct and cross-directory article links", async () => {
    const page = createPage({
      requestId: "aqzt",
      requestUrl: "https://iscst.bnuzh.edu.cn/aqzt/index.htm",
      finalUrl: "https://iscst.bnuzh.edu.cn/aqzt/index.htm",
      bodyText: `
        <body>
          <ul class="article-list">
            <li class="item py-2 py-lg-3">
              <a href="../ptxw/9bd754d9074d4f4db5078cf9b90ca127.htm" title="节后首个工作日迅即行动，理工实验平台开展“四全”安全大检查" class="d-flex">
                <div class="square"></div>
                <span class="title flex-grow-1 me-2">节后首个工作日迅即行动，理工实验平台开展“四全”安全大检查</span>
                <span class="flex-shrink-0">2026/02/27</span>
              </a>
            </li>
            <li class="item py-2 py-lg-3">
              <a href="af23d63878da464eab79ee344ef5faed.htm" title="理工实验平台开展元旦前安全大检查，全面筑牢平台安全防线" class="d-flex">
                <div class="square"></div>
                <span class="title flex-grow-1 me-2">理工实验平台开展元旦前安全大检查，全面筑牢平台安全防线</span>
                <span class="flex-shrink-0">2026.01.06</span>
              </a>
            </li>
          </ul>
        </body>
      `,
    });

    await expect(lgsyptwzParser.parse(page)).resolves.toEqual([
      {
        sourceId: "16e7de8fdc4a47cfbbcfd69bad3087b8",
        rawId: "../ptxw/9bd754d9074d4f4db5078cf9b90ca127.htm",
        rawTitle: "节后首个工作日迅即行动，理工实验平台开展“四全”安全大检查",
        rawUrl: "https://iscst.bnuzh.edu.cn/ptxw/9bd754d9074d4f4db5078cf9b90ca127.htm",
        rawPublishedAt: "2026-02-27",
        rawChannel: "安全专题",
        rawSummary: undefined,
        extras: {
          requestId: "aqzt",
        },
      },
      {
        sourceId: "16e7de8fdc4a47cfbbcfd69bad3087b8",
        rawId: "af23d63878da464eab79ee344ef5faed.htm",
        rawTitle: "理工实验平台开展元旦前安全大检查，全面筑牢平台安全防线",
        rawUrl: "https://iscst.bnuzh.edu.cn/aqzt/af23d63878da464eab79ee344ef5faed.htm",
        rawPublishedAt: "2026-01-06",
        rawChannel: "安全专题",
        rawSummary: undefined,
        extras: {
          requestId: "aqzt",
        },
      },
    ]);
  });

  it("parses file-style guides and attachments without inventing summaries", async () => {
    const page = createPage({
      requestId: "yylc",
      requestUrl: "https://iscst.bnuzh.edu.cn/fwzn/yylc/index.htm",
      finalUrl: "https://iscst.bnuzh.edu.cn/fwzn/yylc/index.htm",
      bodyText: `
        <body>
          <ul class="article-list">
            <li class="item py-2 py-lg-3">
              <a href="../../docs/2023-08/fc91fc03cdd44a40bc0bc61cebbbcfb2.pdf" title="测试券购买流程" class="d-flex" target="_blank">
                <div class="square"></div>
                <span class="title flex-grow-1 me-2">测试券购买流程</span>
                <span class="flex-shrink-0">2023/08/22</span>
              </a>
            </li>
            <li class="item py-2 py-lg-3">
              <a href="../../docs/2023-08/781c2afc054845efa6c57d32e16aa563.docx" title="大仪预约系统操作手册（预约人版）" class="d-flex" target="_blank">
                <div class="square"></div>
                <span class="title flex-grow-1 me-2">大仪预约系统操作手册（预约人版）</span>
                <span class="flex-shrink-0">2023-08-22</span>
              </a>
            </li>
          </ul>
        </body>
      `,
    });

    await expect(lgsyptwzParser.parse(page)).resolves.toEqual([
      {
        sourceId: "16e7de8fdc4a47cfbbcfd69bad3087b8",
        rawId: "../../docs/2023-08/fc91fc03cdd44a40bc0bc61cebbbcfb2.pdf",
        rawTitle: "测试券购买流程",
        rawUrl: "https://iscst.bnuzh.edu.cn/docs/2023-08/fc91fc03cdd44a40bc0bc61cebbbcfb2.pdf",
        rawPublishedAt: "2023-08-22",
        rawChannel: "预约流程",
        rawSummary: undefined,
        extras: {
          requestId: "yylc",
        },
      },
      {
        sourceId: "16e7de8fdc4a47cfbbcfd69bad3087b8",
        rawId: "../../docs/2023-08/781c2afc054845efa6c57d32e16aa563.docx",
        rawTitle: "大仪预约系统操作手册（预约人版）",
        rawUrl: "https://iscst.bnuzh.edu.cn/docs/2023-08/781c2afc054845efa6c57d32e16aa563.docx",
        rawPublishedAt: "2023-08-22",
        rawChannel: "预约流程",
        rawSummary: undefined,
        extras: {
          requestId: "yylc",
        },
      },
    ]);
  });

  it("parses case-study lists surfaced from the homepage showcase section", async () => {
    const page = createPage({
      requestId: "alzs",
      requestUrl: "https://iscst.bnuzh.edu.cn/alzs/index.htm",
      finalUrl: "https://iscst.bnuzh.edu.cn/alzs/index.htm",
      bodyText: `
        <body>
          <ul class="article-list">
            <li class="item py-2 py-lg-3">
              <a href="dee4cecf7cc045649d76c260e2307a36.htm" class="d-flex">
                <div class="square"></div>
                <span class="title flex-grow-1 me-2">高速转盘式共聚焦成像显微镜在植物细胞内的动态变化机制中的应用</span>
                <span class="flex-shrink-0">2024/02/20</span>
              </a>
            </li>
            <li class="item py-2 py-lg-3">
              <a href="../alzs/5f53e2f9d40d46f69be153fd9f80abcd.htm" class="d-flex">
                <div class="square"></div>
                <span class="title flex-grow-1 me-2">超高分辨率激光共聚焦显微镜在植物方向的应用</span>
                <span class="flex-shrink-0">2024.02.20</span>
              </a>
            </li>
          </ul>
        </body>
      `,
    });

    await expect(lgsyptwzParser.parse(page)).resolves.toEqual([
      {
        sourceId: "16e7de8fdc4a47cfbbcfd69bad3087b8",
        rawId: "dee4cecf7cc045649d76c260e2307a36.htm",
        rawTitle: "高速转盘式共聚焦成像显微镜在植物细胞内的动态变化机制中的应用",
        rawUrl: "https://iscst.bnuzh.edu.cn/alzs/dee4cecf7cc045649d76c260e2307a36.htm",
        rawPublishedAt: "2024-02-20",
        rawChannel: "案例展示",
        rawSummary: undefined,
        extras: {
          requestId: "alzs",
        },
      },
      {
        sourceId: "16e7de8fdc4a47cfbbcfd69bad3087b8",
        rawId: "../alzs/5f53e2f9d40d46f69be153fd9f80abcd.htm",
        rawTitle: "超高分辨率激光共聚焦显微镜在植物方向的应用",
        rawUrl: "https://iscst.bnuzh.edu.cn/alzs/5f53e2f9d40d46f69be153fd9f80abcd.htm",
        rawPublishedAt: "2024-02-20",
        rawChannel: "案例展示",
        rawSummary: undefined,
        extras: {
          requestId: "alzs",
        },
      },
    ]);
  });

  it("parses equipment cards with stable channel labels", async () => {
    const page = createPage({
      requestId: "cffxzx",
      requestUrl: "https://iscst.bnuzh.edu.cn/yqsb/cffxzx/index.htm",
      finalUrl: "https://iscst.bnuzh.edu.cn/yqsb/cffxzx/index.htm",
      bodyText: `
        <body>
          <ul class="equipment-list equipment-list1 mb-0 list-unstyled">
            <li class="item py-3">
              <a href="b8753510ed7f45cdb3fdbf5d70ef85d3.htm" class="d-flex">
                <span class="title flex-grow-1 me-2">激光剥蚀-三重四极杆电感耦合等离子体质谱仪</span>
              </a>
            </li>
            <li class="item py-3">
              <a href="../cffxzx/cbf5cd20d5d54f39a3320959249757d5.htm" class="d-flex">
                <span class="title flex-grow-1 me-2">电感耦合等离子体发射光谱仪</span>
              </a>
            </li>
          </ul>
        </body>
      `,
    });

    await expect(lgsyptwzParser.parse(page)).resolves.toEqual([
      {
        sourceId: "16e7de8fdc4a47cfbbcfd69bad3087b8",
        rawId: "b8753510ed7f45cdb3fdbf5d70ef85d3.htm",
        rawTitle: "激光剥蚀-三重四极杆电感耦合等离子体质谱仪",
        rawUrl: "https://iscst.bnuzh.edu.cn/yqsb/cffxzx/b8753510ed7f45cdb3fdbf5d70ef85d3.htm",
        rawPublishedAt: undefined,
        rawChannel: "成分分析中心",
        rawSummary: undefined,
        extras: {
          requestId: "cffxzx",
        },
      },
      {
        sourceId: "16e7de8fdc4a47cfbbcfd69bad3087b8",
        rawId: "../cffxzx/cbf5cd20d5d54f39a3320959249757d5.htm",
        rawTitle: "电感耦合等离子体发射光谱仪",
        rawUrl: "https://iscst.bnuzh.edu.cn/yqsb/cffxzx/cbf5cd20d5d54f39a3320959249757d5.htm",
        rawPublishedAt: undefined,
        rawChannel: "成分分析中心",
        rawSummary: undefined,
        extras: {
          requestId: "cffxzx",
        },
      },
    ]);
  });
});
