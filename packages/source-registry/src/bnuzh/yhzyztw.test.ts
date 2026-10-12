// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import type { RawPage } from "@bnuz-feed/contracts";
import { yhzyztwParser } from "./yhzyztw";

function page(requestId: string, bodyText: string): RawPage {
  const url = requestId === "guides" ? "https://fwzn.bnuzh.edu.cn/" : "https://fwzn.bnuzh.edu.cn/rmwt/index.htm";
  return { sourceId: "26a599f2bce14c728cc87ac0f05c8236", requestId, requestUrl: url, finalUrl: url,
    bodyText, fetchedAt: "2026-10-12T00:00:00.000Z" };
}

describe("public user guides", () => {
  it("keeps real guide links without inventing publication dates", async () => {
    const records = await yhzyztwParser.parse(page("guides", `
      <a href="#public-service">公共服务指引</a>
      <a class="service-item" href="ggfwzy/xxfw/manual.htm">信息化教师手册<img alt="" src="arrow.svg"></a>
      <a class="service-item" href="javascript:void(0)">占位入口</a>`));
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ rawTitle: "信息化教师手册", rawUrl: "https://fwzn.bnuzh.edu.cn/ggfwzy/xxfw/manual.htm", rawChannel: "服务指引" });
    expect(records[0]?.rawPublishedAt).toBeUndefined();
  });

  it("separates FAQ titles from their answer previews", async () => {
    const records = await yhzyztwParser.parse(page("rmwt", `<a class="hot-item" href="faq.htm">
      <span class="qa-badge">问</span><span class="qa-text">常见问题（第一期）</span>
      <span class="qa-badge">答</span><span class="qa-text answer-text">如何登录信息系统？</span></a>`));
    expect(records).toMatchObject([{ rawTitle: "常见问题（第一期）", rawSummary: "如何登录信息系统？", rawChannel: "热门问题" }]);
  });
});
