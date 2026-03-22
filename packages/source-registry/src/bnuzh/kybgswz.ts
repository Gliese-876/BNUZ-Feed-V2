import type { FetchTarget } from "@bnuz-feed/contracts";

import { createConfiguredHtmlListParser, type HtmlListParserConfig } from "../parsers/configuredHtmlListParser";

type SectionSpec = {
  requestId: string;
  path: string;
  channel: string;
  pages?: number;
};

const baseUrl = "https://kyb.bnuzh.edu.cn/";

const sectionSpecs: SectionSpec[] = [
  { requestId: "tpxw", path: "tpxw/index.htm", channel: "图片新闻" },
  { requestId: "kydt", path: "kydt", channel: "科研动态", pages: 17 },
  { requestId: "sbtz", path: "tzgg/sbtz", channel: "申报通知", pages: 14 },
  { requestId: "kyhd", path: "tzgg/kyhd", channel: "科研活动", pages: 19 },
  { requestId: "kyrl", path: "kyrl/index.htm", channel: "科研日历" },
  { requestId: "kyxmglgd", path: "glgz/kyxmglgd/index.htm", channel: "科研项目管理规定" },
  { requestId: "kyjfglgd", path: "glgz/kyjfglgd/index.htm", channel: "科研经费管理规定" },
  { requestId: "kyptglgd", path: "glgz/kyptglgd/index.htm", channel: "科研平台管理规定" },
  { requestId: "kycgglgd", path: "glgz/kycgglgd/index.htm", channel: "科研成果管理规定" },
  { requestId: "kxyjxgfg", path: "glgz/kxyjxgfg/index.htm", channel: "科学研究相关法规" },
  { requestId: "xngzzd", path: "glgz/xngzzd/index.blk.htm", channel: "校内规章制度" },
  { requestId: "xmgl", path: "ywzn/xmgl/index.htm", channel: "项目管理" },
  { requestId: "zscq", path: "ywzn/zscq/index.htm", channel: "知识产权" },
  { requestId: "xdhz", path: "xdhz/index.htm", channel: "校地合作" },
  { requestId: "zlxz", path: "zlxz/index.blk.htm", channel: "资料下载" },
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

function resolvePublishedAt(item: Element): string | undefined {
  const selectors = [".flex-shrink-0", ".time", ".date", "time"];

  for (const selector of selectors) {
    const value = normalizeDateToken(item.querySelector(selector)?.textContent);
    if (value) {
      return value;
    }
  }

  return normalizeDateToken(item.textContent);
}

function createTargets(): FetchTarget[] {
  return sectionSpecs.flatMap((section) => {
    if (!section.pages) {
      return [
        {
          id: section.requestId,
          url: new URL(section.path, baseUrl).toString(),
          channel: section.channel,
        } satisfies FetchTarget,
      ];
    }

    return Array.from({ length: section.pages }, (_, index) => {
      const suffix = index === 0 ? "" : String(index);
      const requestId = index === 0 ? section.requestId : `${section.requestId}/index${suffix}`;
      const path = `${section.path}/index${suffix}.htm`;

      return {
        id: requestId,
        url: new URL(path, baseUrl).toString(),
        channel: section.channel,
      } satisfies FetchTarget;
    });
  });
}

function createParserConfig(): HtmlListParserConfig {
  return {
    parserKey: "bnuzh/kybgswz",
    targets: sectionSpecs.flatMap((section) => {
      if (!section.pages) {
        return [
          {
            requestId: section.requestId,
            itemSelector: "ul.article-list > li",
            channel: section.channel,
            title: ".title",
            url: { selector: "a", attr: "href" },
            publishedAt: resolvePublishedAt,
            rawId: { selector: "a", attr: "href" },
            limit: 20,
          },
        ];
      }

      return Array.from({ length: section.pages }, (_, index) => {
        const suffix = index === 0 ? "" : String(index);
        const requestId = index === 0 ? section.requestId : `${section.requestId}/index${suffix}`;

        return {
          requestId,
          itemSelector: "ul.article-list > li",
          channel: section.channel,
          title: ".title",
          url: { selector: "a", attr: "href" },
          publishedAt: resolvePublishedAt,
          rawId: { selector: "a", attr: "href" },
          limit: 20,
        };
      });
    }),
  };
}

export const kybgswzFetchTargets = createTargets();
export const kybgswzParser = createConfiguredHtmlListParser(createParserConfig());
