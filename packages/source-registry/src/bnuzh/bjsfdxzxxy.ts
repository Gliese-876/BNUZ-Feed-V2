import type { FetchTarget } from "@bnuz-feed/contracts";

import { createConfiguredHtmlListParser, type HtmlListParserConfig } from "../parsers/configuredHtmlListParser";

type SiteTarget = {
  requestId: string;
  url: string;
  channel: string;
};

const baseUrl = "https://zhixing.bnuzh.edu.cn/";

const newsCardTargets: SiteTarget[] = [
  { requestId: "xwkx", url: `${baseUrl}xwkx/index.htm`, channel: "新闻快讯" },
];

const standardTargets: SiteTarget[] = [
  { requestId: "tzgg", url: `${baseUrl}xsyd/tzgg/index.htm`, channel: "通知公告" },
  { requestId: "stzz", url: `${baseUrl}xsyd/stzz/index.htm`, channel: "组织团体" },
  { requestId: "zyfz", url: `${baseUrl}xsyd/zyfz/index.htm`, channel: "生涯发展" },
  { requestId: "zxxw", url: `${baseUrl}xsyd/zxxw/index.htm`, channel: "知心小屋" },
  { requestId: "sdsf", url: `${baseUrl}djgh/sdsf/index.htm`, channel: "师德师风" },
  { requestId: "zxjt", url: `${baseUrl}zxsy/zxjt/index.htm`, channel: "知行讲坛" },
  { requestId: "zxdh", url: `${baseUrl}zxsy/zxdh/index.htm`, channel: "知行导航" },
  { requestId: "zxyx", url: `${baseUrl}zxsy/zxyx/index.htm`, channel: "知行研习" },
  { requestId: "zxsl", url: `${baseUrl}zxsy/zxsl/index.htm`, channel: "知行沙龙" },
  { requestId: "zxhy", url: `${baseUrl}zxsy/zxhy/index.htm`, channel: "知行合一" },
  { requestId: "zxwq", url: `${baseUrl}zxsy/zxwq/index.htm`, channel: "知行湾区" },
  { requestId: "gzzd", url: `${baseUrl}bszn/gzzd/index.htm`, channel: "规章制度" },
  { requestId: "bslc", url: `${baseUrl}bszn/bslc/index.htm`, channel: "办事流程" },
  { requestId: "xyfc", url: `${baseUrl}xyzj/xyfc/index.htm`, channel: "校友风采" },
  { requestId: "XWBD", url: `${baseUrl}mtzx/XWBD/index.htm`, channel: "校外报道" },
];

const photoTargets: SiteTarget[] = [
  { requestId: "xsfc", url: `${baseUrl}xsyd/xsfc/index.htm`, channel: "学生风采" },
  { requestId: "zbfc", url: `${baseUrl}djgh/zbfc/index.htm`, channel: "支部风采" },
  { requestId: "zthd", url: `${baseUrl}djgh/zthd/index.htm`, channel: "专题活动" },
  { requestId: "xwtj", url: `${baseUrl}xwtj/index.htm`, channel: "新闻推荐" },
];

function normalizeText(value: string | null | undefined): string | undefined {
  const normalized = value?.replace(/\s+/g, " ").trim();
  return normalized ? normalized : undefined;
}

function extractPublishedAt(item: Element): string | undefined {
  const day = normalizeText(item.querySelector(".calendar .date")?.textContent)?.match(/\d{1,2}/)?.[0];
  const month = normalizeText(item.querySelector(".calendar .month")?.textContent)?.match(/\d{1,2}/)?.[0];
  const year = normalizeText(item.querySelector(".calendar .year")?.textContent)?.match(/\d{4}/)?.[0];

  if (!day || !month || !year) {
    return undefined;
  }

  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function createStandardTarget(target: SiteTarget): HtmlListParserConfig["targets"][number] {
  return {
    requestId: target.requestId,
    itemSelector: ".common-article-list > li",
    channel: target.channel,
    title: ".article > div:first-child",
    url: { selector: ".article", attr: "href" },
    publishedAt: ".time",
    rawId: { selector: ".article", attr: "href" },
    limit: 20,
  };
}

function createNewsCardTarget(target: SiteTarget): HtmlListParserConfig["targets"][number] {
  return {
    requestId: target.requestId,
    itemSelector: "a.article[href]",
    channel: target.channel,
    title: ".title",
    url: { attr: "href" },
    publishedAt: extractPublishedAt,
    summary: ".summary",
    rawId: { attr: "href" },
    limit: 20,
  };
}

function createPhotoTarget(target: SiteTarget): HtmlListParserConfig["targets"][number] {
  return {
    requestId: target.requestId,
    itemSelector: ".common-pic-article .article",
    channel: target.channel,
    title: ".title",
    url: { attr: "href" },
    publishedAt: extractPublishedAt,
    summary: ".summary",
    rawId: { attr: "href" },
    limit: 20,
  };
}

const parserTargets: HtmlListParserConfig["targets"] = [
  ...newsCardTargets.map(createNewsCardTarget),
  ...standardTargets.map(createStandardTarget),
  ...photoTargets.map(createPhotoTarget),
];

export const bjsfdxzxxyFetchTargets: FetchTarget[] = [
  ...newsCardTargets,
  ...standardTargets,
  ...photoTargets,
].map((target) => ({
  id: target.requestId,
  url: target.url,
  channel: target.channel,
}));

export const bjsfdxzxxyParser = createConfiguredHtmlListParser({
  parserKey: "bnuzh/bjsfdxzxxy",
  targets: parserTargets,
});
