// @vitest-environment jsdom

import { describe, expect, it } from "vitest";

import type { RawPage } from "@bnuz-feed/contracts";

import { rcbFetchTargets, rcbParser } from "./rcb";

function createPage(
  overrides: Partial<RawPage> & Pick<RawPage, "requestId" | "requestUrl" | "finalUrl" | "bodyText">,
): RawPage {
  return {
    sourceId: "bfa3769881d248c5a8c379f84ba47149",
    fetchedAt: "2026-03-22T00:00:00.000Z",
    ...overrides,
  };
}

describe("rcbFetchTargets", () => {
  it("declares the confirmed public list pages", () => {
    expect(rcbFetchTargets).toEqual([
      { id: "tzgg", url: "https://hr.bnuzh.edu.cn/tzgg/index.htm", channel: "通知公告" },
      { id: "tzgg/index1", url: "https://hr.bnuzh.edu.cn/tzgg/index1.htm", channel: "通知公告" },
      { id: "tzgg/index2", url: "https://hr.bnuzh.edu.cn/tzgg/index2.htm", channel: "通知公告" },
      { id: "gzdt", url: "https://hr.bnuzh.edu.cn/gzdt/index.htm", channel: "工作动态" },
      { id: "bshgz", url: "https://hr.bnuzh.edu.cn/bshgz/index.htm", channel: "博士后工作" },
      { id: "zcwj", url: "https://hr.bnuzh.edu.cn/zcwj/index.htm", channel: "政策文件" },
      { id: "xzzq", url: "https://hr.bnuzh.edu.cn/xzzq/index.htm", channel: "下载专区" },
      { id: "bdrz", url: "https://hr.bnuzh.edu.cn/fwzn/bdrz/index.htm", channel: "报到入职" },
      { id: "rszm", url: "https://hr.bnuzh.edu.cn/fwzn/rszm/index.htm", channel: "社保公积金" },
      { id: "rssx", url: "https://hr.bnuzh.edu.cn/fwzn/rssx/index.htm", channel: "党组织关系" },
      { id: "pxjx2", url: "https://hr.bnuzh.edu.cn/fwzn/pxjx2/index.htm", channel: "户政业务" },
      { id: "kyqdf", url: "https://hr.bnuzh.edu.cn/fwzn/kyqdf/index.htm", channel: "科研启动费" },
      { id: "rssx1", url: "https://hr.bnuzh.edu.cn/fwzn/rssx1/index.htm", channel: "人事手续" },
    ]);
  });
});

describe("rcbParser", () => {
  it("parses notice pages with mixed relative and absolute links", async () => {
    const page = createPage({
      requestId: "tzgg/index1",
      requestUrl: "https://hr.bnuzh.edu.cn/tzgg/index1.htm",
      finalUrl: "https://hr.bnuzh.edu.cn/tzgg/index1.htm",
      bodyText: `
        <body>
          <ul class="listpt-ul2">
            <li>
              <span>2021-12-13</span>
              <a href="https://mp.weixin.qq.com/s/U6Pu9QKkMiYRDF47SwxBBA">关于2021年京师青年学者论坛的有关通知</a>
            </li>
            <li>
              <span>2020/12/16</span>
              <a href="12fbb6d9d02342efa7976b7b001f338f.htm">关于2021年体检报名的通知</a>
            </li>
          </ul>
        </body>
      `,
    });

    await expect(rcbParser.parse(page)).resolves.toEqual([
      {
        sourceId: "bfa3769881d248c5a8c379f84ba47149",
        rawId: "https://mp.weixin.qq.com/s/U6Pu9QKkMiYRDF47SwxBBA",
        rawTitle: "关于2021年京师青年学者论坛的有关通知",
        rawUrl: "https://mp.weixin.qq.com/s/U6Pu9QKkMiYRDF47SwxBBA",
        rawPublishedAt: "2021-12-13",
        rawChannel: "通知公告",
        rawSummary: undefined,
        extras: {
          requestId: "tzgg/index1",
        },
      },
      {
        sourceId: "bfa3769881d248c5a8c379f84ba47149",
        rawId: "12fbb6d9d02342efa7976b7b001f338f.htm",
        rawTitle: "关于2021年体检报名的通知",
        rawUrl: "https://hr.bnuzh.edu.cn/tzgg/12fbb6d9d02342efa7976b7b001f338f.htm",
        rawPublishedAt: "2020-12-16",
        rawChannel: "通知公告",
        rawSummary: undefined,
        extras: {
          requestId: "tzgg/index1",
        },
      },
    ]);
  });

  it("parses service-guide and download pages with dotted dates", async () => {
    const page = createPage({
      requestId: "xzzq",
      requestUrl: "https://hr.bnuzh.edu.cn/xzzq/index.htm",
      finalUrl: "https://hr.bnuzh.edu.cn/xzzq/index.htm",
      bodyText: `
        <body>
          <ul class="listpt-ul2">
            <li>
              <span>2024.08.30</span>
              <a href="../docs/2022-04/f6b420d7006a4a75a6df3cce2416fefa.docx">新入职教师延迟报到申请表</a>
            </li>
          </ul>
        </body>
      `,
    });

    await expect(rcbParser.parse(page)).resolves.toEqual([
      {
        sourceId: "bfa3769881d248c5a8c379f84ba47149",
        rawId: "../docs/2022-04/f6b420d7006a4a75a6df3cce2416fefa.docx",
        rawTitle: "新入职教师延迟报到申请表",
        rawUrl: "https://hr.bnuzh.edu.cn/docs/2022-04/f6b420d7006a4a75a6df3cce2416fefa.docx",
        rawPublishedAt: "2024-08-30",
        rawChannel: "下载专区",
        rawSummary: undefined,
        extras: {
          requestId: "xzzq",
        },
      },
    ]);
  });
});
