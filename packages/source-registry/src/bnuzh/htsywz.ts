import { normalizeText, normalizeDateToken } from "../parsers/html";
import { sectionSpecs } from "./targets/htsywz";
export { htsywzFetchTargets } from "./targets/htsywz";

import {
  createConfiguredHtmlListParser,
  type HtmlListParserConfig,
} from "../parsers/configuredHtmlListParser";

function stripBoundaryDate(text: string | null | undefined): string | undefined {
  const normalized = normalizeText(text);
  if (!normalized) {
    return undefined;
  }

  const stripped = normalized
    .replace(/^(\d{4}[./-]\d{1,2}[./-]\d{1,2}|\d{4}年\d{1,2}月\d{1,2}日?)\s+/, "")
    .replace(/\s+(\d{4}[./-]\d{1,2}[./-]\d{1,2}|\d{4}年\d{1,2}月\d{1,2}日?)$/, "");

  return normalizeText(stripped);
}

function extractBoundaryDate(text: string | null | undefined): string | undefined {
  const normalized = normalizeText(text);
  if (!normalized) {
    return undefined;
  }

  const leadingMatch = normalized.match(/^(\d{4}[./-]\d{1,2}[./-]\d{1,2}|\d{4}年\d{1,2}月\d{1,2}日?)(?=\s|$)/);
  if (leadingMatch) {
    return normalizeDateToken(leadingMatch[1]);
  }

  const trailingMatch = normalized.match(/(\d{4}[./-]\d{1,2}[./-]\d{1,2}|\d{4}年\d{1,2}月\d{1,2}日?)$/);
  if (trailingMatch) {
    return normalizeDateToken(trailingMatch[1]);
  }

  return undefined;
}

const parserConfig: HtmlListParserConfig = {
  parserKey: "bnuzh/htsywz",
  targets: sectionSpecs.flatMap((section) =>
    Array.from({ length: section.pages }, (_, pageIndex) => {
      const suffix = pageIndex === 0 ? "" : String(pageIndex);
      const requestId = `${section.key}/index${suffix}`;

      return {
        requestId,
        itemSelector: "body a[href]",
        channel: section.channel,
        title: (item) => stripBoundaryDate(item.textContent),
        url: { attr: "href" },
        publishedAt: (item) => extractBoundaryDate(item.textContent),
        rawId: { attr: "href" },
        limit: 20,
        itemFilter: (item) => Boolean(extractBoundaryDate(item.textContent)),
      };
    }),
  ),
};

export const htsywzParser = createConfiguredHtmlListParser(parserConfig);
