// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import type { RawPage } from "@bnuz-feed/contracts";
import { xzxsyFetchTargets, xzxsyParser } from "./xzxsy";

function page(requestId: string, bodyText: string): RawPage {
  const target = xzxsyFetchTargets.find((item) => item.id === requestId)!;
  return { sourceId: "87aa44758c0c48bb956bdae3bc09c3ad", requestId,
    requestUrl: target.url, finalUrl: target.url, bodyText, fetchedAt: "2026-10-12T00:00:00.000Z" };
}

describe("replacement Zhixing site", () => {
  it("uses the replacement identity and channels instead of the archived student paths", () => {
    expect(xzxsyFetchTargets).toHaveLength(18);
    expect(xzxsyFetchTargets.some((target) => target.url.includes("/xsyd/"))).toBe(false);
    expect(xzxsyFetchTargets.find((target) => target.id === "xssw/xsjz")?.channel).toBe("学生奖助");
  });

  it("extracts standard dated lists and resolves details under their new folders", async () => {
    const records = await xzxsyParser.parse(page("xssw/xsjz", `
      <nav><a href="index.htm">学生奖助</a></nav>
      <ul class="common-article-list"><li><a class="article" href="dc3fa.htm">
        <div>关于开展学费减免工作的通知</div><div class="time">2026-09-08</div>
      </a></li></ul>`));
    expect(records).toMatchObject([{ rawTitle: "关于开展学费减免工作的通知",
      rawUrl: "https://zhixing.bnuzh.edu.cn/xssw/xsjz/dc3fa.htm", rawPublishedAt: "2026-09-08", rawChannel: "学生奖助" }]);
  });

  it("extracts photo cards with calendar dates and summaries", async () => {
    const records = await xzxsyParser.parse(page("djyl/zthd", `
      <div class="common-pic-article"><a class="article" href="594685.htm">
        <div class="calendar"><span class="date">16/</span><span class="month">9月</span><span class="year">2026</span></div>
        <div class="title">知行书院召开学习教育总结会</div><div class="summary">学习教育总结</div>
      </a></div>`));
    expect(records).toMatchObject([{ rawTitle: "知行书院召开学习教育总结会", rawPublishedAt: "2026-09-16", rawSummary: "学习教育总结" }]);
  });
});
