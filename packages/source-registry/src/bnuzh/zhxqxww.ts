import { normalizeText } from "../parsers/html";
import { ttgzTargets, tzggTargets, zhbdTargets, mtsdTargets, gysdTargets } from "./targets/zhxqxww";
export { zhxqxwwFetchTargets } from "./targets/zhxqxww";

import { createConfiguredHtmlListParser, type HtmlListParserConfig } from "../parsers/configuredHtmlListParser";

function resolveMonthDay(item: Element): string | undefined {
  const day = normalizeText(item.querySelector(".list-date02 strong")?.textContent)?.match(/\d{1,2}/)?.[0];
  const yearMonth = normalizeText(item.querySelector(".list-date02 span")?.textContent)?.match(/^(\d{4})-(\d{1,2})$/);

  if (!day || !yearMonth) {
    return undefined;
  }

  const [, year = "", month = ""] = yearMonth;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

const parserTargets: HtmlListParserConfig["targets"] = [
  ...ttgzTargets.map((target) => ({
    requestId: target.requestId,
    itemSelector: ".bnu-list01 > li",
    channel: target.channel,
    title: ".item-txt01 h3",
    url: { selector: "a", attr: "href" },
    publishedAt: ".item-date01",
    rawId: { selector: "a", attr: "href" },
    limit: 20,
  })),
  ...tzggTargets.map((target) => ({
    requestId: target.requestId,
    itemSelector: ".bnu-list02 > li",
    channel: target.channel,
    title: "a",
    url: { selector: "a", attr: "href" },
    publishedAt: resolveMonthDay,
    rawId: { selector: "a", attr: "href" },
    limit: 20,
  })),
  ...zhbdTargets.map((target) => ({
    requestId: target.requestId,
    itemSelector: ".bnu-list02 > li",
    channel: target.channel,
    title: "a",
    url: { selector: "a", attr: "href" },
    publishedAt: resolveMonthDay,
    rawId: { selector: "a", attr: "href" },
    limit: 20,
  })),
  ...mtsdTargets.map((target) => ({
    requestId: target.requestId,
    itemSelector: ".bnu-list02 > li",
    channel: target.channel,
    title: "a",
    url: { selector: "a", attr: "href" },
    publishedAt: resolveMonthDay,
    rawId: { selector: "a", attr: "href" },
    limit: 20,
  })),
  ...gysdTargets.map((target) => ({
    requestId: target.requestId,
    itemSelector: ".bnu-list03 > li",
    channel: target.channel,
    title: ".fpx16",
    url: { selector: "a", attr: "href" },
    rawId: { selector: "a", attr: "href" },
    limit: 20,
  })),
];

export const zhxqxwwParser = createConfiguredHtmlListParser({
  parserKey: "bnuzh/zhxqxww",
  targets: parserTargets,
});
