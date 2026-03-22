import type { FetchTarget } from "@bnuz-feed/contracts";

import { createConfiguredHtmlListParser, type HtmlListParserConfig } from "../parsers/configuredHtmlListParser";

type TargetSpec = {
  requestId: string;
  path: string;
  channel: string;
  pages?: number;
};

const baseUrl = "https://hr.bnuzh.edu.cn/";

const targetSpecs: TargetSpec[] = [
  { requestId: "tzgg", path: "tzgg/index.htm", channel: "通知公告", pages: 3 },
  { requestId: "gzdt", path: "gzdt/index.htm", channel: "工作动态" },
  { requestId: "bshgz", path: "bshgz/index.htm", channel: "博士后工作" },
  { requestId: "zcwj", path: "zcwj/index.htm", channel: "政策文件" },
  { requestId: "xzzq", path: "xzzq/index.htm", channel: "下载专区" },
  { requestId: "bdrz", path: "fwzn/bdrz/index.htm", channel: "报到入职" },
  { requestId: "rszm", path: "fwzn/rszm/index.htm", channel: "社保公积金" },
  { requestId: "rssx", path: "fwzn/rssx/index.htm", channel: "党组织关系" },
  { requestId: "pxjx2", path: "fwzn/pxjx2/index.htm", channel: "户政业务" },
  { requestId: "kyqdf", path: "fwzn/kyqdf/index.htm", channel: "科研启动费" },
  { requestId: "rssx1", path: "fwzn/rssx1/index.htm", channel: "人事手续" },
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

function createFetchTargets(): FetchTarget[] {
  return targetSpecs.flatMap((spec) =>
    Array.from({ length: spec.pages ?? 1 }, (_, pageIndex) => {
      const requestId = pageIndex === 0 ? spec.requestId : `${spec.requestId}/index${pageIndex}`;
      const path = pageIndex === 0 ? spec.path : spec.path.replace(/index\.htm$/, `index${pageIndex}.htm`);

      return {
        id: requestId,
        url: `${baseUrl}${path}`,
        channel: spec.channel,
      } satisfies FetchTarget;
    }),
  );
}

function createParserTargets(): HtmlListParserConfig["targets"] {
  return targetSpecs.flatMap((spec) =>
    Array.from({ length: spec.pages ?? 1 }, (_, pageIndex) => ({
      requestId: pageIndex === 0 ? spec.requestId : `${spec.requestId}/index${pageIndex}`,
      itemSelector: "ul.listpt-ul2 > li",
      channel: spec.channel,
      title: "a",
      url: { selector: "a", attr: "href" },
      publishedAt: resolvePublishedAt,
      rawId: { selector: "a", attr: "href" },
      limit: 20,
    })),
  );
}

export const rcbFetchTargets: FetchTarget[] = createFetchTargets();
export const rcbParser = createConfiguredHtmlListParser({
  parserKey: "bnuzh/rcb",
  targets: createParserTargets(),
});
