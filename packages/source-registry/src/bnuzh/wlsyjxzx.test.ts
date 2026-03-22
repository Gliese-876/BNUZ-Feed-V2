// @vitest-environment jsdom

import { describe, expect, it } from "vitest";

import type { RawPage } from "@bnuz-feed/contracts";

import { wlsyjxzxFetchTargets, wlsyjxzxParser } from "./wlsyjxzx";

function createPage(
  overrides: Partial<RawPage> & Pick<RawPage, "requestId" | "requestUrl" | "finalUrl" | "bodyText">,
): RawPage {
  return {
    sourceId: "09acfd3aeff34c479786499b7d8b0b7a",
    fetchedAt: "2026-03-21T00:00:00.000Z",
    ...overrides,
  };
}

describe("wlsyjxzxParser", () => {
  it("declares the confirmed stable targets and excludes landing or empty pages", () => {
    expect(wlsyjxzxFetchTargets).toEqual([
      { id: "xwgg", url: "https://sczx.bnuzh.edu.cn/wlsyjxzx/xwgg/index.htm", channel: "新闻公告" },
      { id: "zxfc", url: "https://sczx.bnuzh.edu.cn/wlsyjxzx/zxfc/index.htm", channel: "中心风采" },
      { id: "sjcx/xkjs", url: "https://sczx.bnuzh.edu.cn/wlsyjxzx/sjcx/xkjs/index.htm", channel: "学科竞赛" },
      { id: "sjcx/cxcy", url: "https://sczx.bnuzh.edu.cn/wlsyjxzx/sjcx/cxcy/index.htm", channel: "创新创业" },
      { id: "syjx/szzy", url: "https://sczx.bnuzh.edu.cn/wlsyjxzx/syjx/szzy/index.htm", channel: "数字资源" },
      { id: "sbhj/yqsb", url: "https://sczx.bnuzh.edu.cn/wlsyjxzx/sbhj/yqsb/index.htm", channel: "仪器设备" },
      { id: "kjzc/kjqy", url: "https://sczx.bnuzh.edu.cn/wlsyjxzx/kjzc/kjqy/index.htm", channel: "科技前沿" },
      { id: "kjzc/kpyd", url: "https://sczx.bnuzh.edu.cn/wlsyjxzx/kjzc/kpyd/index.htm", channel: "科普园地" },
      { id: "kjzc/yssy", url: "https://sczx.bnuzh.edu.cn/wlsyjxzx/kjzc/yssy/index.htm", channel: "演示实验" },
      { id: "syaq/aqzd", url: "https://sczx.bnuzh.edu.cn/wlsyjxzx/syaq/aqzd/index.htm", channel: "安全制度" },
      { id: "syaq/aqjy", url: "https://sczx.bnuzh.edu.cn/wlsyjxzx/syaq/aqjy/index.htm", channel: "安全教育" },
      { id: "syaq/aqzr", url: "https://sczx.bnuzh.edu.cn/wlsyjxzx/syaq/aqzr/index.htm", channel: "安全准入" },
      { id: "syaq/aqjc", url: "https://sczx.bnuzh.edu.cn/wlsyjxzx/syaq/aqjc/index.htm", channel: "安全检查" },
      { id: "cgzs/jscg/jshj", url: "https://sczx.bnuzh.edu.cn/wlsyjxzx/cgzs/jscg/jshj/index.htm", channel: "教师获奖" },
      { id: "cgzs/jscg/jgxm", url: "https://sczx.bnuzh.edu.cn/wlsyjxzx/cgzs/jscg/jgxm/index.htm", channel: "教改项目" },
      { id: "cgzs/jscg/zllw", url: "https://sczx.bnuzh.edu.cn/wlsyjxzx/cgzs/jscg/zllw/index.htm", channel: "专利论文" },
      { id: "cgzs/xscg/xsxm", url: "https://sczx.bnuzh.edu.cn/wlsyjxzx/cgzs/xscg/xsxm/index.htm", channel: "学生项目" },
      { id: "cgzs/xscg/xkjs", url: "https://sczx.bnuzh.edu.cn/wlsyjxzx/cgzs/xscg/xkjs/index.htm", channel: "学科竞赛" },
      { id: "cgzs/xscg/xslw", url: "https://sczx.bnuzh.edu.cn/wlsyjxzx/cgzs/xscg/xslw/index.htm", channel: "学生论文" },
      { id: "cgzs/xscg/xshj1", url: "https://sczx.bnuzh.edu.cn/wlsyjxzx/cgzs/xscg/xshj1/index.htm", channel: "学生获奖" },
    ]);
  });

  it("parses the news list and keeps relative and external article links", async () => {
    const page = createPage({
      requestId: "xwgg",
      requestUrl: "https://sczx.bnuzh.edu.cn/wlsyjxzx/xwgg/index.htm",
      finalUrl: "https://sczx.bnuzh.edu.cn/wlsyjxzx/xwgg/index.htm",
      bodyText: `
        <body>
          <header>
            <a href="index.htm"><p>首页</p></a>
          </header>
          <section>
            <a href="75064f2649544093af78669cd1e15b75.htm">
              <p>北京师范大学珠海校区代表队在2025年中国大学生物理学术竞赛（CUPT） 中南赛区竞赛中斩获佳绩！</p>
              <span class="time">2025-09-05</span>
            </a>
            <a href="https://jwb.bnuzh.edu.cn/sjjx/xkjs/8d0b287a311c45dda6878d6b9dc89860.htm">
              <p>北京师范大学珠海校区关于2025年度未来卓越教师教学技能大赛报名的通知</p>
              <span class="time">2025-04-15</span>
            </a>
            <a href="75064f2649544093af78669cd1e15b75.htm">
              <p>北京师范大学珠海校区代表队在2025年中国大学生物理学术竞赛（CUPT） 中南赛区竞赛中斩获佳绩！</p>
              <span class="time">2025-09-05</span>
            </a>
          </section>
        </body>
      `,
    });

    const records = await wlsyjxzxParser.parse(page);

    expect(records).toEqual([
      {
        sourceId: "09acfd3aeff34c479786499b7d8b0b7a",
        rawId: "75064f2649544093af78669cd1e15b75.htm",
        rawTitle: "北京师范大学珠海校区代表队在2025年中国大学生物理学术竞赛（CUPT） 中南赛区竞赛中斩获佳绩！",
        rawUrl: "https://sczx.bnuzh.edu.cn/wlsyjxzx/xwgg/75064f2649544093af78669cd1e15b75.htm",
        rawPublishedAt: "2025-09-05",
        rawChannel: "新闻公告",
        extras: { requestId: "xwgg" },
      },
      {
        sourceId: "09acfd3aeff34c479786499b7d8b0b7a",
        rawId: "https://jwb.bnuzh.edu.cn/sjjx/xkjs/8d0b287a311c45dda6878d6b9dc89860.htm",
        rawTitle: "北京师范大学珠海校区关于2025年度未来卓越教师教学技能大赛报名的通知",
        rawUrl: "https://jwb.bnuzh.edu.cn/sjjx/xkjs/8d0b287a311c45dda6878d6b9dc89860.htm",
        rawPublishedAt: "2025-04-15",
        rawChannel: "新闻公告",
        extras: { requestId: "xwgg" },
      },
    ]);
  });

  it("parses image-card and external resource lists", async () => {
    const page = createPage({
      requestId: "kjzc/kpyd",
      requestUrl: "https://sczx.bnuzh.edu.cn/wlsyjxzx/kjzc/kpyd/index.htm",
      finalUrl: "https://sczx.bnuzh.edu.cn/wlsyjxzx/kjzc/kpyd/index.htm",
      bodyText: `
        <body>
          <aside>
            <a href="../index.htm"><p>科技简史</p></a>
          </aside>
          <section>
            <a href="https://mp.weixin.qq.com/s/H-yj8Q0K57hqC2F_fMtbsA">
              <img src="cover-a.jpg" alt="">
              <p>走近“批判性科学思维”</p>
            </a>
            <a href="https://mp.weixin.qq.com/s/j9mVjq8uhRiKp69FEoMlcQ">
              <img src="cover-b.jpg" alt="">
              <p>冰到底是怎么长出来的？基本没人知道是怎么回事，直到有一天我们做成了这件事｜江颖</p>
            </a>
          </section>
        </body>
      `,
    });

    const records = await wlsyjxzxParser.parse(page);

    expect(records).toEqual([
      {
        sourceId: "09acfd3aeff34c479786499b7d8b0b7a",
        rawId: "https://mp.weixin.qq.com/s/H-yj8Q0K57hqC2F_fMtbsA",
        rawTitle: "走近“批判性科学思维”",
        rawUrl: "https://mp.weixin.qq.com/s/H-yj8Q0K57hqC2F_fMtbsA",
        rawPublishedAt: undefined,
        rawChannel: "科普园地",
        extras: { requestId: "kjzc/kpyd" },
      },
      {
        sourceId: "09acfd3aeff34c479786499b7d8b0b7a",
        rawId: "https://mp.weixin.qq.com/s/j9mVjq8uhRiKp69FEoMlcQ",
        rawTitle: "冰到底是怎么长出来的？基本没人知道是怎么回事，直到有一天我们做成了这件事｜江颖",
        rawUrl: "https://mp.weixin.qq.com/s/j9mVjq8uhRiKp69FEoMlcQ",
        rawPublishedAt: undefined,
        rawChannel: "科普园地",
        extras: { requestId: "kjzc/kpyd" },
      },
    ]);
  });

  it("parses nested stable lists with dates", async () => {
    const page = createPage({
      requestId: "cgzs/xscg/xsxm",
      requestUrl: "https://sczx.bnuzh.edu.cn/wlsyjxzx/cgzs/xscg/xsxm/index.htm",
      finalUrl: "https://sczx.bnuzh.edu.cn/wlsyjxzx/cgzs/xscg/xsxm/index.htm",
      bodyText: `
        <body>
          <section>
            <a href="https://one.bnuzh.edu.cn/dcp/forward.action?path=/portal/portal&p=pimShow&id=1bfa9f5fb7b349ab9c45934b06aa2c85&tt=3aeae575ec3240deb250791a8375685c">
              <p>北京师范大学珠海校区2025年度大学生创新创业训练计划项目结项验收结果</p>
              <span class="time">2025-06-03</span>
            </a>
            <a href="72aefe49015a450d9916f030251a2bbd.htm">
              <p>北京师范大学珠海校区2024年度大学生创新创业训练计划项目中期检查结果</p>
              <span class="time">2025-03-21</span>
            </a>
          </section>
        </body>
      `,
    });

    const records = await wlsyjxzxParser.parse(page);

    expect(records).toEqual([
      {
        sourceId: "09acfd3aeff34c479786499b7d8b0b7a",
        rawId: "https://one.bnuzh.edu.cn/dcp/forward.action?path=/portal/portal&p=pimShow&id=1bfa9f5fb7b349ab9c45934b06aa2c85&tt=3aeae575ec3240deb250791a8375685c",
        rawTitle: "北京师范大学珠海校区2025年度大学生创新创业训练计划项目结项验收结果",
        rawUrl: "https://one.bnuzh.edu.cn/dcp/forward.action?path=/portal/portal&p=pimShow&id=1bfa9f5fb7b349ab9c45934b06aa2c85&tt=3aeae575ec3240deb250791a8375685c",
        rawPublishedAt: "2025-06-03",
        rawChannel: "学生项目",
        extras: { requestId: "cgzs/xscg/xsxm" },
      },
      {
        sourceId: "09acfd3aeff34c479786499b7d8b0b7a",
        rawId: "72aefe49015a450d9916f030251a2bbd.htm",
        rawTitle: "北京师范大学珠海校区2024年度大学生创新创业训练计划项目中期检查结果",
        rawUrl: "https://sczx.bnuzh.edu.cn/wlsyjxzx/cgzs/xscg/xsxm/72aefe49015a450d9916f030251a2bbd.htm",
        rawPublishedAt: "2025-03-21",
        rawChannel: "学生项目",
        extras: { requestId: "cgzs/xscg/xsxm" },
      },
    ]);
  });
});
