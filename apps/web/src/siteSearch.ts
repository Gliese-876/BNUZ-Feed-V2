export const officialSiteSearchUrl = "https://www.bnuzh.edu.cn/cms/web/search/index.jsp";
export const allSiteSearchId = "0";

export type OfficialSiteSearchMatchMode = "exact" | "fuzzy";

export interface OfficialSiteSearchField {
  name: string;
  value: string;
}

export interface OfficialSiteSearchRequest {
  action: string;
  fields: OfficialSiteSearchField[];
  method: "post";
}

export interface OfficialSiteSearchParams {
  content?: string;
  contentMatchMode?: OfficialSiteSearchMatchMode;
  endDate?: string;
  keyword?: string;
  keywordMatchMode?: OfficialSiteSearchMatchMode;
  query?: string;
  queryMatchMode?: OfficialSiteSearchMatchMode;
  rows?: number;
  siteId?: string;
  startDate?: string;
  title?: string;
  titleMatchMode?: OfficialSiteSearchMatchMode;
}

function normalizeText(value: string | undefined): string {
  return value?.trim() ?? "";
}

function normalizeRows(value: number | undefined): string {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "10";
  }

  return String(Math.max(1, Math.min(500, Math.trunc(value))));
}

function toMatchTypeValue(mode: OfficialSiteSearchMatchMode | undefined): string {
  return mode === "fuzzy" ? "1" : "0";
}

export function buildOfficialSiteSearchRequest(
  params: OfficialSiteSearchParams,
): OfficialSiteSearchRequest | null {
  const normalizedQuery = normalizeText(params.query);
  const normalizedKeyword = normalizeText(params.keyword);
  const normalizedTitle = normalizeText(params.title);
  const normalizedContent = normalizeText(params.content);
  const normalizedStartDate = normalizeText(params.startDate);
  const normalizedEndDate = normalizeText(params.endDate);
  const hasAdvancedSearch =
    normalizedKeyword.length > 0 ||
    normalizedTitle.length > 0 ||
    normalizedContent.length > 0 ||
    normalizedStartDate.length > 0 ||
    normalizedEndDate.length > 0 ||
    typeof params.rows === "number";

  if (
    !normalizedQuery &&
    !normalizedKeyword &&
    !normalizedTitle &&
    !normalizedContent
  ) {
    return null;
  }

  return {
    action: officialSiteSearchUrl,
    method: "post",
    fields: [
      { name: "siteID", value: params.siteId || allSiteSearchId },
      { name: "channelID", value: "" },
      { name: "searchScope", value: "0" },
      { name: "matchType", value: toMatchTypeValue(params.queryMatchMode) },
      { name: "combinedSearch", value: hasAdvancedSearch ? "1" : "0" },
      { name: "query", value: normalizedQuery },
      { name: "keyword_matchType", value: toMatchTypeValue(params.keywordMatchMode) },
      { name: "keyword", value: normalizedKeyword },
      { name: "startDate", value: normalizedStartDate },
      { name: "endDate", value: normalizedEndDate },
      { name: "title_matchType", value: toMatchTypeValue(params.titleMatchMode) },
      { name: "title", value: normalizedTitle },
      { name: "content_matchType", value: toMatchTypeValue(params.contentMatchMode) },
      { name: "content", value: normalizedContent },
      { name: "rows", value: normalizeRows(params.rows) },
    ],
  };
}

export function submitOfficialSiteSearch(params: OfficialSiteSearchParams): boolean {
  const request = buildOfficialSiteSearchRequest(params);
  if (!request || typeof document === "undefined") {
    return false;
  }

  const form = document.createElement("form");
  form.action = request.action;
  form.method = request.method;
  form.target = "_blank";
  form.acceptCharset = "utf-8";
  form.style.display = "none";

  for (const field of request.fields) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = field.name;
    input.value = field.value;
    form.append(input);
  }

  document.body.append(form);
  form.submit();
  form.remove();
  return true;
}
