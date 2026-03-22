import type { FetchTarget } from "@bnuz-feed/contracts";

import { createConfiguredHtmlListParser, type HtmlListParserConfig } from "../parsers/configuredHtmlListParser";

type TargetSpec = {
  requestId: string;
  path: string;
  channel: string;
};

const baseUrl = "https://dangan.bnuzh.edu.cn";

const targetSpecs: TargetSpec[] = [
  { requestId: "gzdt/xwdt", path: "gzdt/xwdt/index.htm", channel: "工作动态/新闻动态" },
  { requestId: "gzdt/tzgg", path: "gzdt/tzgg/index.htm", channel: "工作动态/通知公告" },
  { requestId: "fgzd/flfg", path: "fgzd/flfg/index.htm", channel: "法规制度/法律法规" },
  { requestId: "fgzd/bzgf", path: "fgzd/bzgf/index.htm", channel: "法规制度/标准规范" },
  { requestId: "fgzd/gzzd", path: "fgzd/gzzd/index.htm", channel: "法规制度/规章制度" },
  { requestId: "bszn/cdzn", path: "bszn/cdzn/index.htm", channel: "办事指南/综合档案" },
  { requestId: "bszn/gdzn", path: "bszn/gdzn/index.htm", channel: "办事指南/学生档案" },
  { requestId: "bszn/gdzn/xqxsda", path: "bszn/gdzn/xqxsda/index.htm", channel: "办事指南/学生档案" },
  { requestId: "bszn/cjwt", path: "bszn/cjwt/index.htm", channel: "办事指南/常见问题" },
  { requestId: "xgxz/zfly", path: "xgxz/zfly/index.htm", channel: "相关下载/综合档案" },
  { requestId: "xgxz/zfle", path: "xgxz/zfle/index.htm", channel: "相关下载/学生档案" },
];

function normalizeText(value: string | null | undefined): string | undefined {
  const normalized = value?.replace(/\s+/g, " ").trim();
  return normalized ? normalized : undefined;
}

function normalizeDateToken(value: string | undefined): string | undefined {
  const text = normalizeText(value);
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

  return undefined;
}

function resolvePublishedAt(item: Element): string | undefined {
  return normalizeDateToken(
    item.querySelector(".datew")?.textContent ??
      item.querySelector(".time")?.textContent ??
      item.querySelector("time")?.textContent ??
      item.textContent,
  );
}

export const dagwzFetchTargets: FetchTarget[] = targetSpecs.map((target) => ({
  id: target.requestId,
  url: `${baseUrl}/${target.path}`,
  channel: target.channel,
}));

const parserConfig: HtmlListParserConfig = {
  parserKey: "bnuzh/dagwz",
  targets: targetSpecs.map((target) => ({
    requestId: target.requestId,
    itemSelector: "ul.noticeUl > li",
    channel: target.channel,
    title: "p",
    url: { selector: "a", attr: "href" },
    publishedAt: resolvePublishedAt,
    rawId: { selector: "a", attr: "href" },
    limit: 20,
  })),
};

export const dagwzParser = createConfiguredHtmlListParser(parserConfig);
