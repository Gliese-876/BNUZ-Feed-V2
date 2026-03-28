import { AggregationError, type FetchTarget, type Parser, type RawPage, type SourceRecord } from "@bnuz-feed/contracts";

type TargetConfig = {
  requestId: string;
  channel: string;
};

const baseUrl = "https://xiaoshi.bnuzh.edu.cn";

const xsgwzTargets: TargetConfig[] = [
  { requestId: "xwdt", channel: "新闻动态" },
  { requestId: "tzgg", channel: "通知公告" },
  { requestId: "xsyj1", channel: "师大校史" },
  { requestId: "sdrw", channel: "师大人物" },
  { requestId: "slxz", channel: "史料选载" },
  { requestId: "sdjs", channel: "师大纪事" },
  { requestId: "lstp", channel: "历史图片" },
  { requestId: "zjgg", channel: "征集公告" },
  { requestId: "zpcl", channel: "展品陈列" },
  { requestId: "ztzl", channel: "专题展览" },
];

const xsgwzFetchTargetUrls: Record<TargetConfig["requestId"], string> = {
  xwdt: `${baseUrl}/gzdt/xwdt/index.htm`,
  tzgg: `${baseUrl}/gzdt/tzgg/index.htm`,
  xsyj1: `${baseUrl}/xsyj/xsyj1/index.htm`,
  sdrw: `${baseUrl}/xsyj/sdrw/index.htm`,
  slxz: `${baseUrl}/xsyj/slxz/index.htm`,
  sdjs: `${baseUrl}/xsyj/sdjs/index.htm`,
  lstp: `${baseUrl}/yxjy/lstp/index.htm`,
  zjgg: `${baseUrl}/zpzj/zjgg/index.htm`,
  zpcl: `${baseUrl}/zpzj/zpcl/index.htm`,
  ztzl: `${baseUrl}/bnxsg/ztzl/index.htm`,
};

const candidateGroups = [
  { selector: ".textList > li" },
  { selector: ".pageContent .textList > li" },
  { selector: ".common-article-list > li" },
  { selector: ".common-pic-article-list > li" },
  { selector: ".article-list > li" },
  { selector: ".news-list > li" },
  { selector: ".block-list > li" },
  { selector: ".text-list > li" },
  { selector: ".list > li" },
  { selector: "main .enter-item" },
  { selector: "main .item" },
  { selector: "main .card" },
  { selector: "main li" },
  { selector: "main a[href]" },
];

const titleSelectors = [".title", ".article-title", ".gpArticleTitle", ".name", ".text", ".entry-title", "h1", "h2", "h3", "h4", "a"];
const summarySelectors = [".summary", ".intro", ".desc", ".article-summary", ".gpArticleDesc", ".en", ".lead"];
const dateSelectors = [".time", ".date", ".publish-time", ".article-date", ".gpArticleDate", "time"];
const linkSelectors = ["a[href]", "a", "[data-href]", "[data-url]", "[href]"];

const navTitles = new Set([
  "首页",
  "上一页",
  "下一页",
  "末页",
  "更多",
  "查看更多",
  "本馆概况",
  "新闻公告",
  "校史研究",
  "展品征集",
  "云展厅",
  "参观指南",
  "新闻动态",
  "通知公告",
  "师大校史",
  "师大人物",
  "史料选载",
  "师大纪事",
  "征集公告",
  "展品陈列",
  "网上云展厅",
  "专题展览",
  "宣教活动",
  "志愿者服务",
  "历史图片",
  "访谈视频",
  "线上校史馆",
  "校园VR",
  "本馆介绍",
  "机构设置",
  "联系我们",
  "开放时间",
  "交通地图",
  "参观须知",
  "场馆预约",
  "北京师范大学珠海校区",
  "北京师范大学校史研究室",
]);

function normalizeText(value: string | null | undefined): string | undefined {
  const normalized = value?.replace(/\s+/g, " ").trim();
  return normalized ? normalized : undefined;
}

