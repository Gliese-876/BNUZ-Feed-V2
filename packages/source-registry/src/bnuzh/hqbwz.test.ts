// @vitest-environment jsdom

import { describe, expect, it } from "vitest";

import type { RawPage } from "@bnuz-feed/contracts";

import { hqbwzFetchTargets, hqbwzParser } from "./hqbwz";

function createPage(
  overrides: Partial<RawPage> & Pick<RawPage, "requestId" | "requestUrl" | "finalUrl" | "bodyText">,
): RawPage {
  return {
    sourceId: "86753130ceb542929a38b9d9319e9372",
    fetchedAt: "2026-03-21T00:00:00.000Z",
    ...overrides,
  };
}

describe("hqbwz parser", () => {
  it("declares the 14 active public targets confirmed by Playwright", () => {
    expect(hqbwzFetchTargets).toEqual([
      { id: "xwdt", url: "https://hqb.bnuzh.edu.cn/xwgg/xwdt/index.htm", channel: "新闻动态" },
      { id: "tzgg", url: "https://hqb.bnuzh.edu.cn/xwgg/tzgg/index.htm", channel: "通知公告" },
      { id: "xynxgzcgz", url: "https://hqb.bnuzh.edu.cn/zcgz/xynxgzcgz/index.htm", channel: "行业内相关政策规章" },
      { id: "xxxgzcgz", url: "https://hqb.bnuzh.edu.cn/zcgz/xxxgzcgz/index.htm", channel: "学校相关政策规章" },
      { id: "zbgz", url: "https://hqb.bnuzh.edu.cn/dqjs/zbgz/index.htm", channel: "支部工作" },
      { id: "zhsw", url: "https://hqb.bnuzh.edu.cn/bszn/zhsw/index.htm", channel: "综合事务" },
      { id: "xsyb", url: "https://hqb.bnuzh.edu.cn/bszn/xsyb/index.htm", channel: "学生医保" },
      { id: "ggws", url: "https://hqb.bnuzh.edu.cn/bszn/ggws/index.htm", channel: "公共卫生" },
      { id: "cyfw", url: "https://hqb.bnuzh.edu.cn/bszn/cyfw/index.htm", channel: "餐饮服务" },
      { id: "zgwy", url: "https://hqb.bnuzh.edu.cn/bszn/zgwy/index.htm", channel: "自管物业" },
      { id: "yllh", url: "https://hqb.bnuzh.edu.cn/bszn/yllh/index.htm", channel: "园林绿化" },
      { id: "dpcl", url: "https://hqb.bnuzh.edu.cn/bszn/dpcl/index.htm", channel: "电瓶车辆" },
      { id: "ldjy", url: "https://hqb.bnuzh.edu.cn/ldjy/index.blk.htm", channel: "劳动教育" },
      { id: "xzzq", url: "https://hqb.bnuzh.edu.cn/xzzq/index.htm", channel: "下载专区" },
    ]);
  });

  it("parses the news list with resolved relative links and date fields", async () => {
    const page = createPage({
      requestId: "xwdt",
      requestUrl: "https://hqb.bnuzh.edu.cn/xwgg/xwdt/index.htm",
      finalUrl: "https://hqb.bnuzh.edu.cn/xwgg/xwdt/index.htm",
      bodyText: `
        <ul class="common-pic-article-list">
          <li>
            <a class="article p-3" href="cf01af7973c44d69be79dafdb15fbeef.htm" title="后勤办公室开展春季开学前安全检查">
              <div class="cover-box"><img class="cover" src="../../images/2026-03/demo.jpg" alt=""></div>
              <div class="content">
                <div class="title-box">
                  <div class="common-list-date">
                    <div class="year">2026</div>
                    <div class="month-day">03·02</div>
                  </div>
                  <div class="title">后勤办公室开展春季开学前安全检查</div>
                </div>
                <div class="summary">为扎实做好新学期后勤各项服务保障工作。</div>
                <img class="arrow mb-3" src="../../assets/images/icons/list-arrow.svg" alt="">
              </div>
            </a>
          </li>
        </ul>
      `,
    });

    const records = await hqbwzParser.parse(page);

    expect(records).toEqual([
      {
        sourceId: "86753130ceb542929a38b9d9319e9372",
        rawId: "cf01af7973c44d69be79dafdb15fbeef.htm",
        rawTitle: "后勤办公室开展春季开学前安全检查",
        rawUrl: "https://hqb.bnuzh.edu.cn/xwgg/xwdt/cf01af7973c44d69be79dafdb15fbeef.htm",
        rawPublishedAt: "2026-03-02",
        rawChannel: "新闻动态",
        rawSummary: "为扎实做好新学期后勤各项服务保障工作。",
        extras: {
          requestId: "xwdt",
        },
      },
    ]);
  });

  it("parses the notice list with summaries and resolved relative links", async () => {
    const page = createPage({
      requestId: "tzgg",
      requestUrl: "https://hqb.bnuzh.edu.cn/xwgg/tzgg/index.htm",
      finalUrl: "https://hqb.bnuzh.edu.cn/xwgg/tzgg/index.htm",
      bodyText: `
        <ul class="common-article-list">
          <li>
            <a class="article p-3" href="4c55259d54a14c8c97d475ba7e809f9d.htm" title="关于开展校内车辆便民服务的公告">
              <div class="common-list-date">
                <div class="year">2026</div>
                <div class="month-day">02·25</div>
              </div>
              <div class="content">
                <div class="title">关于开展校内车辆便民服务的公告</div>
                <div class="summary">新春假期结束，不少教职工车辆长时间停放校内。</div>
              </div>
            </a>
          </li>
        </ul>
      `,
    });

    const records = await hqbwzParser.parse(page);

    expect(records[0]).toEqual({
      sourceId: "86753130ceb542929a38b9d9319e9372",
      rawId: "4c55259d54a14c8c97d475ba7e809f9d.htm",
      rawTitle: "关于开展校内车辆便民服务的公告",
      rawUrl: "https://hqb.bnuzh.edu.cn/xwgg/tzgg/4c55259d54a14c8c97d475ba7e809f9d.htm",
      rawPublishedAt: "2026-02-25",
      rawChannel: "通知公告",
      rawSummary: "新春假期结束，不少教职工车辆长时间停放校内。",
      extras: {
        requestId: "tzgg",
      },
    });
  });

  it("parses policy PDFs without fabricating dates", async () => {
    const page = createPage({
      requestId: "xynxgzcgz",
      requestUrl: "https://hqb.bnuzh.edu.cn/zcgz/xynxgzcgz/index.htm",
      finalUrl: "https://hqb.bnuzh.edu.cn/zcgz/xynxgzcgz/index.htm",
      bodyText: `
        <ul class="common-file-list">
          <li>
            <a class="file p-3" href="../../docs/2024-12/a947fbfbd41244b0951427d316d9a03f.pdf" title="【国务院】关于全面加强新时代大中小学劳动教育的意见" download="">
              <div class="name">
                <img class="icon" src="../../assets/images/icons/folder.svg" alt="">
                <span>【国务院】关于全面加强新时代大中小学劳动教育的意见</span>
              </div>
              <div class="download">
                <img class="icon" src="../../assets/images/icons/download.svg" alt="">
                <span>下载</span>
              </div>
            </a>
          </li>
        </ul>
      `,
    });

    const records = await hqbwzParser.parse(page);

    expect(records).toEqual([
      {
        sourceId: "86753130ceb542929a38b9d9319e9372",
        rawId: "../../docs/2024-12/a947fbfbd41244b0951427d316d9a03f.pdf",
        rawTitle: "【国务院】关于全面加强新时代大中小学劳动教育的意见",
        rawUrl: "https://hqb.bnuzh.edu.cn/docs/2024-12/a947fbfbd41244b0951427d316d9a03f.pdf",
        rawPublishedAt: undefined,
        rawChannel: "行业内相关政策规章",
        rawSummary: undefined,
        extras: {
          requestId: "xynxgzcgz",
        },
      },
    ]);
  });

  it("parses service pages that share the common article layout", async () => {
    const page = createPage({
      requestId: "zhsw",
      requestUrl: "https://hqb.bnuzh.edu.cn/bszn/zhsw/index.htm",
      finalUrl: "https://hqb.bnuzh.edu.cn/bszn/zhsw/index.htm",
      bodyText: `
        <ul class="common-article-list">
          <li>
            <a class="article p-3" href="58a3a5759893462996eb3a76f9b390d0.htm" title="自管物业服务中心">
              <div class="common-list-date">
                <div class="year">2024</div>
                <div class="month-day">12·19</div>
              </div>
              <div class="content">
                <div class="title">自管物业服务中心</div>
                <div class="summary">负责木铎楼、弘文楼、立身轩的办公室、教室、自习室、会议室等日常管理。</div>
              </div>
            </a>
          </li>
        </ul>
      `,
    });

    const records = await hqbwzParser.parse(page);

    expect(records).toEqual([
      {
        sourceId: "86753130ceb542929a38b9d9319e9372",
        rawId: "58a3a5759893462996eb3a76f9b390d0.htm",
        rawTitle: "自管物业服务中心",
        rawUrl: "https://hqb.bnuzh.edu.cn/bszn/zhsw/58a3a5759893462996eb3a76f9b390d0.htm",
        rawPublishedAt: "2024-12-19",
        rawChannel: "综合事务",
        rawSummary: "负责木铎楼、弘文楼、立身轩的办公室、教室、自习室、会议室等日常管理。",
        extras: {
          requestId: "zhsw",
        },
      },
    ]);
  });

  it("parses party-work articles with the configured channel", async () => {
    const page = createPage({
      requestId: "zbgz",
      requestUrl: "https://hqb.bnuzh.edu.cn/dqjs/zbgz/index.htm",
      finalUrl: "https://hqb.bnuzh.edu.cn/dqjs/zbgz/index.htm",
      bodyText: `
        <ul class="common-article-list">
          <li>
            <a class="article p-3" href="10b3846f27d84cf5844ee6961ae7072e.htm" title="后勤党支部召开树立和践行正确政绩观学习教育启动部署会">
              <div class="common-list-date">
                <div class="year">2026</div>
                <div class="month-day">03·17</div>
              </div>
              <div class="content">
                <div class="title">后勤党支部召开树立和践行正确政绩观学习教育启动部署会</div>
                <div class="summary">3月16日下午，后勤党支部召开树立和践行正确政绩观学习教育启动部署会。</div>
              </div>
            </a>
          </li>
        </ul>
      `,
    });

    const records = await hqbwzParser.parse(page);

    expect(records).toEqual([
      {
        sourceId: "86753130ceb542929a38b9d9319e9372",
        rawId: "10b3846f27d84cf5844ee6961ae7072e.htm",
        rawTitle: "后勤党支部召开树立和践行正确政绩观学习教育启动部署会",
        rawUrl: "https://hqb.bnuzh.edu.cn/dqjs/zbgz/10b3846f27d84cf5844ee6961ae7072e.htm",
        rawPublishedAt: "2026-03-17",
        rawChannel: "支部工作",
        rawSummary: "3月16日下午，后勤党支部召开树立和践行正确政绩观学习教育启动部署会。",
        extras: {
          requestId: "zbgz",
        },
      },
    ]);
  });

  it("parses labor-education items from the dedicated blk list", async () => {
    const page = createPage({
      requestId: "ldjy",
      requestUrl: "https://hqb.bnuzh.edu.cn/ldjy/index.blk.htm",
      finalUrl: "https://hqb.bnuzh.edu.cn/ldjy/index.blk.htm",
      bodyText: `
        <ul class="common-article-list">
          <li>
            <a class="article p-3" href="371a3aead24c41f49acf43b3769eb975.blk.htm" title="后勤办公室2024-2025学年第二学期劳动教育实践活动汇总表">
              <div class="common-list-date">
                <div class="year">2025</div>
                <div class="month-day">06·25</div>
              </div>
              <div class="content">
                <div class="title">后勤办公室2024-2025学年第二学期劳动教育实践活动汇总表</div>
              </div>
            </a>
          </li>
        </ul>
      `,
    });

    const records = await hqbwzParser.parse(page);

    expect(records).toEqual([
      {
        sourceId: "86753130ceb542929a38b9d9319e9372",
        rawId: "371a3aead24c41f49acf43b3769eb975.blk.htm",
        rawTitle: "后勤办公室2024-2025学年第二学期劳动教育实践活动汇总表",
        rawUrl: "https://hqb.bnuzh.edu.cn/ldjy/371a3aead24c41f49acf43b3769eb975.blk.htm",
        rawPublishedAt: "2025-06-25",
        rawChannel: "劳动教育",
        rawSummary: undefined,
        extras: {
          requestId: "ldjy",
        },
      },
    ]);
  });

  it("parses the download section as a file list", async () => {
    const page = createPage({
      requestId: "xzzq",
      requestUrl: "https://hqb.bnuzh.edu.cn/xzzq/index.htm",
      finalUrl: "https://hqb.bnuzh.edu.cn/xzzq/index.htm",
      bodyText: `
        <ul class="common-file-list">
          <li>
            <a class="file p-3" href="../docs/2024-12/90efee51d42741579d2603fa6eaf2fc7.pdf" title="珠海市异地就医登记备案表" download="">
              <div class="name">
                <img class="icon" src="../assets/images/icons/folder.svg" alt="">
                <span>珠海市异地就医登记备案表</span>
              </div>
              <div class="download">
                <img class="icon" src="../assets/images/icons/download.svg" alt="">
                <span>下载</span>
              </div>
            </a>
          </li>
        </ul>
      `,
    });

    const records = await hqbwzParser.parse(page);

    expect(records).toEqual([
      {
        sourceId: "86753130ceb542929a38b9d9319e9372",
        rawId: "../docs/2024-12/90efee51d42741579d2603fa6eaf2fc7.pdf",
        rawTitle: "珠海市异地就医登记备案表",
        rawUrl: "https://hqb.bnuzh.edu.cn/docs/2024-12/90efee51d42741579d2603fa6eaf2fc7.pdf",
        rawPublishedAt: undefined,
        rawChannel: "下载专区",
        rawSummary: undefined,
        extras: {
          requestId: "xzzq",
        },
      },
    ]);
  });
});
