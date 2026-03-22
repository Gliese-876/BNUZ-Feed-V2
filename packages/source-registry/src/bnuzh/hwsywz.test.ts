// @vitest-environment jsdom

import { describe, expect, it } from "vitest";

import type { RawPage } from "@bnuz-feed/contracts";

import { hwsywzFetchTargets, hwsywzParser } from "./hwsywz";

function createPage(
  overrides: Partial<RawPage> & Pick<RawPage, "requestId" | "requestUrl" | "finalUrl" | "bodyText">,
): RawPage {
  return {
    sourceId: "15f56dbc97ec445e95f40ceed144be2a",
    fetchedAt: "2026-03-21T00:00:00.000Z",
    ...overrides,
  };
}

describe("hwsywz", () => {
  it("declares the confirmed public message sources and excludes static intro pages", () => {
    expect(hwsywzFetchTargets).toEqual([
      { id: "hwyw", url: "https://hongwen.bnuzh.edu.cn/hwyw/index.htm", channel: "弘文要闻" },
      { id: "tzgg", url: "https://hongwen.bnuzh.edu.cn/tzgg/index.htm", channel: "通知公告" },
      { id: "hdyg", url: "https://hongwen.bnuzh.edu.cn/hdyg/index.htm", channel: "活动预告" },
      { id: "sytd/gltd", url: "https://hongwen.bnuzh.edu.cn/sytd/gltd/index.htm", channel: "管理团队" },
      { id: "sytd/dstd/xyds", url: "https://hongwen.bnuzh.edu.cn/sytd/dstd/xyds/index.htm", channel: "学业导师" },
      { id: "sytd/dstd/czds", url: "https://hongwen.bnuzh.edu.cn/sytd/dstd/czds/index.htm", channel: "成长导师" },
      { id: "sytd/xzjh", url: "https://hongwen.bnuzh.edu.cn/sytd/xzjh/index.htm", channel: "学长计划" },
      { id: "syzl/sykj", url: "https://hongwen.bnuzh.edu.cn/syzl/sykj/index.htm", channel: "书院空间" },
      { id: "syfw/gzzd", url: "https://hongwen.bnuzh.edu.cn/syfw/gzzd/index.htm", channel: "规章制度" },
      { id: "syfw/bszn", url: "https://hongwen.bnuzh.edu.cn/syfw/bszn/index.htm", channel: "办事指南" },
      { id: "syfw/lxwm", url: "https://hongwen.bnuzh.edu.cn/syfw/lxwm/index.htm", channel: "联系我们" },
      { id: "xssw/djgz", url: "https://hongwen.bnuzh.edu.cn/xssw/djgz/index.htm", channel: "党建工作" },
      { id: "xssw/btfc", url: "https://hongwen.bnuzh.edu.cn/xssw/btfc/index.htm", channel: "班团工作" },
      { id: "xssw/xyzd", url: "https://hongwen.bnuzh.edu.cn/xssw/xyzd/index.htm", channel: "学业指导" },
      { id: "xssw/xsjz", url: "https://hongwen.bnuzh.edu.cn/xssw/xsjz/index.htm", channel: "学生奖助" },
      { id: "xssw/gfjy", url: "https://hongwen.bnuzh.edu.cn/xssw/gfjy/index.htm", channel: "国防教育" },
      { id: "xssw/xljk", url: "https://hongwen.bnuzh.edu.cn/xssw/xljk/index.htm", channel: "心理健康" },
      { id: "xssw/hzjl", url: "https://hongwen.bnuzh.edu.cn/xssw/hzjl/index.htm", channel: "合作交流" },
      { id: "xssw/jyfw", url: "https://hongwen.bnuzh.edu.cn/xssw/jyfw/index.htm", channel: "就业服务" },
    ]);
  });

  it("parses the homepage news stream with external links and normalized dates", async () => {
    const page = createPage({
      requestId: "hwyw",
      requestUrl: "https://hongwen.bnuzh.edu.cn/hwyw/index.htm",
      finalUrl: "https://hongwen.bnuzh.edu.cn/hwyw/index.htm",
      bodyText: `
        <body>
          <ul class="article-list">
            <li class="item py-2 py-lg-3">
              <a href="https://mp.weixin.qq.com/s/OAysiIeBKR6CR-u21Sm_8w" title="弘文书院师生关注2026年全国两会召开， 热议两会精神" class="d-flex" target="_blank">
                <div class="square"></div>
                <span class="title flex-grow-1 me-2">弘文书院师生关注2026年全国两会召开， 热议两会精神</span>
                <span class="flex-shrink-0">2026/03/05</span>
              </a>
            </li>
            <li class="item py-2 py-lg-3">
              <a href="../docs/2025-09/demo.docx" title="弘文书院师生" class="d-flex">
                <div class="square"></div>
                <span class="title flex-grow-1 me-2">弘文书院师生</span>
                <span class="flex-shrink-0">2025.09.27</span>
              </a>
            </li>
          </ul>
        </body>
      `,
    });

    await expect(hwsywzParser.parse(page)).resolves.toEqual([
      {
        sourceId: "15f56dbc97ec445e95f40ceed144be2a",
        rawId: "https://mp.weixin.qq.com/s/OAysiIeBKR6CR-u21Sm_8w",
        rawTitle: "弘文书院师生关注2026年全国两会召开， 热议两会精神",
        rawUrl: "https://mp.weixin.qq.com/s/OAysiIeBKR6CR-u21Sm_8w",
        rawPublishedAt: "2026-03-05",
        rawChannel: "弘文要闻",
        rawSummary: undefined,
        extras: {
          requestId: "hwyw",
        },
      },
      {
        sourceId: "15f56dbc97ec445e95f40ceed144be2a",
        rawId: "../docs/2025-09/demo.docx",
        rawTitle: "弘文书院师生",
        rawUrl: "https://hongwen.bnuzh.edu.cn/docs/2025-09/demo.docx",
        rawPublishedAt: "2025-09-27",
        rawChannel: "弘文要闻",
        rawSummary: undefined,
        extras: {
          requestId: "hwyw",
        },
      },
    ]);
  });

  it("parses the attachment-style and contact-style lists across different request ids", async () => {
    const guidePage = createPage({
      requestId: "syfw/bszn",
      requestUrl: "https://hongwen.bnuzh.edu.cn/syfw/bszn/index.htm",
      finalUrl: "https://hongwen.bnuzh.edu.cn/syfw/bszn/index.htm",
      bodyText: `
        <body>
          <ul class="article-list">
            <li class="item py-2 py-lg-3">
              <a href="../../docs/2025-09/f5bded5fb28d431e9c26739ff2518ddf.pdf" title="北京师范大学珠海校区学生借用教室流程" class="d-flex" target="_blank">
                <div class="square"></div>
                <span class="title flex-grow-1 me-2">北京师范大学珠海校区学生借用教室流程</span>
                <span class="flex-shrink-0">2025/09/29</span>
              </a>
            </li>
            <li class="item py-2 py-lg-3">
              <a href="../../docs/2022-09/b8ea4bedeeed4af0baa779b171e5d0f7.doc" title="北京师范大学珠海园区学生普通临时困难补助申请表" class="d-flex">
                <div class="square"></div>
                <span class="title flex-grow-1 me-2">北京师范大学珠海园区学生普通临时困难补助申请表</span>
                <span class="flex-shrink-0">2022/09/06</span>
              </a>
            </li>
          </ul>
        </body>
      `,
    });

    await expect(hwsywzParser.parse(guidePage)).resolves.toEqual([
      {
        sourceId: "15f56dbc97ec445e95f40ceed144be2a",
        rawId: "../../docs/2025-09/f5bded5fb28d431e9c26739ff2518ddf.pdf",
        rawTitle: "北京师范大学珠海校区学生借用教室流程",
        rawUrl: "https://hongwen.bnuzh.edu.cn/docs/2025-09/f5bded5fb28d431e9c26739ff2518ddf.pdf",
        rawPublishedAt: "2025-09-29",
        rawChannel: "办事指南",
        rawSummary: undefined,
        extras: {
          requestId: "syfw/bszn",
        },
      },
      {
        sourceId: "15f56dbc97ec445e95f40ceed144be2a",
        rawId: "../../docs/2022-09/b8ea4bedeeed4af0baa779b171e5d0f7.doc",
        rawTitle: "北京师范大学珠海园区学生普通临时困难补助申请表",
        rawUrl: "https://hongwen.bnuzh.edu.cn/docs/2022-09/b8ea4bedeeed4af0baa779b171e5d0f7.doc",
        rawPublishedAt: "2022-09-06",
        rawChannel: "办事指南",
        rawSummary: undefined,
        extras: {
          requestId: "syfw/bszn",
        },
      },
    ]);

    const contactPage = createPage({
      requestId: "syfw/lxwm",
      requestUrl: "https://hongwen.bnuzh.edu.cn/syfw/lxwm/index.htm",
      finalUrl: "https://hongwen.bnuzh.edu.cn/syfw/lxwm/index.htm",
      bodyText: `
        <body>
          <ul class="article-list">
            <li class="item py-2 py-lg-3">
              <a href="75ac06862b074aec8cbb332271f63f2e.htm" title="联系书院" class="d-flex">
                <div class="square"></div>
                <span class="title flex-grow-1 me-2">联系书院</span>
                <span class="flex-shrink-0">2025/09/28</span>
              </a>
            </li>
          </ul>
        </body>
      `,
    });

    await expect(hwsywzParser.parse(contactPage)).resolves.toEqual([
      {
        sourceId: "15f56dbc97ec445e95f40ceed144be2a",
        rawId: "75ac06862b074aec8cbb332271f63f2e.htm",
        rawTitle: "联系书院",
        rawUrl: "https://hongwen.bnuzh.edu.cn/syfw/lxwm/75ac06862b074aec8cbb332271f63f2e.htm",
        rawPublishedAt: "2025-09-28",
        rawChannel: "联系我们",
        rawSummary: undefined,
        extras: {
          requestId: "syfw/lxwm",
        },
      },
    ]);
  });
});