function normalizeDateText(value: string | undefined): string | undefined {
  const text = normalizeText(value);
  if (!text) {
    return undefined;
  }

  const isoMatch = text.match(/(\d{4})[./-](\d{1,2})[./-](\d{1,2})/);
  if (isoMatch) {
    const [, year = "", month = "", day = ""] = isoMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const cnMatch = text.match(/(\d{4})年(\d{1,2})月(\d{1,2})日?/);
  if (cnMatch) {
    const [, year = "", month = "", day = ""] = cnMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  return undefined;
}

function getDocument(page: RawPage): Document {
  if (typeof DOMParser === "undefined") {
    throw new AggregationError(
      "PARSER_FAILED",
      "DOMParser is unavailable in the current runtime.",
      { parserKey: "bnuzh/xsgwz", requestId: page.requestId },
    );
  }

  return new DOMParser().parseFromString(page.bodyText, "text/html");
}

function matchesSelector(element: Element, selector: string): boolean {
  try {
    return element.matches(selector);
  } catch {
    return false;
  }
}

function resolveText(element: Element, selectors: string[]): string | undefined {
  for (const selector of selectors) {
    const target = matchesSelector(element, selector) ? element : element.querySelector(selector);
    const value = normalizeText(target?.textContent);
    if (value) {
      return value;
    }
  }

  return normalizeText(element.textContent);
}

function resolveHref(element: Element): string | undefined {
  for (const selector of linkSelectors) {
    const target = matchesSelector(element, selector) ? element : element.querySelector(selector);
    if (!target) {
      continue;
    }

    const href = target.getAttribute("href") ?? target.getAttribute("data-href") ?? target.getAttribute("data-url");
    const normalized = normalizeText(href);
    if (normalized) {
      return normalized;
    }
  }

  return undefined;
}

function resolveUrl(url: string | undefined, page: RawPage): string | undefined {
  if (!url) {
    return undefined;
  }

  try {
    return new URL(url, page.finalUrl || page.requestUrl).toString();
  } catch {
    return url;
  }
}

function resolveDate(element: Element): string | undefined {
  for (const selector of dateSelectors) {
    const target = matchesSelector(element, selector) ? element : element.querySelector(selector);
    const value = normalizeDateText(target?.textContent);
    if (value) {
      return value;
    }
  }

  return normalizeDateText(element.textContent);
}

function resolveSummary(element: Element): string | undefined {
  for (const selector of summarySelectors) {
    const target = matchesSelector(element, selector) ? element : element.querySelector(selector);
    const value = normalizeText(target?.textContent);
    if (value) {
      return value;
    }
  }

  return undefined;
}

function isNavigationalTitle(title: string | undefined): boolean {
  if (!title) {
    return true;
  }

  if (navTitles.has(title)) {
    return true;
  }

  if (/^(?:\d+|[<>«»]+)$/.test(title)) {
    return true;
  }

  return false;
}

function buildRecord(element: Element, page: RawPage, channel: string): SourceRecord | null {
  const rawTitle = resolveText(element, titleSelectors);
  const rawUrl = resolveHref(element);
  const resolvedUrl = resolveUrl(rawUrl, page);

  if (!rawTitle || !resolvedUrl || isNavigationalTitle(rawTitle)) {
    return null;
  }

  return {
    sourceId: page.sourceId,
    rawId: rawUrl,
    rawTitle,
    rawUrl: resolvedUrl,
    rawPublishedAt: resolveDate(element),
    rawChannel: channel,
    rawSummary: resolveSummary(element),
    extras: {
      requestId: page.requestId,
    },
  };
}

function resolveCandidateGroup(document: Document, page: RawPage, channel: string): SourceRecord[] {
  let bestRecords: SourceRecord[] = [];
  let bestScore = 0;

  for (const group of candidateGroups) {
    const elements = Array.from(document.querySelectorAll(group.selector));
    const records = elements.map((element) => buildRecord(element, page, channel)).filter((record): record is SourceRecord => record !== null);

    if (records.length > bestScore) {
      bestRecords = records;
      bestScore = records.length;
    }
  }

  return bestRecords;
}

class XsgwzParser implements Parser {
  readonly parserKey = "bnuzh/xsgwz";

  async parse(page: RawPage): Promise<SourceRecord[]> {
    const target = xsgwzTargets.find((entry) => entry.requestId === page.requestId);
    if (!target) {
      throw new AggregationError(
        "PARSER_FAILED",
        `No configured target matched request "${page.requestId}".`,
        { parserKey: this.parserKey, requestId: page.requestId },
      );
    }

    const document = getDocument(page);
    const records = resolveCandidateGroup(document, page, target.channel);
    const deduped = new Map<string, SourceRecord>();

    for (const record of records) {
      const dedupeKey = [record.rawUrl, record.rawTitle, record.rawPublishedAt ?? "", record.rawChannel ?? ""].join("|");
      if (!deduped.has(dedupeKey)) {
        deduped.set(dedupeKey, record);
      }
    }

    return Array.from(deduped.values());
  }
}

export const xsgwzFetchTargets: FetchTarget[] = xsgwzTargets.flatMap((target) => {
  const url = xsgwzFetchTargetUrls[target.requestId];

  if (!url) {
    return [];
  }

  return [
    {
      id: target.requestId,
      url,
      channel: target.channel,
    },
  ];
});

export const xsgwzParser: Parser = new XsgwzParser();
