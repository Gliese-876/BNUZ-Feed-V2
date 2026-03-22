// @vitest-environment jsdom

import { describe, expect, it } from "vitest";

import type { RawPage } from "@bnuz-feed/contracts";

import { xqfzjjhwzFetchTargets, xqfzjjhwzParser } from "./xqfzjjhwz";

function createPage(
  overrides: Partial<RawPage> & Pick<RawPage, "requestId" | "requestUrl" | "finalUrl" | "bodyText">,
): RawPage {
  return {
    sourceId: "71c3567220ec405ab75c90983f9822af",
    fetchedAt: "2026-03-21T00:00:00.000Z",
    ...overrides,
  };
}

describe("xqfzjjhwz parser", () => {
  it("declares the expected fetch targets", () => {
    expect(xqfzjjhwzFetchTargets).toEqual([
      {
        id: "sylb",
        url: "https://edf.bnuzh.edu.cn/sylb/index.htm",
        channel: "首页轮播",
      },
      {
        id: "tzgg",
        url: "https://edf.bnuzh.edu.cn/tzgg/index.htm",
        channel: "通知公告",
      },
      {
        id: "xwzx",
        url: "https://edf.bnuzh.edu.cn/xwzx/index.htm",
        channel: "新闻资讯",
      },
      {
        id: "gzdt",
        url: "https://edf.bnuzh.edu.cn/xwdt/gzdt/index.htm",
        channel: "工作动态",
      },
      {
        id: "ysjh",
        url: "https://edf.bnuzh.edu.cn/ysjh/index.htm",
        channel: "优师计划",
      },
      {
        id: "xmzs",
        url: "https://edf.bnuzh.edu.cn/xmzs/index.htm",
        channel: "项目展示",
      },
      {
        id: "mkxm",
        url: "https://edf.bnuzh.edu.cn/mkxm/index.htm",
        channel: "募款项目",
      },
      {
        id: "zyztd",
        url: "https://edf.bnuzh.edu.cn/zyztd/index.htm",
        channel: "志愿者团队",
      },
      {
        id: "njbghsj",
        url: "https://edf.bnuzh.edu.cn/xxgk/njbghsj/index.htm",
        channel: "年检报告和审计",
      },
      {
        id: "glbf",
        url: "https://edf.bnuzh.edu.cn/xxgk/glbf/index.htm",
        channel: "管理办法",
      },
      {
        id: "bslc",
        url: "https://edf.bnuzh.edu.cn/xxgk/bslc/index.htm",
        channel: "办事流程",
      },
      {
        id: "zcfg",
        url: "https://edf.bnuzh.edu.cn/xxgk/zcfg/index.htm",
        channel: "政策法规",
      },
    ]);
  });

  it("extracts pure title list items and resolves cross-directory relative links", async () => {
    const page = createPage({
      requestId: "zcfg",
      requestUrl: "https://edf.bnuzh.edu.cn/xxgk/zcfg/index.htm",
      finalUrl: "https://edf.bnuzh.edu.cn/xxgk/zcfg/index.htm",
      bodyText: `
        <!DOCTYPE html>
        <html lang="zh-CN">
          <head>
            <meta charset="UTF-8" />
            <title>政策法规 - 校区发展基金会网站</title>
          </head>
          <body>
            <div class="common-page-container">
              <ul class="list-unstyled mb-3 mb-lg-5 common-article-list3">
                <li class="mb-3">
                  <a class="item p-3" href="../../tzgg/506ac3e0c7614b23989afb10a5d2c18b.htm">
                    <span class="title">广东省北京师范大学珠海校区教育发展基金会章程</span>
                    <img class="icon ms-3 ms-lg-5" width="24" height="24" src="../../assets/images/icons/article-list-arrow.svg" alt="" />
                  </a>
                </li>
              </ul>
            </div>
          </body>
        </html>
      `,
    });

    const records = await xqfzjjhwzParser.parse(page);

    expect(records).toEqual([
      {
        sourceId: "71c3567220ec405ab75c90983f9822af",
        rawId: "../../tzgg/506ac3e0c7614b23989afb10a5d2c18b.htm",
        rawTitle: "广东省北京师范大学珠海校区教育发展基金会章程",
        rawUrl: "https://edf.bnuzh.edu.cn/tzgg/506ac3e0c7614b23989afb10a5d2c18b.htm",
        rawPublishedAt: undefined,
        rawChannel: "政策法规",
        rawSummary: undefined,
        extras: {
          requestId: "zcfg",
        },
      },
    ]);
  });

  it("extracts date cards and normalizes visible month/day text", async () => {
    const page = createPage({
      requestId: "gzdt",
      requestUrl: "https://edf.bnuzh.edu.cn/xwdt/gzdt/index.htm",
      finalUrl: "https://edf.bnuzh.edu.cn/xwdt/gzdt/index.htm",
      bodyText: `
        <!DOCTYPE html>
        <html lang="zh-CN">
          <head>
            <meta charset="UTF-8" />
            <title>工作动态 - 校区发展基金会网站</title>
          </head>
          <body>
            <div class="common-page-container">
              <ul class="list-unstyled mb-3 mb-lg-5 common-article-list1">
                <li class="mb-3">
                  <a class="item p-3" href="5bf55c0a83c647a6814bf4d0120ec6c1.htm">
                    <div class="content">
                      <div class="date px-3">
                        <span class="day">20</span>
                        <span class="month">9月</span>
                      </div>
                      <div class="info px-3">
                        <span class="mb-2 title">北师大“绘览童书”乡村儿童阅读项目亮相第十届中国公益慈善项目交流展示会</span>
                        <span class="summary">2023年9月15-17日，北京师范大学“绘览童书”乡村儿童阅读项目亮相第十届中国公益...</span>
                      </div>
                    </div>
                  </a>
                </li>
              </ul>
            </div>
          </body>
        </html>
      `,
    });

    const records = await xqfzjjhwzParser.parse(page);

    expect(records).toEqual([
      {
        sourceId: "71c3567220ec405ab75c90983f9822af",
        rawId: "5bf55c0a83c647a6814bf4d0120ec6c1.htm",
        rawTitle: "北师大“绘览童书”乡村儿童阅读项目亮相第十届中国公益慈善项目交流展示会",
        rawUrl: "https://edf.bnuzh.edu.cn/xwdt/gzdt/5bf55c0a83c647a6814bf4d0120ec6c1.htm",
        rawPublishedAt: "09-20",
        rawChannel: "工作动态",
        rawSummary: "2023年9月15-17日，北京师范大学“绘览童书”乡村儿童阅读项目亮相第十届中国公益...",
        extras: {
          requestId: "gzdt",
        },
      },
    ]);
  });

  it("extracts project cards with summaries and image-grid cards", async () => {
    const projectPage = createPage({
      requestId: "mkxm",
      requestUrl: "https://edf.bnuzh.edu.cn/mkxm/index.htm",
      finalUrl: "https://edf.bnuzh.edu.cn/mkxm/index.htm",
      bodyText: `
        <!DOCTYPE html>
        <html lang="zh-CN">
          <head>
            <meta charset="UTF-8" />
            <title>募款项目 - 校区发展基金会网站</title>
          </head>
          <body>
            <div class="common-page-container">
              <div class="row g-3 g-lg-5 project-list">
                <div class="col-lg-4">
                  <a href="rcpy/63feaf83a899455c96a4848a59142a09.htm" class="item px-3 pt-4">
                    <div>
                      <div class="fs-2 text-primary fw-bold">人才培养</div>
                      <div class="summary my-3 my-lg-4">大学的发展关键在人才。</div>
                    </div>
                    <img class="cover" src="../images/2023-08/c57a5123d4c34f8e846fdf08f163996a.jpg" alt="" />
                  </a>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    const projectRecords = await xqfzjjhwzParser.parse(projectPage);

    expect(projectRecords).toEqual([
      {
        sourceId: "71c3567220ec405ab75c90983f9822af",
        rawId: "rcpy/63feaf83a899455c96a4848a59142a09.htm",
        rawTitle: "人才培养",
        rawUrl: "https://edf.bnuzh.edu.cn/mkxm/rcpy/63feaf83a899455c96a4848a59142a09.htm",
        rawPublishedAt: undefined,
        rawChannel: "募款项目",
        rawSummary: "大学的发展关键在人才。",
        extras: {
          requestId: "mkxm",
        },
      },
    ]);
  });

  it("extracts volunteer team cards", async () => {
    const page = createPage({
      requestId: "zyztd",
      requestUrl: "https://edf.bnuzh.edu.cn/zyztd/index.htm",
      finalUrl: "https://edf.bnuzh.edu.cn/zyztd/index.htm",
      bodyText: `
        <!DOCTYPE html>
        <html lang="zh-CN">
          <head>
            <meta charset="UTF-8" />
            <title>志愿者团队 - 校区发展基金会网站</title>
          </head>
          <body>
            <div class="common-page-container">
              <div class="row g-3 g-lg-5 common-article-list2 mb-3 mb-lg-5">
                <div class="col-lg-4">
                  <a class="item p-3" href="ba0fdfe0cfe7406fa38074d913d168b1.htm">
                    <div class="cover img-bg mb-3" style="background-image: url('../images/2024-12/8dc2a4c48ee044c3bed09d355a636469.jpg');"></div>
                    <div>
                      <p class="title mb-3">北京师范大学珠海校区教育发展基金会第九届志愿者团队</p>
                      <p class="summary mb-0">北京师范大学珠海校区教育发展基金会志愿者的服务范围包括： ...</p>
                    </div>
                  </a>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    const records = await xqfzjjhwzParser.parse(page);

    expect(records).toEqual([
      {
        sourceId: "71c3567220ec405ab75c90983f9822af",
        rawId: "ba0fdfe0cfe7406fa38074d913d168b1.htm",
        rawTitle: "北京师范大学珠海校区教育发展基金会第九届志愿者团队",
        rawUrl: "https://edf.bnuzh.edu.cn/zyztd/ba0fdfe0cfe7406fa38074d913d168b1.htm",
        rawPublishedAt: undefined,
        rawChannel: "志愿者团队",
        rawSummary: "北京师范大学珠海校区教育发展基金会志愿者的服务范围包括： ...",
        extras: {
          requestId: "zyztd",
        },
      },
    ]);
  });
});
