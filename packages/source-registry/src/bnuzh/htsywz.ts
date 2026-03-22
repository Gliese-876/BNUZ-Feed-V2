import type { FetchTarget } from "@bnuz-feed/contracts";

import {
  createConfiguredHtmlListParser,
  type HtmlListParserConfig,
} from "../parsers/configuredHtmlListParser";

type SectionSpec = {
  key: string;
  channel: string;
  path: string;
  pages: number;
};

const baseUrl = "https://ht.bnuzh.edu.cn/";

const sectionSpecs: SectionSpec[] = [
  {
    key: "sdyw",
    channel: "师大要闻",
    path: "sdyw",
    pages: 12,
  },
  {
    key: "tzgg",
    channel: "通知公告",
    path: "tzgg",
    pages: 3,
  },
  {
    key: "czyl",
    channel: "成长引领",
    path: "czyl",
    pages: 15,
  },
  {
    key: "xyfz",
    channel: "学业发展",
    path: "xyfz",
    pages: 13,
  },
  {
    key: "syfw",
    channel: "生涯服务",
    path: "syfw",
    pages: 19,
  },
  {
    key: "htfc",
    channel: "会同风采",
    path: "htfc",
    pages: 5,
  },
  {
    key: "cjyw",
    channel: "常见业务",
    path: "bszn/cjyw",
    pages: 1,
  },
  {
    key: "zywj",
    channel: "重要文件",
    path: "bszn/zywj",
    pages: 1,
  },
  {
    key: "cyxz",
    channel: "常用下载",
    path: "bszn/cyxz",
    pages: 1,
  },
];

function normalizeText(value: string | null | undefined): string | undefined {
  const normalized = value?.replace(/\s+/g, " ").trim();
  return normalized ? normalized : undefined;
}

function normalizeDateToken(value: string | null | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const compact = value.replace(/\s+/g, "");

  const fullMatch = compact.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})$/);
  if (fullMatch) {
    const [, year = "", month = "", day = ""] = fullMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const cnMatch = compact.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日?$/);
  if (cnMatch) {
    const [, year = "", month = "", day = ""] = cnMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  return undefined;
}

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
      const url = `${baseUrl}${section.path}/index${suffix}.htm`;

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

export const htsywzFetchTargets: FetchTarget[] = sectionSpecs.flatMap((section) =>
  Array.from({ length: section.pages }, (_, pageIndex) => {
    const suffix = pageIndex === 0 ? "" : String(pageIndex);
    const id = `${section.key}/index${suffix}`;
    const url = `${baseUrl}${section.path}/index${suffix}.htm`;

    return {
      id,
      url,
      channel: section.channel,
    } satisfies FetchTarget;
  }),
);

export const htsywzParser = createConfiguredHtmlListParser(parserConfig);
