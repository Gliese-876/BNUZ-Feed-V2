import { AggregationError, type FetchTarget, type Parser, type RawPage, type SourceRecord } from "@bnuz-feed/contracts";

type TargetSpec = {
  requestId: string;
  path: string;
  channel: string;
  pages?: number;
};

const baseUrl = "https://english.bnuzh.edu.cn/";

const targetSpecs: TargetSpec[] = [
  { requestId: "news", path: "News/index.htm", channel: "News", pages: 5 },
  { requestId: "events", path: "News/Events/index.htm", channel: "Events", pages: 2 },
  { requestId: "bnuinhenews", path: "News/BNUinheNews/index.htm", channel: "BNU in the News", pages: 2 },
  { requestId: "newsletters", path: "News/Newsletters/index.htm", channel: "Newsletters" },
  { requestId: "admissions", path: "Admissions/index.htm", channel: "Admissions" },
  { requestId: "campus", path: "Campus/index.htm", channel: "Student Life" },
  { requestId: "campuslife", path: "CampusLife/index.htm", channel: "Campus Life" },
  { requestId: "pictures", path: "CampusLife/Pictures/index.htm", channel: "Pictures", pages: 2 },
  { requestId: "articles", path: "CampusLife/Articles/index.htm", channel: "Articles" },
  { requestId: "videos", path: "CampusLife/Videos/index.htm", channel: "Videos" },
  { requestId: "joinus", path: "JoinUs/index.htm", channel: "Join Us" },
  { requestId: "students", path: "Students/index.htm", channel: "Students" },
];

const titleSelectors = [".title", ".news-title", ".article-title"];
const dateSelectors = [".time", ".date", "time"];
const summarySelectors = [".info", ".summary", ".desc", ".intro"];

const monthMap: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

function normalizeText(value: string | null | undefined): string | undefined {
  const normalized = value?.replace(/\s+/g, " ").trim();
  return normalized ? normalized : undefined;
}

function resolveText(element: Element, selectors: string[]): string | undefined {
  for (const selector of selectors) {
    const value = normalizeText(element.querySelector(selector)?.textContent);
    if (value) {
      return value;
    }
  }

  return undefined;
}

function resolveUrl(url: string | undefined, page: Pick<RawPage, "finalUrl" | "requestUrl">): string | undefined {
  if (!url) {
    return undefined;
  }

  try {
    return new URL(url, page.finalUrl || page.requestUrl).toString();
  } catch {
    return url;
  }
}

function parseDateToken(value: string | null | undefined): string | undefined {
  const text = normalizeText(value);
  if (!text) {
    return undefined;
  }

  const isoMatch = text.match(/(\d{4})[./-](\d{1,2})[./-](\d{1,2})/);
  if (isoMatch) {
    const [, year = "", month = "", day = ""] = isoMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const englishMatch = text.match(/^([A-Za-z]{3,9})\.?\s*(\d{1,2})\s*,\s*(\d{4})$/);
  if (!englishMatch) {
    return undefined;
  }

  const [, monthToken = "", day = "", year = ""] = englishMatch;
  const month = monthMap[monthToken.toLowerCase()];

  if (!month) {
    return undefined;
  }

  return `${year}-${String(month).padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function resolvePublishedAt(element: Element): string | undefined {
  return parseDateToken(resolveText(element, dateSelectors) ?? element.textContent);
}

function resolveSummary(element: Element): string | undefined {
  return resolveText(element, summarySelectors);
}

function buildRecord(item: Element, page: RawPage, channel: string): SourceRecord | null {
  const anchor = item.querySelector("a[href]");
  const rawId = anchor?.getAttribute("href") ?? undefined;
  const rawUrl = resolveUrl(rawId, page);
  const rawTitle = resolveText(item, titleSelectors);
  const rawPublishedAt = resolvePublishedAt(item);

  if (!rawUrl || !rawTitle || !rawPublishedAt) {
    return null;
  }

  return {
    sourceId: page.sourceId,
    rawId,
    rawTitle,
    rawUrl,
    rawPublishedAt,
    rawChannel: channel,
    rawSummary: resolveSummary(item),
    extras: {
      requestId: page.requestId,
    },
  };
}

function scoreList(list: Element, page: RawPage, channel: string): SourceRecord[] {
  const records: SourceRecord[] = [];

  for (const child of Array.from(list.children)) {
    if (child.tagName !== "LI") {
      continue;
    }

    const record = buildRecord(child, page, channel);
    if (record) {
      records.push(record);
    }
  }

  return records;
}

function resolveBestRecords(document: Document, page: RawPage, channel: string): SourceRecord[] {
  let bestRecords: SourceRecord[] = [];

  for (const list of Array.from(document.querySelectorAll("ul"))) {
    const records = scoreList(list, page, channel);
    if (records.length > bestRecords.length) {
      bestRecords = records;
    }
  }

  return bestRecords;
}

function getDocument(page: RawPage): Document {
  if (typeof DOMParser === "undefined") {
    throw new AggregationError(
      "PARSER_FAILED",
      "DOMParser is unavailable in the current runtime.",
      { parserKey: "bnuzh/ebnuz", requestId: page.requestId },
    );
  }

  return new DOMParser().parseFromString(page.bodyText, "text/html");
}

function buildTargets(): FetchTarget[] {
  return targetSpecs.flatMap((spec) =>
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
}

function getTarget(requestId: string): TargetSpec | undefined {
  return targetSpecs.find((spec) => {
    if (spec.requestId === requestId) {
      return true;
    }

    const pageCount = spec.pages ?? 1;
    return pageCount > 1 && requestId.startsWith(`${spec.requestId}/index`);
  });
}

class EbnuzParser implements Parser {
  readonly parserKey = "bnuzh/ebnuz";

  async parse(page: RawPage): Promise<SourceRecord[]> {
    const target = getTarget(page.requestId);

    if (!target) {
      throw new AggregationError(
        "PARSER_FAILED",
        `No configured target matched request "${page.requestId}".`,
        { parserKey: this.parserKey, requestId: page.requestId },
      );
    }

    const document = getDocument(page);
    return resolveBestRecords(document, page, target.channel);
  }
}

export const ebnuzFetchTargets = buildTargets();
export const ebnuzParser: Parser = new EbnuzParser();
