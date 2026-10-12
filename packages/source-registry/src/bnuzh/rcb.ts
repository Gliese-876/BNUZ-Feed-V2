import { rcbFetchTargets } from "./targets/rcb";
export { rcbFetchTargets } from "./targets/rcb";

import { createConfiguredHtmlListParser } from "../parsers/configuredHtmlListParser";

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
  const match = compact.match(/^(\d{4})(?:[./-]|年)(\d{1,2})(?:[./-]|月)(\d{1,2})(?:日)?$/);

  if (!match) {
    return undefined;
  }

  const [, year = "", month = "", day = ""] = match;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function resolvePublishedAt(item: Element): string | undefined {
  return normalizeDateToken(item.querySelector("span")?.textContent ?? item.textContent);
}

export const rcbParser = createConfiguredHtmlListParser({
  parserKey: "bnuzh/rcb",
  targets: rcbFetchTargets.map((target) => ({
    requestId: target.id,
    itemSelector: "ul.listpt-ul > li, ul.listpt-ul2 > li",
    channel: target.channel,
    title: "a",
    url: { selector: "a", attr: "href" },
    publishedAt: resolvePublishedAt,
    rawId: { selector: "a", attr: "href" },
    limit: 20,
  })),
});
