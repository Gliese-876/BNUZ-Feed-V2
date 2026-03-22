// @vitest-environment jsdom

import { describe, expect, it } from "vitest";

import type { RawPage } from "@bnuz-feed/contracts";

import { bjzxFetchTargets, bjzxParser } from "./bjzx";

function createPage(
  overrides: Partial<RawPage> & Pick<RawPage, "requestId" | "requestUrl" | "finalUrl" | "bodyText">,
): RawPage {
  return {
    sourceId: "eb20cbad5a894fc9aee0de698ef38038",
    fetchedAt: "2026-03-21T00:00:00.000Z",
    ...overrides,
  };
}

describe("bjzxParser", () => {
  it("declares the homepage attachment target", () => {
    expect(bjzxFetchTargets).toEqual([
      {
        id: "home",
        url: "https://zhbjzx.bnuzh.edu.cn/",
        channel: "附件下载",
      },
    ]);
  });

  it("parses homepage document attachments and resolves relative URLs", async () => {
    const page = createPage({
      requestId: "home",
      requestUrl: "https://zhbjzx.bnuzh.edu.cn/",
      finalUrl: "https://zhbjzx.bnuzh.edu.cn/",
      bodyText: `
        <main>
          <section>
            <div>
              <a href="docs/2025-12/d6fdfef8d3b542e897779e915a338ccb.pdf">珠海校区师生来京常见问答.pdf 下载文件</a>
            </div>
            <div>
              <a href="/docs/2025-12/manual.pdf">珠海校区北京中心实用手册 下载文件</a>
            </div>
            <div>
              <a href="docs/2025-12/guide.pdf">北京中心使用申请系统操作指南（教职工） 下载文件</a>
            </div>
            <div>
              <a href="https://zhbjzx.bnuzh.edu.cn/docs/2025-12/space.pdf">北京中心空间资源预约系统操作指南 下载文件</a>
            </div>
            <div>
              <a href="docs/2025-12/life.pdf">北京师范大学校园生活指南（北京校区） 下载文件</a>
            </div>
            <div>
              <a href="docs/2025-12/registration.xlsx">北京中心学生信息登记表 下载文件</a>
            </div>
            <a href="https://v.bnuzh.edu.cn">点击进入：数字京师·珠海</a>
          </section>
        </main>
      `,
    });

    const records = await bjzxParser.parse(page);

    expect(records).toEqual([
      {
        sourceId: "eb20cbad5a894fc9aee0de698ef38038",
        rawId: "docs/2025-12/d6fdfef8d3b542e897779e915a338ccb.pdf",
        rawTitle: "珠海校区师生来京常见问答",
        rawUrl: "https://zhbjzx.bnuzh.edu.cn/docs/2025-12/d6fdfef8d3b542e897779e915a338ccb.pdf",
        rawPublishedAt: undefined,
        rawChannel: "附件下载",
        rawSummary: undefined,
        extras: {
          requestId: "home",
        },
      },
      {
        sourceId: "eb20cbad5a894fc9aee0de698ef38038",
        rawId: "/docs/2025-12/manual.pdf",
        rawTitle: "珠海校区北京中心实用手册",
        rawUrl: "https://zhbjzx.bnuzh.edu.cn/docs/2025-12/manual.pdf",
        rawPublishedAt: undefined,
        rawChannel: "附件下载",
        rawSummary: undefined,
        extras: {
          requestId: "home",
        },
      },
      {
        sourceId: "eb20cbad5a894fc9aee0de698ef38038",
        rawId: "docs/2025-12/guide.pdf",
        rawTitle: "北京中心使用申请系统操作指南（教职工）",
        rawUrl: "https://zhbjzx.bnuzh.edu.cn/docs/2025-12/guide.pdf",
        rawPublishedAt: undefined,
        rawChannel: "附件下载",
        rawSummary: undefined,
        extras: {
          requestId: "home",
        },
      },
      {
        sourceId: "eb20cbad5a894fc9aee0de698ef38038",
        rawId: "https://zhbjzx.bnuzh.edu.cn/docs/2025-12/space.pdf",
        rawTitle: "北京中心空间资源预约系统操作指南",
        rawUrl: "https://zhbjzx.bnuzh.edu.cn/docs/2025-12/space.pdf",
        rawPublishedAt: undefined,
        rawChannel: "附件下载",
        rawSummary: undefined,
        extras: {
          requestId: "home",
        },
      },
      {
        sourceId: "eb20cbad5a894fc9aee0de698ef38038",
        rawId: "docs/2025-12/life.pdf",
        rawTitle: "北京师范大学校园生活指南（北京校区）",
        rawUrl: "https://zhbjzx.bnuzh.edu.cn/docs/2025-12/life.pdf",
        rawPublishedAt: undefined,
        rawChannel: "附件下载",
        rawSummary: undefined,
        extras: {
          requestId: "home",
        },
      },
      {
        sourceId: "eb20cbad5a894fc9aee0de698ef38038",
        rawId: "docs/2025-12/registration.xlsx",
        rawTitle: "北京中心学生信息登记表",
        rawUrl: "https://zhbjzx.bnuzh.edu.cn/docs/2025-12/registration.xlsx",
        rawPublishedAt: undefined,
        rawChannel: "附件下载",
        rawSummary: undefined,
        extras: {
          requestId: "home",
        },
      },
    ]);
  });
});
