import { AggregationError, type FetchTarget, type Parser, type RawPage, type SourceRecord } from "@bnuz-feed/contracts";

type PageSpec = {
  requestId: string;
  channel: string;
  path: string;
  kind: "standard" | "featured";
};

const baseUrl = "http://www.bnuzh.edu.cn";

const pageSpecs: PageSpec[] = [
  { requestId: "xqtt", channel: "校区头条", path: "/xqtt/index.htm", kind: "standard" },
  { requestId: "zhxw", channel: "综合新闻", path: "/zhxw/index.htm", kind: "standard" },
  { requestId: "tzgs", channel: "通知公示", path: "/tzgs/index.htm", kind: "standard" },
  { requestId: "mtsd", channel: "媒体师大", path: "/mtsd/index.htm", kind: "standard" },
  { requestId: "xshd", channel: "学术活动", path: "/xshd/index.htm", kind: "featured" },
  { requestId: "xqgs", channel: "校区故事", path: "/xqgs/index.htm", kind: "standard" },
];

function normalizeText(value: string | null | undefined): string | undefined {
  const normalized = value?.replace(/\s+/g, " ").trim();
  return normalized ? normalized : undefined;
}

function getDocument(page: RawPage): Document {
  if (typeof DOMParser === "undefined") {
    throw new AggregationError("PARSER_FAILED", "DOMParser is unavailable in the current runtime.", {
      parserKey: "bnuzh/bnuz",
      requestId: page.requestId,
    });
  }

  return new DOMParser().parseFromString(page.bodyText, "text/html");
}

function resolveUrl(url: string | undefined, page: RawPage): string | undefined {
  if (!url) {
    return undefined;
  }

  try {
    return new URL(url, page.finalUrl || page.requestUrl).toString();
  } catch {
    return url;
  }
}

function createFetchTargets(): FetchTarget[] {
  return pageSpecs.flatMap((spec) =>
    Array.from({ length: 5 }, (_, pageIndex) => {
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

function createRecord(
  page: RawPage,
  channel: string,
  title: string | undefined,
  rawId: string | undefined,
  url: string | undefined,
  publishedAt: string | undefined,
  summary?: string,
): SourceRecord | null {
  if (!title || !rawId || !url) {
    return null;
  }

  return {
    sourceId: page.sourceId,
    rawId,
    rawTitle: title,
    rawUrl: url,
    rawPublishedAt: publishedAt,
    rawChannel: channel,
    rawSummary: summary,
    extras: {
      requestId: page.requestId,
    },
  };
}

function parseStandardList(page: RawPage, channel: string): SourceRecord[] {
  const document = getDocument(page);
  const items = Array.from(document.querySelectorAll("ul.bnuh-list20.bnuh-list21 > li"));

  return items.flatMap((item) => {
    const link = item.querySelector("a[href]");
    const rawId = normalizeText(link?.getAttribute("href") ?? undefined);
    const title = normalizeText(link?.textContent);
    const url = resolveUrl(rawId, page);
    const publishedAt = normalizeText(item.querySelector("span")?.textContent);
    const record = createRecord(page, channel, title, rawId, url, publishedAt);
    return record ? [record] : [];
  });
}

function parseFeaturedList(page: RawPage, channel: string): SourceRecord[] {
  const document = getDocument(page);
  const items = Array.from(document.querySelectorAll("ul.bnuh-list22 > li"));

  return items.flatMap((item) => {
    const link = item.querySelector("a[href]");
    const rawId = normalizeText(link?.getAttribute("href") ?? undefined);
    const title = normalizeText(item.querySelector("h3")?.textContent ?? link?.textContent);
    const url = resolveUrl(rawId, page);
    const publishedAt = normalizeText(item.querySelector("span")?.textContent);
    const summary = normalizeText(item.querySelector("p")?.textContent);
    const record = createRecord(page, channel, title, rawId, url, publishedAt, summary);
    return record ? [record] : [];
  });
}

class BnuzParser implements Parser {
  readonly parserKey = "bnuzh/bnuz";

  async parse(page: RawPage): Promise<SourceRecord[]> {
    const target = pageSpecs.find((spec) => spec.requestId === page.requestId);

    if (!target) {
      throw new AggregationError("PARSER_FAILED", `No configured target matched request "${page.requestId}".`, {
        parserKey: this.parserKey,
        requestId: page.requestId,
      });
    }

    if (target.kind === "featured") {
      return parseFeaturedList(page, target.channel);
    }

    return parseStandardList(page, target.channel);
  }
}

export const bnuzFetchTargets: FetchTarget[] = createFetchTargets();
export const bnuzParser: Parser = new BnuzParser();
