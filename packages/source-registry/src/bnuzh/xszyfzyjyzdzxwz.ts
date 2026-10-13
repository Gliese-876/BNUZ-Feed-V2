import type { RawPage } from "@bnuz-feed/contracts";

import { normalizeText } from "../parsers/html";
import { targetSpecs } from "./targets/xszyfzyjyzdzxwz";
export { xszyfzyjyzdzxwzFetchTargets } from "./targets/xszyfzyjyzdzxwz";

import { createConfiguredHtmlListParser, type HtmlListParserConfig } from "../parsers/configuredHtmlListParser";

// These lists display the event schedule, not a publication timestamp.
const eventRequestIds = new Set(["preach", "jobfair", "jiuyehuodong"]);

function normalizeDateToken(value: string | null | undefined): string | undefined {
  const text = normalizeText(value)?.replace(/\s*发布$/, "").trim();
  if (!text) {
    return undefined;
  }

  const compact = text.replace(/\s+/g, "");

  const isoMatch = compact.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})$/);
  if (isoMatch) {
    const [, year = "", month = "", day = ""] = isoMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const cnMatch = compact.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日?$/);
  if (cnMatch) {
    const [, year = "", month = "", day = ""] = cnMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const monthDayYearMatch = compact.match(/^(\d{1,2})[./-](\d{1,2})(\d{4})$/);
  if (monthDayYearMatch) {
    const [, month = "", day = "", year = ""] = monthDayYearMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const shortMatch = compact.match(/^(\d{1,2})[./-](\d{1,2})$/);
  if (shortMatch) {
    const [, month = "", day = ""] = shortMatch;
    return `${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const monthDayMatch = compact.match(/^(\d{1,2})月(\d{1,2})日?$/);
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
  const title = item.querySelector(".title, .job-name, .item-left .content");
  return title ? normalizeText(title.textContent) : stripBoundaryDate(item.textContent);
}

function resolveSummary(item: Element, page: RawPage): string | undefined {
  if (page.requestId === "jiuyehuodong") {
    const schedule = normalizeText(item.querySelector(".item-time")?.textContent);
    return schedule ? `活动时间：${schedule}` : undefined;
  }
  const selector = item.querySelector(".release")
    ? ".release .text, .right"
    : item.querySelector(".job-name")
      ? ".job-company, .job-salary, .job-edu, .job-industry, .third-line"
      : item.querySelector(".top > .title")
        ? ".position-count, .companyname, .job-count"
        : undefined;
  if (!selector) return undefined;
  return normalizeText(Array.from(item.querySelectorAll(selector))
    .map((node) => normalizeText(node.textContent)).filter(Boolean).join(" · "));
}

function resolvePublishedAt(item: Element): string | undefined {
  // Keep sibling date nodes inside this article's row; never scan the title,
  // description, or parent list for something that merely resembles a date.
  for (const scope of [item, item.closest("li")]) {
    if (!scope) continue;
    for (const selector of [".item-time", ".job-time", ".description .time", ".datew", ".date", ".time", "time"]) {
      const node = scope.querySelector(selector);
      const value = normalizeDateToken(node?.getAttribute("datetime") ?? node?.textContent);
      if (value) return value;
    }
  }

  return undefined;
}

const parserConfig: HtmlListParserConfig = {
  parserKey: "bnuzh/xszyfzyjyzdzxwz",
  targets: targetSpecs.map((target) => ({
    requestId: target.requestId,
    itemSelector: target.itemSelector,
    channel: target.channel,
    title: resolveTitle,
    url: { attr: "href" },
    publishedAt: eventRequestIds.has(target.requestId) ? undefined : resolvePublishedAt,
    summary: resolveSummary,
    rawId: { attr: "href" },
    limit: 20,
  })),
};

export const xszyfzyjyzdzxwzParser = createConfiguredHtmlListParser(parserConfig);
