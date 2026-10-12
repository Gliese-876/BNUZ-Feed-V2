// @vitest-environment jsdom

import { describe, expect, it } from "vitest";

import type { RawPage } from "@bnuz-feed/contracts";

import { dwbwgzbgsFetchTargets, dwbwgzbgsParser } from "./dwbwgzbgs";

function createPage(requestId: string, bodyText: string): RawPage {
  const url = `https://dwbw.bnuzh.edu.cn/${requestId}/index.htm`;
  return {
    sourceId: "9f333a97019248b0bf8f48b232397257",
    requestId,
    requestUrl: url,
    finalUrl: url,
    fetchedAt: "2026-10-12T00:00:00.000Z",
    bodyText,
  };
}

describe("dwbwgzbgsParser", () => {
  it("covers the dated public lists and excludes static department and empty download pages", () => {
    expect(dwbwgzbgsFetchTargets.map((target) => target.id)).toEqual([
      "tzgg", "gzdt", "djyl", "aqsc/xfaq", "aqsc/xyza", "aqsc/xyjt",
      "paxy/jsjy", "paxy/ktnw", "paxy/fzyd", "aqjy", "zcfg", "hzyw/hzyw", "bszn", "jcsp",
    ]);
    expect(dwbwgzbgsFetchTargets.every((target) => target.url.startsWith("https://dwbw.bnuzh.edu.cn/"))).toBe(true);
  });

  it.each([
    { requestId: "tzgg", listClass: "common-article-list", href: "https://mp.weixin.qq.com/s/V-F5l-f0fEasjDvi2mpHFw", title: "关于毕业典礼期间实行校园道路交通管制的通知", day: "01", month: "2026.07", date: "2026-07-01", channel: "通知公告" },
    { requestId: "aqsc/xyjt", listClass: "common-pic-article-list", href: "https://mp.weixin.qq.com/s/V-F5l-f0fEasjDvi2mpHFw", title: "关于毕业典礼期间实行校园道路交通管制的通知", day: "01", month: "2026.07", date: "2026-07-01", channel: "安全生产/校园交通" },
    { requestId: "jcsp", listClass: "common-article-list", href: "90e33447045b4783becb17b206c8fb60.htm", title: "消防宣传月视频", day: "16", month: "2025.12", date: "2025-12-16", channel: "精彩视频" },
  ])("parses the live $requestId template with its split calendar date", async ({ requestId, listClass, href, title, day, month, date, channel }) => {
    const records = await dwbwgzbgsParser.parse(createPage(requestId, `
      <nav><a href="../index.htm">首页</a></nav>
      <ul class="${listClass} list-unstyled row">
        <li><a class="list-item" href="${href}">
          <div class="common-list-date"><span class="day">${day}</span><span class="month">${month}</span></div>
          <div class="title">${title}</div><div class="summary"> </div>
        </a></li>
      </ul>
    `));

    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      rawId: href,
      rawTitle: title,
      rawUrl: new URL(href, `https://dwbw.bnuzh.edu.cn/${requestId}/index.htm`).toString(),
      rawPublishedAt: date,
      rawChannel: channel,
      extras: { requestId },
    });
    expect(records[0]?.rawSummary).toBeUndefined();
  });

  it("skips missing titles and utility links inside a list", async () => {
    const records = await dwbwgzbgsParser.parse(createPage("tzgg", `
      <ul class="common-article-list">
        <li><a class="list-item" href="javascript:void(0)"><div class="title">下一页</div></a></li>
        <li><a class="list-item" href="#"><div class="title">更多</div></a></li>
        <li><a class="list-item" href="empty.htm"></a></li>
      </ul>
    `));
    expect(records).toEqual([]);
  });

  it("rejects unconfigured department pages", async () => {
    await expect(dwbwgzbgsParser.parse(createPage("bmgk/jgzn", "<p>机构职能</p>"))).rejects.toMatchObject({
      code: "PARSER_FAILED",
    });
  });
});
