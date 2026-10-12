import { normalizeText } from "../parsers/html";
import { articleTargetSpecs, lineTargetSpecs, type ArticleTargetSpec, type LineTargetSpec } from "./targets/jwb";
export { jwbFetchTargets } from "./targets/jwb";

import { createConfiguredHtmlListParser, type HtmlListParserConfig } from "../parsers/configuredHtmlListParser";

function stripLeadingLabel(value: string | null | undefined): string | undefined {
  const text = normalizeText(value);
  if (!text) {
    return undefined;
  }

  return normalizeText(text.replace(/^(?:【[^】]+】\s*)+/, ""));
}

function normalizeBlockTitle(value: string | null | undefined): string | undefined {
  const text = normalizeText(value);
  if (!text) {
    return undefined;
  }

  return stripLeadingLabel(
    text.replace(/\s+\d+\/\d+,\s*共\s*\d+\s*篇$/, "").replace(/\s*更多$/, ""),
  );
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

function extractTrailingDateToken(value: string | null | undefined): string | undefined {
  const text = normalizeText(value);
  if (!text) {
    return undefined;
  }

  const compact = text.replace(/\s+/g, "");
  const match = compact.match(/(\d{4}(?:[./-]|年)(\d{1,2})(?:[./-]|月)(\d{1,2})(?:日)?)$/);

  return match ? normalizeDateToken(match[1]) : undefined;
}

function resolveItemTitle(item: Element): string | undefined {
  const anchor = item.querySelector("a[href]");

  if (!anchor) {
    return undefined;
  }

  const explicitTitle = stripLeadingLabel(anchor.getAttribute("title"));
  if (explicitTitle) {
    return explicitTitle;
  }

  const firstSpan = anchor.querySelector("span");
  return stripLeadingLabel(firstSpan?.textContent ?? anchor.textContent);
}

function resolveItemPublishedAt(item: Element): string | undefined {
  const dateText =
    item.querySelector("span.fr.text-muted, .date, .time, .item-date01, time")?.textContent ??
    item.textContent;

  return extractTrailingDateToken(dateText);
}

function resolveBlockTitle(item: Element): string | undefined {
  return normalizeBlockTitle(item.closest(".article-list")?.querySelector(".tit")?.textContent);
}

function createPaginatedArticleTargets(spec: ArticleTargetSpec): HtmlListParserConfig["targets"] {
  return Array.from({ length: spec.pages ?? 1 }, (_, pageIndex) => {
    const requestId = pageIndex === 0 ? spec.requestId : `${spec.requestId}/index${pageIndex}`;

    return {
      requestId,
      itemSelector: ".article-list .boxlist > ul > li",
      channel: spec.channel,
      title: resolveItemTitle,
      url: { selector: "a[href]", attr: "href" },
      publishedAt: resolveItemPublishedAt,
      rawId: { selector: "a[href]", attr: "href" },
      itemFilter: (item: Element) => resolveBlockTitle(item) === spec.blockTitle,
    } satisfies HtmlListParserConfig["targets"][number];
  });
}

function createPaginatedLineTargets(spec: LineTargetSpec): HtmlListParserConfig["targets"] {
  return Array.from({ length: spec.pages }, (_, pageIndex) => {
    const requestId = pageIndex === 0 ? spec.requestId : `${spec.requestId}/index${pageIndex}`;

    return {
      requestId,
      itemSelector: "li.line",
      channel: spec.channel,
      title: resolveItemTitle,
      url: { selector: "a[href]", attr: "href" },
      publishedAt: resolveItemPublishedAt,
      rawId: { selector: "a[href]", attr: "href" },
    } satisfies HtmlListParserConfig["targets"][number];
  });
}

const parserTargets: HtmlListParserConfig["targets"] = [
  ...lineTargetSpecs.flatMap((spec) => createPaginatedLineTargets(spec)),
  ...articleTargetSpecs.flatMap((spec) => createPaginatedArticleTargets(spec)),
];
export const jwbParser = createConfiguredHtmlListParser({
  parserKey: "bnuzh/jwb",
  targets: parserTargets,
});
