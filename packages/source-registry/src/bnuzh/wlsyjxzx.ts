import {
  AggregationError,
  type FetchTarget,
  type Parser,
  type RawPage,
  type SourceRecord,
} from "@bnuz-feed/contracts";

type TargetConfig = {
  requestId: string;
  url: string;
  channel: string;
};

const baseUrl = "https://sczx.bnuzh.edu.cn/wlsyjxzx/";

const targetConfigs: TargetConfig[] = [
  { requestId: "xwgg", url: `${baseUrl}xwgg/index.htm`, channel: "新闻公告" },
  { requestId: "zxfc", url: `${baseUrl}zxfc/index.htm`, channel: "中心风采" },
  { requestId: "sjcx/xkjs", url: `${baseUrl}sjcx/xkjs/index.htm`, channel: "学科竞赛" },
  { requestId: "sjcx/cxcy", url: `${baseUrl}sjcx/cxcy/index.htm`, channel: "创新创业" },
  { requestId: "syjx/szzy", url: `${baseUrl}syjx/szzy/index.htm`, channel: "数字资源" },
  { requestId: "sbhj/yqsb", url: `${baseUrl}sbhj/yqsb/index.htm`, channel: "仪器设备" },
  { requestId: "kjzc/kjqy", url: `${baseUrl}kjzc/kjqy/index.htm`, channel: "科技前沿" },
  { requestId: "kjzc/kpyd", url: `${baseUrl}kjzc/kpyd/index.htm`, channel: "科普园地" },
  { requestId: "kjzc/yssy", url: `${baseUrl}kjzc/yssy/index.htm`, channel: "演示实验" },
  { requestId: "syaq/aqzd", url: `${baseUrl}syaq/aqzd/index.htm`, channel: "安全制度" },
  { requestId: "syaq/aqjy", url: `${baseUrl}syaq/aqjy/index.htm`, channel: "安全教育" },
  { requestId: "syaq/aqzr", url: `${baseUrl}syaq/aqzr/index.htm`, channel: "安全准入" },
  { requestId: "syaq/aqjc", url: `${baseUrl}syaq/aqjc/index.htm`, channel: "安全检查" },
  { requestId: "cgzs/jscg/jshj", url: `${baseUrl}cgzs/jscg/jshj/index.htm`, channel: "教师获奖" },
  { requestId: "cgzs/jscg/jgxm", url: `${baseUrl}cgzs/jscg/jgxm/index.htm`, channel: "教改项目" },
  { requestId: "cgzs/jscg/zllw", url: `${baseUrl}cgzs/jscg/zllw/index.htm`, channel: "专利论文" },
  { requestId: "cgzs/xscg/xsxm", url: `${baseUrl}cgzs/xscg/xsxm/index.htm`, channel: "学生项目" },
  { requestId: "cgzs/xscg/xkjs", url: `${baseUrl}cgzs/xscg/xkjs/index.htm`, channel: "学科竞赛" },
  { requestId: "cgzs/xscg/xslw", url: `${baseUrl}cgzs/xscg/xslw/index.htm`, channel: "学生论文" },
  { requestId: "cgzs/xscg/xshj1", url: `${baseUrl}cgzs/xscg/xshj1/index.htm`, channel: "学生获奖" },
];

const navigationTitles = new Set([
  "首页",
  "学校主页",
  "统一认证登录",
  "English",
  "更多",
  "更多+",
  "上一页",
  "下一页",
  "首页",
  "末页",
  "跳转",
  "页",
  "共",
  "第",
  "中心概况",
  "实验教学",
  "虚拟仿真",
  "实践创新",
  "设备环境",
  "科技之窗",
  "实验安全",
  "成果展示",
  "教师成果",
  "学生成果",
  "科学简史",
  "聚焦诺贝尔",
  "科技前沿",
  "科普园地",
  "演示实验",
  "仪器设备",
  "实验项目统计",
  "安全制度",
  "安全教育",
  "安全准入",
  "安全检查",
  "教师获奖",
  "教改项目",
  "专利论文",
  "出版教材",
  "学生项目",
  "学科竞赛",
  "学生论文",
  "学生获奖",
]);

function normalizeText(value: string | null | undefined): string | undefined {
  const normalized = value?.replace(/\s+/g, " ").trim();
  return normalized ? normalized : undefined;
}

