// @vitest-environment jsdom

import { describe, expect, it } from "vitest";

import type { RawPage } from "@bnuz-feed/contracts";

import { wlxxzxFetchTargets, wlxxzxParser } from "./wlxxzx";

function createPage(
  overrides: Partial<RawPage> & Pick<RawPage, "requestId" | "requestUrl" | "finalUrl" | "bodyText">,
): RawPage {
  return {
    sourceId: "9e48dbe870a04ac5aefbefff5aeb68e1",
    fetchedAt: "2026-03-21T00:00:00.000Z",
    ...overrides,
  };
}

describe("wlxxzx parser", () => {
  it("declares the confirmed public list sources", () => {
    expect(wlxxzxFetchTargets).toEqual([
      { id: "tzgg", url: "https://nic.bnuzh.edu.cn/tzgg/index.htm", channel: "通知公告" },
      { id: "tzgg/index1", url: "https://nic.bnuzh.edu.cn/tzgg/index1.htm", channel: "通知公告" },
      { id: "gzzd", url: "https://nic.bnuzh.edu.cn/gzzd/index.htm", channel: "规章制度" },
      { id: "ldgg", url: "https://nic.bnuzh.edu.cn/aqzl/ldgg/index.htm", channel: "漏洞公告" },
      { id: "jsfwzn", url: "https://nic.bnuzh.edu.cn/bzzn/jsfwzn/index.htm", channel: "教师服务指南" },
      { id: "jsfwzn/index1", url: "https://nic.bnuzh.edu.cn/bzzn/jsfwzn/index1.htm", channel: "教师服务指南" },
      { id: "xsfwzn", url: "https://nic.bnuzh.edu.cn/bzzn/xsfwzn/index.htm", channel: "学生服务指南" },
      { id: "xsfwzn/index1", url: "https://nic.bnuzh.edu.cn/bzzn/xsfwzn/index1.htm", channel: "学生服务指南" },
    ]);
  });

  it("extracts public list entries, normalizes relative URLs and keeps date-less items", async () => {
    const page = createPage({
      requestId: "jsfwzn/index1",
      requestUrl: "https://nic.bnuzh.edu.cn/bzzn/jsfwzn/index1.htm",
      finalUrl: "https://nic.bnuzh.edu.cn/bzzn/jsfwzn/index1.htm",
      bodyText: `
        <!DOCTYPE html>
        <html lang="zh-CN">
          <body>
            <header>
              <ul>
                <li><a href="../../index.htm">首页</a></li>
                <li><a href="../index.htm">帮助指南</a></li>
              </ul>
            </header>
            <div class="subPage">
              <div class="nav">
                <ul>
                  <li><a href="../jsfwzn/index.htm">教师服务指南</a></li>
                  <li class="active"><a href="index.htm">学生服务指南</a></li>
                </ul>
              </div>
              <div class="main">
                <ul class="BNUlist01">
                  <li>
                    <a href="7c78468bc03548cc93c0619e9a6beb46.htm">
                      <span class="date">06-27 2024</span>
                      <span class="title">数字京师.珠海登录及密保服务指南</span>
                    </a>
                  </li>
                  <li>
                    <a href="https://mp.weixin.qq.com/s/PevvzMrOMKXhn7uCYA92eA">
                      <span class="title">北京师范大学珠海校区eduroam便携指南</span>
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    await expect(wlxxzxParser.parse(page)).resolves.toEqual([
      {
        sourceId: "9e48dbe870a04ac5aefbefff5aeb68e1",
        rawId: "7c78468bc03548cc93c0619e9a6beb46.htm",
        rawTitle: "数字京师.珠海登录及密保服务指南",
        rawUrl: "https://nic.bnuzh.edu.cn/bzzn/jsfwzn/7c78468bc03548cc93c0619e9a6beb46.htm",
        rawPublishedAt: "2024-06-27",
        rawChannel: "教师服务指南",
        rawSummary: undefined,
        extras: {
          requestId: "jsfwzn/index1",
        },
      },
      {
        sourceId: "9e48dbe870a04ac5aefbefff5aeb68e1",
        rawId: "https://mp.weixin.qq.com/s/PevvzMrOMKXhn7uCYA92eA",
        rawTitle: "北京师范大学珠海校区eduroam便携指南",
        rawUrl: "https://mp.weixin.qq.com/s/PevvzMrOMKXhn7uCYA92eA",
        rawPublishedAt: undefined,
        rawChannel: "教师服务指南",
        rawSummary: undefined,
        extras: {
          requestId: "jsfwzn/index1",
        },
      },
    ]);
  });
});
