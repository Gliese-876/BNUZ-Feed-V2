import type { FetchTarget } from "@bnuz-feed/contracts";

import { createConfiguredHtmlListParser, type HtmlListParserConfig } from "../parsers/configuredHtmlListParser";

type TargetSpec = {
  requestId: string;
  url: string;
  channel: string;
};

const baseUrl = "https://sczx.bnuzh.edu.cn";

const targetSpecs: TargetSpec[] = [
  { requestId: "tzgg/index", url: `${baseUrl}/tzgg/index.htm`, channel: "通知公告" },
  { requestId: "tzgg/index1", url: `${baseUrl}/tzgg/index1.htm`, channel: "通知公告" },
  { requestId: "tzgg/index2", url: `${baseUrl}/tzgg/index2.htm`, channel: "通知公告" },
  { requestId: "zhxw/index", url: `${baseUrl}/zhxw/index.blk.htm`, channel: "综合新闻" },
  { requestId: "zhxw/index1", url: `${baseUrl}/zhxw/index1.blk.htm`, channel: "综合新闻" },
  { requestId: "jsxm/index", url: `${baseUrl}/sjcx/jsxm/index.htm`, channel: "竞赛项目" },
  { requestId: "jsxm/index1", url: `${baseUrl}/sjcx/jsxm/index1.htm`, channel: "竞赛项目" },
  { requestId: "jsxm/index2", url: `${baseUrl}/sjcx/jsxm/index2.htm`, channel: "竞赛项目" },
  { requestId: "aqzd/index", url: `${baseUrl}/sysaq/aqzd/index.htm`, channel: "安全制度" },
  { requestId: "zbgz/index", url: `${baseUrl}/dqjs/zbgz/index.htm`, channel: "支部工作" },
  { requestId: "cgzs/home", url: `${baseUrl}/`, channel: "实践教学成果" },
];

function normalizeText(value: string | null | undefined): string | undefined {
  const normalized = value?.replace(/\s+/g, " ").trim();
  return normalized ? normalized : undefined;
}

