import { normalizeText, normalizeDateTokenWithDayNumber as normalizeDateToken } from "../parsers/html";
export { jwbsyysjcxjyzxwzFetchTargets } from "./targets/jwbsyysjcxjyzxwz";

import { createConfiguredHtmlListParser, type HtmlListParserConfig } from "../parsers/configuredHtmlListParser";

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

export const jwbsyysjcxjyzxwzParser = createConfiguredHtmlListParser(parserConfig);