function normalizeDateToken(value: string): string {
  const compact = value.replace(/\s+/g, "");
  const isoMatch = compact.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})$/);
  if (isoMatch) {
    const [, year = "", month = "", day = ""] = isoMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const cnMatch = compact.match(/^(\d{4})年(\d{1,2})月(\d{1,2})[日号]?$/);
  if (cnMatch) {
    const [, year = "", month = "", day = ""] = cnMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  return compact.replace(/\//g, "-");
}

function normalizeDateText(value: string | null | undefined): string | undefined {
  const text = normalizeText(value);
  if (!text) {
    return undefined;
  }

  const matched = text.match(/\d{4}\s*(?:[./-]|年)\s*\d{1,2}\s*(?:[./-]|月)\s*\d{1,2}\s*(?:日|号)?/);
  if (!matched) {
    return undefined;
  }

  return normalizeDateToken(matched[0]);
}

function getDocument(page: RawPage): Document {
  if (typeof DOMParser === "undefined") {
    throw new AggregationError("PARSER_FAILED", "DOMParser is unavailable in the current runtime.", {
      parserKey: "bnuzh/wlsyjxzx",
      requestId: page.requestId,
    });
  }

  return new DOMParser().parseFromString(page.bodyText, "text/html");
}

function getTarget(page: RawPage): TargetConfig {
  const target = targetConfigs.find((entry) => entry.requestId === page.requestId);

  if (!target) {
    throw new AggregationError("PARSER_FAILED", `No configured target matched request "${page.requestId}".`, {
      parserKey: "bnuzh/wlsyjxzx",
      requestId: page.requestId,
    });
  }

  return target;
}

function resolveUrl(href: string | undefined, page: RawPage): string | undefined {
  if (!href) {
    return undefined;
  }

  try {
    return new URL(href, page.finalUrl || page.requestUrl).toString();
  } catch {
    return href;
  }
}

function getHref(item: Element): string | undefined {
  return normalizeText(item.getAttribute("href"));
}

function getTitleElement(item: Element): Element | undefined {
  return item.querySelector("p, .title, .name, .article-title, h1, h2, h3") ?? undefined;
}

function resolveTitle(item: Element): string | undefined {
  const titleElement = getTitleElement(item);
  const titleValue = titleElement?.textContent ?? item.querySelector("a[href]")?.textContent ?? item.textContent;
  return normalizeText(titleValue);
}

function resolvePublishedAt(item: Element, titleElement: Element | undefined): string | undefined {
  const candidates = Array.from(item.querySelectorAll("time, .time, .date, .publish-time, .article-date"));

  for (const candidate of candidates) {
    if (titleElement && titleElement.contains(candidate)) {
      continue;
    }

    const value = normalizeDateText(candidate.textContent);
    if (value) {
      return value;
    }
  }

  return normalizeDateText(item.textContent);
}

function hasContentShape(item: Element): boolean {
  return Boolean(
    item.querySelector("img, picture, p, .title, .name, .article-title, h1, h2, h3, time, .time, .date, .publish-time, .article-date"),
  );
}

function shouldKeepItem(item: Element): boolean {
  if (item.closest("header, footer, nav, aside, [role='navigation'], [role='complementary']")) {
    return false;
  }

  const href = getHref(item);
  const title = resolveTitle(item);

  if (!href || href === "#" || href.startsWith("javascript:")) {
    return false;
  }

  if (!title || navigationTitles.has(title)) {
    return false;
  }

  if (
    /^(首页|学校主页|统一认证登录|English|上一页|下一页|首页|末页|跳转|更多\+?|\d+|共\d+条|每页\s*\d+条|第\d+页)$/.test(
      title,
    )
  ) {
    return false;
  }

  return hasContentShape(item);
}

function buildRecord(item: Element, page: RawPage, channel: string): SourceRecord | null {
  if (!shouldKeepItem(item)) {
    return null;
  }

  const href = getHref(item);
  const titleElement = getTitleElement(item);
  const rawTitle = resolveTitle(item);
  const rawUrl = resolveUrl(href, page);

  if (!href || !rawTitle || !rawUrl) {
    return null;
  }

  return {
    sourceId: page.sourceId,
    rawId: href,
    rawTitle,
    rawUrl,
    rawPublishedAt: resolvePublishedAt(item, titleElement),
    rawChannel: channel,
    extras: {
      requestId: page.requestId,
    },
  };
}

class WlsyjxzxParser implements Parser {
  readonly parserKey = "bnuzh/wlsyjxzx";

  async parse(page: RawPage): Promise<SourceRecord[]> {
    const target = getTarget(page);
    const document = getDocument(page);
    const seen = new Map<string, SourceRecord>();

    for (const item of Array.from(document.querySelectorAll("a[href]"))) {
      const record = buildRecord(item, page, target.channel);
      if (!record) {
        continue;
      }

      const dedupeKey = [record.rawUrl, record.rawTitle, record.rawPublishedAt ?? "", record.rawChannel ?? ""].join("|");
      if (!seen.has(dedupeKey)) {
        seen.set(dedupeKey, record);
      }
    }

    return Array.from(seen.values());
  }
}

export const wlsyjxzxFetchTargets: FetchTarget[] = targetConfigs.map((target) => ({
  id: target.requestId,
  url: target.url,
  channel: target.channel,
}));

export const wlsyjxzxParser: Parser = new WlsyjxzxParser();