function normalizeDateToken(value: string | null | undefined): string | undefined {
  const text = normalizeText(value);
  if (!text) {
    return undefined;
  }

  const compact = text.replace(/\s+/g, "");
  const isoMatch = compact.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})$/);
  if (isoMatch) {
    const [, year = "", month = "", day = ""] = isoMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const cnMatch = compact.match(/^(\d{4})年(\d{1,2})月(\d{1,2})(?:日|号)?$/);
  if (cnMatch) {
    const [, year = "", month = "", day = ""] = cnMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  return undefined;
}

function isPublicHref(href: string | null | undefined): boolean {
  if (!href) {
    return false;
  }

  if (/^(?:javascript:|#)/i.test(href)) {
    return false;
  }

  if (/172\.31\.1\.26|cms\/login|cms\/publish\/preview/i.test(href)) {
    return false;
  }

  return true;
}

function getAnchorHref(item: Element): string | undefined {
  return normalizeText(item.querySelector("a[href]")?.getAttribute("href"));
}

function getArticleTitle(item: Element): string | undefined {
  return normalizeText(item.querySelector("p:last-of-type")?.textContent);
}

function getHeadingTitle(item: Element): string | undefined {
  return normalizeText(item.querySelector("h2")?.textContent);
}

function getSummary(item: Element): string | undefined {
  return normalizeText(item.querySelector(".newr p:last-child")?.textContent);
}

function getSimpleDate(item: Element): string | undefined {
  return normalizeDateToken(item.querySelector(".date")?.textContent ?? item.textContent);
}

function getSplitDate(item: Element): string | undefined {
  const day = normalizeText(item.querySelector(".date2 p:first-child")?.textContent);
  const month = normalizeText(item.querySelector(".date2 p:last-child")?.textContent);

  if (!day || !month) {
    return undefined;
  }

  const monthMatch = month.match(/^(\d{4})[./-](\d{1,2})$/);
  if (!monthMatch) {
    return undefined;
  }

  const [, year = "", monthValue = ""] = monthMatch;
  return `${year}-${monthValue.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

const parserConfig: HtmlListParserConfig = {
  parserKey: "bnuzh/jwbsyysjcxjyzxwz",
  targets: [
    {
      requestId: "tzgg/index",
      itemSelector: "main .apparcon .partyUl.partyUl2 > li",
      channel: "通知公告",
      title: getArticleTitle,
      url: { selector: "a", attr: "href" },
      publishedAt: getSimpleDate,
      rawId: { selector: "a", attr: "href" },
      itemFilter: (item) => isPublicHref(getAnchorHref(item)),
    },
    {
      requestId: "tzgg/index1",
      itemSelector: "main .apparcon .partyUl.partyUl2 > li",
      channel: "通知公告",
      title: getArticleTitle,
      url: { selector: "a", attr: "href" },
      publishedAt: getSimpleDate,
      rawId: { selector: "a", attr: "href" },
      itemFilter: (item) => isPublicHref(getAnchorHref(item)),
    },
    {
      requestId: "tzgg/index2",
      itemSelector: "main .apparcon .partyUl.partyUl2 > li",
      channel: "通知公告",
      title: getArticleTitle,
      url: { selector: "a", attr: "href" },
      publishedAt: getSimpleDate,
      rawId: { selector: "a", attr: "href" },
      itemFilter: (item) => isPublicHref(getAnchorHref(item)),
    },
    {
      requestId: "zhxw/index",
      itemSelector: "main .apparcon .centernews > li",
      channel: "综合新闻",
      title: getHeadingTitle,
      url: { selector: "a", attr: "href" },
      publishedAt: getSplitDate,
      summary: getSummary,
      rawId: { selector: "a", attr: "href" },
      itemFilter: (item) => isPublicHref(getAnchorHref(item)),
    },
    {
      requestId: "zhxw/index1",
      itemSelector: "main .apparcon .centernews > li",
      channel: "综合新闻",
      title: getHeadingTitle,
      url: { selector: "a", attr: "href" },
      publishedAt: getSplitDate,
      summary: getSummary,
      rawId: { selector: "a", attr: "href" },
      itemFilter: (item) => isPublicHref(getAnchorHref(item)),
    },
    {
      requestId: "jsxm/index",
      itemSelector: "main ul.centerTeachers.competition > li",
      channel: "竞赛项目",
      title: getArticleTitle,
      url: { selector: "a", attr: "href" },
      rawId: { selector: "a", attr: "href" },
      itemFilter: (item) => isPublicHref(getAnchorHref(item)),
    },
    {
      requestId: "jsxm/index1",
      itemSelector: "main ul.centerTeachers.competition > li",
      channel: "竞赛项目",
      title: getArticleTitle,
      url: { selector: "a", attr: "href" },
      rawId: { selector: "a", attr: "href" },
      itemFilter: (item) => isPublicHref(getAnchorHref(item)),
    },
    {
      requestId: "jsxm/index2",
      itemSelector: "main ul.centerTeachers.competition > li",
      channel: "竞赛项目",
      title: getArticleTitle,
      url: { selector: "a", attr: "href" },
      rawId: { selector: "a", attr: "href" },
      itemFilter: (item) => isPublicHref(getAnchorHref(item)),
    },
    {
      requestId: "aqzd/index",
      itemSelector: "main ul.partyUl > li",
      channel: "安全制度",
      title: getArticleTitle,
      url: { selector: "a", attr: "href" },
      publishedAt: getSimpleDate,
      rawId: { selector: "a", attr: "href" },
      itemFilter: (item) => isPublicHref(getAnchorHref(item)),
    },
    {
      requestId: "zbgz/index",
      itemSelector: "main ul.partyUl > li",
      channel: "支部工作",
      title: getArticleTitle,
      url: { selector: "a", attr: "href" },
      publishedAt: getSimpleDate,
      rawId: { selector: "a", attr: "href" },
      itemFilter: (item) => isPublicHref(getAnchorHref(item)),
    },
    {
      requestId: "cgzs/home",
      itemSelector: "main .mode3Ul .slider-for > li.slick-slide:not(.slick-cloned)",
      channel: "实践教学成果",
      title: getHeadingTitle,
      url: { selector: "a", attr: "href" },
      rawId: { selector: "a", attr: "href" },
    },
  ],
};

export const jwbsyysjcxjyzxwzFetchTargets: FetchTarget[] = targetSpecs.map((target) => ({
  id: target.requestId,
  url: target.url,
  channel: target.channel,
}));

export const jwbsyysjcxjyzxwzParser = createConfiguredHtmlListParser(parserConfig);
