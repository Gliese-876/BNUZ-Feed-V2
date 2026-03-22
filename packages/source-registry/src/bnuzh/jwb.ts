import type { FetchTarget } from "@bnuz-feed/contracts";

import { createConfiguredHtmlListParser, type HtmlListParserConfig } from "../parsers/configuredHtmlListParser";

type ArticleTargetSpec = {
  requestId: string;
  path: string;
  channel: string;
  blockTitle: string;
  pages?: number;
};

type LineTargetSpec = {
  requestId: string;
  path: string;
  channel: string;
  pages: number;
};

const baseUrl = "https://jwb.bnuzh.edu.cn/";

function normalizeText(value: string | null | undefined): string | undefined {
  const normalized = value?.replace(/\s+/g, " ").trim();
  return normalized ? normalized : undefined;
}

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

const articleTargetSpecs: ArticleTargetSpec[] = [
  { requestId: "jxgg/tzgg", path: "jxgg/index.htm", channel: "通知公告", blockTitle: "通知公告" },
  { requestId: "jxgg/zyjs", path: "jxgg/index.htm", channel: "专业建设", blockTitle: "专业建设" },
  { requestId: "jxgg/kcjs", path: "jxgg/index.htm", channel: "课程建设", blockTitle: "课程建设" },
  {
    requestId: "jxgg/jcjsygl",
    path: "jxgg/index.htm",
    channel: "教材建设与管理",
    blockTitle: "教材建设与管理",
  },
  { requestId: "jxgg/jgxm", path: "jxgg/index.htm", channel: "教改项目", blockTitle: "教改项目" },
  { requestId: "jxgg/jxcg", path: "jxgg/index.htm", channel: "教学成果", blockTitle: "教学成果" },
  { requestId: "jsjy/tzgg", path: "jsjy/index.htm", channel: "通知公告", blockTitle: "通知公告", pages: 2 },
  { requestId: "jsjy/sjjxtxjs", path: "jsjy/index.htm", channel: "教育实践", blockTitle: "教育实践" },
  { requestId: "jsjy/jszgz", path: "jsjy/index.htm", channel: "教师资格证", blockTitle: "教师资格证" },
  { requestId: "jsjy/jxjbg", path: "jsjy/index.htm", channel: "教学基本功", blockTitle: "教学基本功" },
  { requestId: "jsjy/zyjskc", path: "jsjy/index.htm", channel: "卓越教师课程", blockTitle: "卓越教师课程" },
  { requestId: "jsjy/qsgc", path: "jsjy/qsgc/index.htm", channel: "强师工程", blockTitle: "强师工程" },
  { requestId: "jsjy/sflzyrz", path: "jsjy/sflzyrz/index.htm", channel: "师范专业认证", blockTitle: "师范专业认证" },
  { requestId: "sjjx/tzgg", path: "sjjx/index.htm", channel: "通知公告", blockTitle: "通知公告" },
  { requestId: "sjjx/zysxysj", path: "sjjx/index.htm", channel: "实习实践", blockTitle: "实习实践" },
  { requestId: "sjjx/xkjs", path: "sjjx/index.htm", channel: "学科竞赛", blockTitle: "学科竞赛" },
  { requestId: "sjjx/bylwsj", path: "sjjx/index.htm", channel: "毕业论文（设计）", blockTitle: "毕业论文（设计）" },
  { requestId: "sjjx/cxcy", path: "sjjx/index.htm", channel: "创新创业", blockTitle: "创新创业" },
  { requestId: "zlbz/tzgg", path: "zlbz/index.htm", channel: "通知公告", blockTitle: "通知公告", pages: 3 },
  { requestId: "zlbz/xksppg", path: "zlbz/index.htm", channel: "质量评估", blockTitle: "质量评估" },
  { requestId: "zlbz/bkjxzlbg", path: "zlbz/index.htm", channel: "质量监测", blockTitle: "质量监测" },
  { requestId: "zlbz/jxgmy", path: "zlbz/index.htm", channel: "教学观摩", blockTitle: "教学观摩" },
  { requestId: "zlbz/jxjlgl", path: "zlbz/index.htm", channel: "教学奖励管理", blockTitle: "教学奖励管理" },
  { requestId: "pygc/tzgg", path: "pygc/index.htm", channel: "通知公告", blockTitle: "通知公告", pages: 6 },
  { requestId: "pygc/jwyx", path: "pygc/index.htm", channel: "教学运行", blockTitle: "教学运行" },
  { requestId: "pygc/kwgl", path: "pygc/index.htm", channel: "考务管理", blockTitle: "考务管理" },
  { requestId: "pygc/cjglxygl", path: "pygc/index.htm", channel: "成绩管理", blockTitle: "成绩管理" },
  { requestId: "pygc/xjgl", path: "pygc/index.htm", channel: "学籍管理", blockTitle: "学籍管理" },
  { requestId: "jxzy/tzgg", path: "jxzy/index.htm", channel: "通知公告", blockTitle: "通知公告", pages: 4 },
  { requestId: "jxzy/jxzyjs", path: "jxzy/index.htm", channel: "教学资源介绍", blockTitle: "教学资源介绍" },
  { requestId: "jxzy/jsgl", path: "jxzy/index.htm", channel: "教室管理", blockTitle: "教室管理" },
  { requestId: "jxzy/cggl", path: "jxzy/index.htm", channel: "场馆管理", blockTitle: "场馆管理" },
  { requestId: "jxzy/hysgl", path: "jxzy/index.htm", channel: "会议室管理", blockTitle: "会议室管理" },
  { requestId: "jxzy/yywzgz", path: "jxzy/index.htm", channel: "语言文字工作", blockTitle: "语言文字工作" },
  { requestId: "gjjl/gjgpxmxsl", path: "gjjl/index.htm", channel: "国家公派项目（学生类）", blockTitle: "国家公派项目（学生类）" },
  { requestId: "gjjl/hwsx", path: "gjjl/index.htm", channel: "海外实习", blockTitle: "海外实习" },
  { requestId: "gjjl/gjhkc", path: "gjjl/index.htm", channel: "国际化课程", blockTitle: "国际化课程" },
  { requestId: "gjjl/hwrcpyjd", path: "gjjl/index.htm", channel: "海外人才培养基地", blockTitle: "海外人才培养基地" },
  { requestId: "gjjl/cjgl", path: "gjjl/index.htm", channel: "出境管理", blockTitle: "出境管理" },
  { requestId: "xwgl/xsxw", path: "xwgl/index.htm", channel: "学士学位", blockTitle: "学士学位" },
  { requestId: "xwgl/dsdw", path: "xwgl/index.htm", channel: "导师队伍", blockTitle: "导师队伍" },
  { requestId: "jsfz/tzgg", path: "jsfz/index.htm", channel: "通知公告", blockTitle: "通知公告" },
  { requestId: "jsfz/jspx", path: "jsfz/index.htm", channel: "教师培训", blockTitle: "教师培训" },
  { requestId: "jsfz/jxjs", path: "jsfz/index.htm", channel: "教学竞赛", blockTitle: "教学竞赛" },
  { requestId: "bszn/gzzd", path: "bszn/index.htm", channel: "规章制度", blockTitle: "规章制度" },
  { requestId: "bszn/xjgl", path: "bszn/index.htm", channel: "学籍管理", blockTitle: "学籍管理" },
  { requestId: "bszn/xwzn", path: "bszn/index.htm", channel: "学务指南", blockTitle: "学务指南" },
  { requestId: "bszn/cjjl", path: "bszn/index.htm", channel: "出境交流", blockTitle: "出境交流" },
  { requestId: "bszn/xk", path: "bszn/index.htm", channel: "选课", blockTitle: "选课" },
  { requestId: "bszn/cjd", path: "bszn/index.htm", channel: "成绩单", blockTitle: "成绩单" },
  { requestId: "bszn/kcpj", path: "bszn/index.htm", channel: "课程评教", blockTitle: "课程评教" },
  { requestId: "bszn/xl", path: "bszn/index.htm", channel: "校历", blockTitle: "校历" },
  { requestId: "bszn/jshysyy", path: "bszn/index.htm", channel: "教室/会议室预约", blockTitle: "教室/会议室预约" },
  { requestId: "cyxz/kskh", path: "cyxz/index.htm", channel: "考试考核", blockTitle: "考试考核" },
  { requestId: "cyxz/cjgl", path: "cyxz/index.htm", channel: "成绩管理", blockTitle: "成绩管理" },
  { requestId: "cyxz/cjjl", path: "cyxz/index.htm", channel: "出境交流", blockTitle: "出境交流" },
  { requestId: "cyxz/jsjy", path: "cyxz/index.htm", channel: "教师教育", blockTitle: "教师教育" },
  { requestId: "cyxz/byxw", path: "cyxz/index.htm", channel: "毕业学位", blockTitle: "毕业学位" },
  { requestId: "cyxz/jxzy", path: "cyxz/index.htm", channel: "教学资源", blockTitle: "教学资源" },
];

