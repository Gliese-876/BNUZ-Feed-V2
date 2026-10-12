// @vitest-environment jsdom

import { describe, expect, it } from "vitest";

import type { RawPage } from "@bnuz-feed/contracts";

import { bjsfdxzhxqsysaqysbglbgsFetchTargets, bjsfdxzhxqsysaqysbglbgsParser } from "./bjsfdxzhxqsysaqysbglbgs";

function createPage(requestId: string, bodyText: string): RawPage {
  const url = `https://ssb.bnuzh.edu.cn/${requestId}/index.htm`;
  return {
    sourceId: "0eb7d5617b434e70baf90c78007fbe01",
    requestId,
    requestUrl: url,
    finalUrl: url,
    fetchedAt: "2026-10-12T00:00:00.000Z",
    bodyText,
  };
}

describe("bjsfdxzhxqsysaqysbglbgsParser", () => {
  it("declares the confirmed dated lists without static, empty or login sections", () => {
    expect(bjsfdxzhxqsysaqysbglbgsFetchTargets.map((target) => target.id)).toEqual([
      "xwdt", "tzgg/xntz", "tzgg/gsgg", "gzzd/sysaqgl", "gzzd/yqsbgl", "gzzd/zcfg",
      "bszn/yqsbgl", "zltj/sysaqy", "zltj/dyzj/zzsh", "hdxx", "gzrl",
    ]);
    expect(bjsfdxzhxqsysaqysbglbgsFetchTargets.every((target) => target.url.startsWith("https://ssb.bnuzh.edu.cn/"))).toBe(true);
  });

  it.each([
    { requestId: "xwdt", href: "https://www.bnuzh.edu.cn/zhxw/92ff7ba802c4483487f2a1941d1f7891.htm", title: "珠海校区开展 2026 年度实验室安全检查工作", date: "2026.06.17", channel: "新闻动态" },
    { requestId: "tzgg/xntz", href: "https://qywx.bnuzh.edu.cn/wap/material?id=202", title: "关于组织开展珠海校区2026-2027学年实验室安全准入培训和考试工作的通知", date: "2026.09.15", channel: "通知公告/校内通知" },
    { requestId: "gzzd/sysaqgl", href: "a7067ba832a442d28990aac7c9bab9e2.htm", title: "珠实设办发〔2026〕1号&nbsp; 北京师范大学珠海校区实验室安全教育培训与准入管理实施细则", date: "2026.10.10", channel: "规章制度/实验室安全管理" },
    { requestId: "bszn/yqsbgl", href: "../../docs/2026-10/f28a5af7028f4853a04089cf1f8fcf31.doc", title: "特殊行政办公设备论证报告（模板）", date: "2026.10.10", channel: "办事指南/仪器设备管理" },
  ])("parses the live $requestId template and preserves article or document links", async ({ requestId, href, title, date, channel }) => {
    const records = await bjsfdxzhxqsysaqysbglbgsParser.parse(createPage(requestId, `
      <nav><a href="../index.htm">首页</a></nav>
      <ul class="list-unstyled common-article-list">
        <li><a class="article" href="${href}">
          <div class="common-publish-time">\n ${date}</div>
          <div class="article-content"><div class="title">${title}</div><div class="summary"></div></div>
        </a></li>
      </ul>
    `));

    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      rawId: href,
      rawTitle: title.replace(/&nbsp;\s*/g, " "),
      rawUrl: new URL(href, `https://ssb.bnuzh.edu.cn/${requestId}/index.htm`).toString(),
      rawPublishedAt: date.replace(/\./g, "-"),
      rawChannel: channel,
      extras: { requestId },
    });
  });

  it("retains the news summary without mixing it into the title", async () => {
    const records = await bjsfdxzhxqsysaqysbglbgsParser.parse(createPage("xwdt", `
      <ul class="common-article-list"><li>
        <a class="article" href="https://www.bnuzh.edu.cn/zhxw/92ff7ba802c4483487f2a1941d1f7891.htm">
          <div class="common-publish-time">2026.06.17</div>
          <div class="title">珠海校区开展 2026 年度实验室安全检查工作</div>
          <div class="summary">\n 检查组由实验室安全领域专家及实设办、资产办、保卫办、工程办等相关工作人员共同组成。\n </div>
        </a>
      </li></ul>
    `));
    expect(records[0]?.rawTitle).toBe("珠海校区开展 2026 年度实验室安全检查工作");
    expect(records[0]?.rawSummary).toBe("检查组由实验室安全领域专家及实设办、资产办、保卫办、工程办等相关工作人员共同组成。");
  });

  it("rejects unconfigured static pages", async () => {
    await expect(bjsfdxzhxqsysaqysbglbgsParser.parse(createPage("bmgk/ssbgk", "<p>实设办概况</p>"))).rejects.toMatchObject({
      code: "PARSER_FAILED",
    });
  });
});
