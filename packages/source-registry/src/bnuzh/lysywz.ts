import { createConfiguredHtmlListParser } from "../parsers/configuredHtmlListParser";
import { baseUrl, targetSpecs } from "./targets/lysywz";

export { lysywzFetchTargets } from "./targets/lysywz";

const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const dateToken = String.raw`(?:\d{4}[./-]\d{1,2}[./-]\d{1,2}|\d{4}年\d{1,2}月\d{1,2}日?|\d{1,2}\s*月\s*\d{1,2}\s*日?|\d{1,2}[-/]\d{1,2})`;
const leadingDate = new RegExp(`^(${dateToken})(?:\\s*[|丨—:：-]\\s*|\\s+)?`);
const trailingDate = new RegExp(`(?:\\s*[|丨—:：-]\\s*|\\s+)?(${dateToken})$`);

function normalizeText(value: string | null | undefined): string | undefined {
  return value?.replace(/\s+/g, " ").trim() || undefined;
}

function normalizeDate(value: string | null | undefined): string | undefined {
  const compact = value?.replace(/\s+/g, "");
  const match = compact?.match(/^(?:(\d{4})(?:[./-]|年))?(\d{1,2})(?:[./-]|月)(\d{1,2})日?$/);
  if (!match) return undefined;

  const [, year, month = "", day = ""] = match;
  if (Number(month) < 1 || Number(month) > 12 || Number(day) < 1 || Number(day) > 31) return undefined;
  return `${year ? `${year}-` : ""}${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function resolvePublishedAt(item: Element): string | undefined {
  const date = normalizeDate(item.querySelector(".time, .date, time")?.textContent);
  if (date) return date;

  // The current picture-card template exposes only a day and an English month.
  const month = months.indexOf(item.querySelector(".common-list-date .month")?.textContent?.trim().toUpperCase() ?? "");
  const day = item.querySelector(".common-list-date .day")?.textContent?.trim();
  if (month >= 0 && day) return normalizeDate(`${month + 1}-${day}`);

  const text = normalizeText(item.textContent);
  return normalizeDate(text?.match(leadingDate)?.[1] ?? text?.match(trailingDate)?.[1]);
}

function resolveTitle(item: Element): string | undefined {
  const title = normalizeText(item.querySelector(".title, .news-title, .article-title, .name, .fs-2")?.textContent);
  return title ?? normalizeText(item.textContent?.replace(leadingDate, "").replace(trailingDate, ""));
}

function isAllowedItem(item: Element, pageUrl: string, pathPrefix: string, allowedHosts: string[] = []): boolean {
  if (!resolvePublishedAt(item)) return false;

  try {
    const resolved = new URL(item.getAttribute("href") ?? "", pageUrl || baseUrl);
    if (resolved.protocol !== "https:" && resolved.protocol !== "http:") return false;
    if (resolved.hostname === "mp.weixin.qq.com" || allowedHosts.includes(resolved.hostname)) return true;
    return resolved.origin === new URL(baseUrl).origin && resolved.pathname.startsWith(pathPrefix);
  } catch {
    return false;
  }
}

export const lysywzParser = createConfiguredHtmlListParser({
  parserKey: "bnuzh/lysywz",
  targets: targetSpecs.map((target) => ({
    requestId: target.requestId,
    itemSelector: "a.article[href], .article-list a[href]",
    channel: target.channel,
    title: resolveTitle,
    url: { attr: "href" },
    publishedAt: resolvePublishedAt,
    summary: (item) => normalizeText(item.querySelector(".summary, .desc, .intro, .text")?.textContent),
    rawId: { attr: "href" },
    limit: 20,
    itemFilter: (item, page) =>
      isAllowedItem(item, page.finalUrl || page.requestUrl, `/${target.path.replace(/index\.htm$/, "")}`, target.allowedHosts),
  })),
});