const lineTargetSpecs: LineTargetSpec[] = [
  { requestId: "tzgg", path: "tzgg/index.htm", channel: "通知公告", pages: 50 },
  { requestId: "zhxw", path: "zhxw/index.htm", channel: "综合新闻", pages: 9 },
];

function createFetchTargets(): FetchTarget[] {
  const articleTargets = articleTargetSpecs.flatMap((spec) =>
    Array.from({ length: spec.pages ?? 1 }, (_, pageIndex) => {
      const requestId = pageIndex === 0 ? spec.requestId : `${spec.requestId}/index${pageIndex}`;
      const path = pageIndex === 0 ? spec.path : spec.path.replace("index.htm", `index${pageIndex}.htm`);

      return {
        id: requestId,
        url: `${baseUrl}${path}`,
        channel: spec.channel,
      } satisfies FetchTarget;
    }),
  );

  const lineTargets = lineTargetSpecs.flatMap((spec) =>
    Array.from({ length: spec.pages }, (_, pageIndex) => {
      const requestId = pageIndex === 0 ? spec.requestId : `${spec.requestId}/index${pageIndex}`;
      const path = pageIndex === 0 ? spec.path : spec.path.replace("index.htm", `index${pageIndex}.htm`);

      return {
        id: requestId,
        url: `${baseUrl}${path}`,
        channel: spec.channel,
      } satisfies FetchTarget;
    }),
  );

  return [...lineTargets, ...articleTargets];
}

const parserTargets: HtmlListParserConfig["targets"] = [
  ...lineTargetSpecs.flatMap((spec) => createPaginatedLineTargets(spec)),
  ...articleTargetSpecs.flatMap((spec) => createPaginatedArticleTargets(spec)),
];

export const jwbFetchTargets: FetchTarget[] = createFetchTargets();
export const jwbParser = createConfiguredHtmlListParser({
  parserKey: "bnuzh/jwb",
  targets: parserTargets,
});
