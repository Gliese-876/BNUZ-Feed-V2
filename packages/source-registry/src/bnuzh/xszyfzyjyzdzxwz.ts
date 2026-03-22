import type { FetchTarget } from "@bnuz-feed/contracts";

import { createConfiguredHtmlListParser, type HtmlListParserConfig } from "../parsers/configuredHtmlListParser";

type TargetSpec = {
  requestId: string;
  path: string;
  channel: string;
  itemSelector: string;
};

const baseUrl = "https://career.bnuzh.edu.cn";

const targetSpecs: TargetSpec[] = [
  { requestId: "news", path: "index.php/web/Index/news-list", channel: "新闻资讯", itemSelector: ".content-list a[href*='detail']" },
  { requestId: "notice", path: "index.php/web/Index/notice-list", channel: "通知公告", itemSelector: ".content-list a[href*='detail']" },
  { requestId: "jiuyehuodong", path: "index.php/web/Index/employment-list", channel: "就业活动", itemSelector: ".content-list a[href*='detail']" },
  { requestId: "jiuyezhidao", path: "index.php/web/Index/article-list?type=jiuyezhidao", channel: "就业指导", itemSelector: ".content-list a[href*='detail']" },
  { requestId: "jiuyezhengce", path: "index.php/web/Index/policy-list", channel: "就业政策", itemSelector: ".content-list a[href*='detail']" },
  { requestId: "qiuzhixinlu", path: "index.php/web/Index/article-list?type=qiuzhixinlu", channel: "求职心路", itemSelector: ".content-list a[href*='detail']" },
  { requestId: "jianlizhizuo", path: "index.php/web/Index/article-list?type=jianlizhizuo", channel: "简历制作", itemSelector: ".content-list a[href*='detail']" },
  { requestId: "gykc", path: "index.php/web/Index/special-list?type=gykc", channel: "公益课程", itemSelector: ".content-list a[href*='detail']" },
  { requestId: "preach", path: "index.php/web/Index/preach-list", channel: "宣讲会", itemSelector: ".list-media-content a[href*='detail']" },
  { requestId: "jobfair", path: "index.php/web/Index/jobfair-list", channel: "双选会", itemSelector: ".list-media-content a[href*='detail']" },
  { requestId: "jobs-brief", path: "index.php/web/Index/jobs-brief-list", channel: "招聘简讯", itemSelector: ".jobsbrief-lists a[href*='detail']" },
  { requestId: "jobs-brief-gongwuyuan", path: "index.php/web/Index/jobs-brief-list?type=gongwuyuan", channel: "公职就业", itemSelector: ".jobsbrief-lists a[href*='detail']" },
  { requestId: "jobs-brief-jichujiaoyu", path: "index.php/web/Index/jobs-brief-list?type=jichujiaoyu", channel: "基础教育", itemSelector: ".jobsbrief-lists a[href*='detail']" },
  { requestId: "job", path: "index.php/web/Index/job-list", channel: "职位信息", itemSelector: ".jobs-list a[href*='job-detail']" },
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

  const isoMatch = compact.match(/(\d{4})[./-](\d{1,2})[./-](\d{1,2})/);
  if (isoMatch) {
    const [, year = "", month = "", day = ""] = isoMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const cnMatch = compact.match(/(\d{4})年(\d{1,2})月(\d{1,2})日?/);
  if (cnMatch) {
    const [, year = "", month = "", day = ""] = cnMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const monthDayYearMatch = compact.match(/(\d{1,2})[./-](\d{1,2})(\d{4})/);
  if (monthDayYearMatch) {
    const [, month = "", day = "", year = ""] = monthDayYearMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const shortMatch = compact.match(/(\d{1,2})[./-](\d{1,2})/);
  if (shortMatch) {
    const [, month = "", day = ""] = shortMatch;
    return `${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const monthDayMatch = compact.match(/(\d{1,2})月(\d{1,2})日?/);
  if (monthDayMatch) {
    const [, month = "", day = ""] = monthDayMatch;
    return `${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  return undefined;
}

function stripBoundaryDate(text: string | null | undefined): string | undefined {
  const normalized = normalizeText(text);
  if (!normalized) {
    return undefined;
  }

  const stripped = normalized
    .replace(/^最新\s*/, "")
    .replace(/^(?:\d{4}[./-]\d{1,2}[./-]\d{1,2}|\d{4}年\d{1,2}月\d{1,2}日?|\d{1,2}[./-]\d{1,2}\s+\d{4})\s+/, "")
    .replace(/\s+(?:\d{4}[./-]\d{1,2}[./-]\d{1,2}|\d{4}年\d{1,2}月\d{1,2}日?|\d{1,2}[./-]\d{1,2}\s+\d{4})$/, "");

  return normalizeText(stripped);
}

function resolveTitle(item: Element): string | undefined {
  return stripBoundaryDate(item.textContent);
}

function resolveUrl(item: Element): string | undefined {
  return normalizeText(item.getAttribute("href"));
}

function resolvePublishedAt(item: Element): string | undefined {
  const candidates: Array<string | null | undefined> = [
    item.querySelector(".time")?.textContent,
    item.querySelector(".date")?.textContent,
    item.querySelector(".datew")?.textContent,
    item.querySelector("time")?.textContent,
    item.closest("li, article, .item, .list-item, .news-item, .notice-item")?.textContent,
    item.parentElement?.textContent,
    item.textContent,
  ];

  for (const candidate of candidates) {
    const value = normalizeDateToken(candidate);
    if (value) {
      return value;
    }
  }

  return undefined;
}

export const xszyfzyjyzdzxwzFetchTargets: FetchTarget[] = targetSpecs.map((target) => ({
  id: target.requestId,
  url: `${baseUrl}/${target.path}`,
  channel: target.channel,
}));

const parserConfig: HtmlListParserConfig = {
  parserKey: "bnuzh/xszyfzyjyzdzxwz",
  targets: targetSpecs.map((target) => ({
    requestId: target.requestId,
    itemSelector: target.itemSelector,
    channel: target.channel,
    title: resolveTitle,
    url: { attr: "href" },
    publishedAt: resolvePublishedAt,
    rawId: { attr: "href" },
    limit: 20,
  })),
};

export const xszyfzyjyzdzxwzParser = createConfiguredHtmlListParser(parserConfig);
