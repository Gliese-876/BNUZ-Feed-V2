import { AggregationError, type Parser, type RawPage, type SourceRecord } from "@bnuz-feed/contracts";

export interface HtmlValueSelector {
  selector?: string;
  attr?: string;
}

export type HtmlValueResolver =
  | string
  | HtmlValueSelector
  | ((item: Element, page: RawPage) => string | undefined);

export interface HtmlListTargetConfig {
  requestId: string;
  itemSelector: string;
  channel?: string;
  title: HtmlValueResolver;
  url: HtmlValueResolver;
  publishedAt?: HtmlValueResolver;
  summary?: HtmlValueResolver;
  rawId?: HtmlValueResolver;
  limit?: number;
  itemFilter?: (item: Element, page: RawPage) => boolean;
}

export interface HtmlListParserConfig {
  parserKey: string;
  targets: HtmlListTargetConfig[];
}

function normalizeText(value: string | null | undefined): string | undefined {
  const normalized = value?.replace(/\s+/g, " ").trim();
  return normalized ? normalized : undefined;
}

function getDocument(page: RawPage): Document {
  if (typeof DOMParser === "undefined") {
    throw new AggregationError(
      "PARSER_FAILED",
      "DOMParser is unavailable in the current runtime.",
      { parserKey: "configured-html-list", requestId: page.requestId },
    );
  }

  return new DOMParser().parseFromString(page.bodyText, "text/html");
}

function resolveSelector(
  item: Element,
  resolver: Exclude<HtmlValueResolver, ((item: Element, page: RawPage) => string | undefined)>,
  fallbackAttr?: string,
): string | undefined {
  const config = typeof resolver === "string" ? { selector: resolver } : resolver;
  const target = config.selector ? item.querySelector(config.selector) : item;

  if (!target) {
    return undefined;
  }

  const attributeName = config.attr ?? fallbackAttr;
  const value = attributeName ? target.getAttribute(attributeName) : target.textContent;
  return normalizeText(value);
}

function resolveValue(
  item: Element,
  page: RawPage,
  resolver: HtmlValueResolver | undefined,
  fallbackAttr?: string,
): string | undefined {
  if (!resolver) {
    return undefined;
  }

  if (typeof resolver === "function") {
    return normalizeText(resolver(item, page));
  }

  return resolveSelector(item, resolver, fallbackAttr);
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

export class ConfiguredHtmlListParser implements Parser {
  readonly parserKey: string;
  private readonly targets: Map<string, HtmlListTargetConfig>;

  constructor(config: HtmlListParserConfig) {
    this.parserKey = config.parserKey;
    this.targets = new Map(config.targets.map((target) => [target.requestId, target]));
  }

  async parse(page: RawPage): Promise<SourceRecord[]> {
    const target = this.targets.get(page.requestId);

    if (!target) {
      throw new AggregationError(
        "PARSER_FAILED",
        `No configured HTML list target matched request "${page.requestId}".`,
        { parserKey: this.parserKey, requestId: page.requestId },
      );
    }

    const document = getDocument(page);
    const candidates = Array.from(document.querySelectorAll(target.itemSelector));
    const filtered = target.itemFilter ? candidates.filter((item) => target.itemFilter!(item, page)) : candidates;
    const limited = typeof target.limit === "number" ? filtered.slice(0, target.limit) : filtered;

    return limited.flatMap((item) => {
      const rawTitle = resolveValue(item, page, target.title);
      const rawUrl = resolveUrl(resolveValue(item, page, target.url, "href"), page);

      if (!rawTitle || !rawUrl) {
        return [];
      }

      return [
        {
          sourceId: page.sourceId,
          rawId: resolveValue(item, page, target.rawId),
          rawTitle,
          rawUrl,
          rawPublishedAt: resolveValue(item, page, target.publishedAt),
          rawChannel: target.channel ?? page.channel,
          rawSummary: resolveValue(item, page, target.summary),
          extras: {
            requestId: page.requestId,
          },
        } satisfies SourceRecord,
      ];
    });
  }
}

export function createConfiguredHtmlListParser(config: HtmlListParserConfig): Parser {
  return new ConfiguredHtmlListParser(config);
}
