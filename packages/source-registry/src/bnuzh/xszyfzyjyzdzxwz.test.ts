// @vitest-environment jsdom

import { describe, expect, it } from "vitest";

import type { RawPage } from "@bnuz-feed/contracts";

import { xszyfzyjyzdzxwzFetchTargets, xszyfzyjyzdzxwzParser } from "./xszyfzyjyzdzxwz";

function createPage(
  overrides: Partial<RawPage> & Pick<RawPage, "requestId" | "requestUrl" | "finalUrl" | "bodyText">,
): RawPage {
  return {
    sourceId: "9e442f682ee94c92a56260b87daadd3d",
    fetchedAt: "2026-03-21T00:00:00.000Z",
    ...overrides,
  };
}

describe("xszyfzyjyzdzxwz", () => {
  it("declares the confirmed public list sources and corrects the dead alias routes", () => {
    expect(xszyfzyjyzdzxwzFetchTargets).toEqual([
      { id: "news", url: "https://career.bnuzh.edu.cn/index.php/web/Index/news-list", channel: "新闻资讯" },
      { id: "notice", url: "https://career.bnuzh.edu.cn/index.php/web/Index/notice-list", channel: "通知公告" },
      { id: "jiuyehuodong", url: "https://career.bnuzh.edu.cn/index.php/web/Index/employment-list", channel: "就业活动" },
      { id: "jiuyezhidao", url: "https://career.bnuzh.edu.cn/index.php/web/Index/article-list?type=jiuyezhidao", channel: "就业指导" },
      { id: "jiuyezhengce", url: "https://career.bnuzh.edu.cn/index.php/web/Index/policy-list", channel: "就业政策" },
      { id: "qiuzhixinlu", url: "https://career.bnuzh.edu.cn/index.php/web/Index/article-list?type=qiuzhixinlu", channel: "求职心路" },
      { id: "jianlizhizuo", url: "https://career.bnuzh.edu.cn/index.php/web/Index/article-list?type=jianlizhizuo", channel: "简历制作" },
      { id: "gykc", url: "https://career.bnuzh.edu.cn/index.php/web/Index/special-list?type=gykc", channel: "公益课程" },
      { id: "preach", url: "https://career.bnuzh.edu.cn/index.php/web/Index/preach-list", channel: "宣讲会" },
      { id: "jobfair", url: "https://career.bnuzh.edu.cn/index.php/web/Index/jobfair-list", channel: "双选会" },
      { id: "jobs-brief", url: "https://career.bnuzh.edu.cn/index.php/web/Index/jobs-brief-list", channel: "招聘简讯" },
      { id: "jobs-brief-gongwuyuan", url: "https://career.bnuzh.edu.cn/index.php/web/Index/jobs-brief-list?type=gongwuyuan", channel: "公职就业" },
      { id: "jobs-brief-jichujiaoyu", url: "https://career.bnuzh.edu.cn/index.php/web/Index/jobs-brief-list?type=jichujiaoyu", channel: "基础教育" },
      { id: "job", url: "https://career.bnuzh.edu.cn/index.php/web/Index/job-list", channel: "职位信息" },
    ]);
  });

  it("parses content-list pages and skips the static nav detail links", async () => {
    const page = createPage({
      requestId: "notice",
      requestUrl: "https://career.bnuzh.edu.cn/index.php/web/Index/notice-list",
      finalUrl: "https://career.bnuzh.edu.cn/index.php/web/Index/notice-list",
      bodyText: `
        <body>
          <nav>
            <a href="webinfo-detail?name=RecruitingProcess">招聘流程</a>
          </nav>
          <main>
            <div class="content-list">
              <ul>
                <li>
                  <a href="../Index/notice-detail?id=439" title="北京师范大学珠海校区关于申报2025届毕业生赴西部、基层及艰苦边远地区就业奖励的通知">
                    北京师范大学珠海校区关于申报2025届毕业生赴西部、基层及艰苦边远地区就业奖励的通知
                  </a>
                  <span class="date">2025/05/26</span>
                </li>
                <li>
                  <a href="../Index/notice-detail?id=419">关于北京师范大学珠海校区2025届毕业生申请珠海市求职创业补贴（第二批）的通知</a>
                  <span class="time">2025-04-22</span>
                </li>
              </ul>
            </div>
          </main>
        </body>
      `,
    });

    await expect(xszyfzyjyzdzxwzParser.parse(page)).resolves.toEqual([
      {
        sourceId: "9e442f682ee94c92a56260b87daadd3d",
        rawId: "../Index/notice-detail?id=439",
        rawTitle: "北京师范大学珠海校区关于申报2025届毕业生赴西部、基层及艰苦边远地区就业奖励的通知",
        rawUrl: "https://career.bnuzh.edu.cn/index.php/web/Index/notice-detail?id=439",
        rawPublishedAt: "2025-05-26",
        rawChannel: "通知公告",
        rawSummary: undefined,
        extras: {
          requestId: "notice",
        },
      },
      {
        sourceId: "9e442f682ee94c92a56260b87daadd3d",
        rawId: "../Index/notice-detail?id=419",
        rawTitle: "关于北京师范大学珠海校区2025届毕业生申请珠海市求职创业补贴（第二批）的通知",
        rawUrl: "https://career.bnuzh.edu.cn/index.php/web/Index/notice-detail?id=419",
        rawPublishedAt: "2025-04-22",
        rawChannel: "通知公告",
        rawSummary: undefined,
        extras: {
          requestId: "notice",
        },
      },
    ]);
  });

  it("parses the article list pages with MM/DD YYYY dates and absolute URL resolution", async () => {
    const page = createPage({
      requestId: "jianlizhizuo",
      requestUrl: "https://career.bnuzh.edu.cn/index.php/web/Index/article-list?type=jianlizhizuo",
      finalUrl: "https://career.bnuzh.edu.cn/index.php/web/Index/article-list?type=jianlizhizuo",
      bodyText: `
        <body>
          <main>
            <div class="content-list">
              <ul>
                <li>
                  <a href="../../Index/article-detail?id=257">找工作，简历如何准备？攻略收好</a>
                  <span class="date">11/19 2024</span>
                </li>
                <li>
                  <a href="../../Index/article-detail?id=258">简历中最容易出现的误区，一文教你提前避免</a>
                  <span class="date">2023-10-07</span>
                </li>
              </ul>
            </div>
          </main>
        </body>
      `,
    });

    await expect(xszyfzyjyzdzxwzParser.parse(page)).resolves.toEqual([
      {
        sourceId: "9e442f682ee94c92a56260b87daadd3d",
        rawId: "../../Index/article-detail?id=257",
        rawTitle: "找工作，简历如何准备？攻略收好",
        rawUrl: "https://career.bnuzh.edu.cn/index.php/Index/article-detail?id=257",
        rawPublishedAt: "2024-11-19",
        rawChannel: "简历制作",
        rawSummary: undefined,
        extras: {
          requestId: "jianlizhizuo",
        },
      },
      {
        sourceId: "9e442f682ee94c92a56260b87daadd3d",
        rawId: "../../Index/article-detail?id=258",
        rawTitle: "简历中最容易出现的误区，一文教你提前避免",
        rawUrl: "https://career.bnuzh.edu.cn/index.php/Index/article-detail?id=258",
        rawPublishedAt: "2023-10-07",
        rawChannel: "简历制作",
        rawSummary: undefined,
        extras: {
          requestId: "jianlizhizuo",
        },
      },
    ]);
  });

  it("supports no-date pages without fabricating timestamps", async () => {
    const page = createPage({
      requestId: "preach",
      requestUrl: "https://career.bnuzh.edu.cn/index.php/web/Index/preach-list",
      finalUrl: "https://career.bnuzh.edu.cn/index.php/web/Index/preach-list",
      bodyText: `
        <body>
          <main>
            <div class="list-media-content">
              <ul>
                <li>
                  <a href="/index.php/web/Index/preach-detail?id=134">顺德梁銶琚职业技术学校面向2025届毕业生公开招聘公办在编教师宣讲</a>
                </li>
              </ul>
            </div>
          </main>
        </body>
      `,
    });

    await expect(xszyfzyjyzdzxwzParser.parse(page)).resolves.toEqual([
      {
        sourceId: "9e442f682ee94c92a56260b87daadd3d",
        rawId: "/index.php/web/Index/preach-detail?id=134",
        rawTitle: "顺德梁銶琚职业技术学校面向2025届毕业生公开招聘公办在编教师宣讲",
        rawUrl: "https://career.bnuzh.edu.cn/index.php/web/Index/preach-detail?id=134",
        rawPublishedAt: undefined,
        rawChannel: "宣讲会",
        rawSummary: undefined,
        extras: {
          requestId: "preach",
        },
      },
    ]);
  });

  it("parses jobs-brief category pages via the dedicated jobsbrief list container", async () => {
    const page = createPage({
      requestId: "jobs-brief-gongwuyuan",
      requestUrl: "https://career.bnuzh.edu.cn/index.php/web/Index/jobs-brief-list?type=gongwuyuan",
      finalUrl: "https://career.bnuzh.edu.cn/index.php/web/Index/jobs-brief-list?type=gongwuyuan",
      bodyText: `
        <body>
          <div class="jobsbrief-lists">
            <ul>
              <li>
                <a href="jobs-brief-detail?id=STUXSQ1">国家发展和改革委员会直属单位2026年度第二批公开招聘公告 2026-03-19 学校发布 若干人</a>
              </li>
            </ul>
          </div>
        </body>
      `,
    });

    await expect(xszyfzyjyzdzxwzParser.parse(page)).resolves.toEqual([
      {
        sourceId: "9e442f682ee94c92a56260b87daadd3d",
        rawId: "jobs-brief-detail?id=STUXSQ1",
        rawTitle: "国家发展和改革委员会直属单位2026年度第二批公开招聘公告 2026-03-19 学校发布 若干人",
        rawUrl: "https://career.bnuzh.edu.cn/index.php/web/Index/jobs-brief-detail?id=STUXSQ1",
        rawPublishedAt: "2026-03-19",
        rawChannel: "公职就业",
        rawSummary: undefined,
        extras: {
          requestId: "jobs-brief-gongwuyuan",
        },
      },
    ]);
  });

  it("parses position-list pages via the jobs-list container", async () => {
    const page = createPage({
      requestId: "job",
      requestUrl: "https://career.bnuzh.edu.cn/index.php/web/Index/job-list",
      finalUrl: "https://career.bnuzh.edu.cn/index.php/web/Index/job-list",
      bodyText: `
        <body>
          <div class="jobs-list">
            <div class="row mg-b-20">
              <div class="col-xs-6">
                <a href="job-detail?id=860">理财顾问 03/18 发布 国金证券股份有限公司珠海前河北路证券营业部 8000～10000元/月</a>
              </div>
            </div>
          </div>
        </body>
      `,
    });

    await expect(xszyfzyjyzdzxwzParser.parse(page)).resolves.toEqual([
      {
        sourceId: "9e442f682ee94c92a56260b87daadd3d",
        rawId: "job-detail?id=860",
        rawTitle: "理财顾问 03/18 发布 国金证券股份有限公司珠海前河北路证券营业部 8000～10000元/月",
        rawUrl: "https://career.bnuzh.edu.cn/index.php/web/Index/job-detail?id=860",
        rawPublishedAt: "03-18",
        rawChannel: "职位信息",
        rawSummary: undefined,
        extras: {
          requestId: "job",
        },
      },
    ]);
  });
});
