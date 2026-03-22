import { describe, expect, it } from "vitest";

import {
  allSiteSearchId,
  buildOfficialSiteSearchRequest,
  officialSiteSearchUrl,
} from "./siteSearch";

describe("siteSearch", () => {
  it("builds the official search request for all sites by default", () => {
    const request = buildOfficialSiteSearchRequest({
      query: "  通知公告  ",
    });

    expect(request).not.toBeNull();
    expect(request?.action).toBe(officialSiteSearchUrl);
    expect(request?.method).toBe("post");
    expect(request?.fields).toEqual([
      { name: "siteID", value: allSiteSearchId },
      { name: "channelID", value: "" },
      { name: "searchScope", value: "0" },
      { name: "matchType", value: "0" },
      { name: "combinedSearch", value: "0" },
      { name: "query", value: "通知公告" },
      { name: "keyword_matchType", value: "0" },
      { name: "keyword", value: "" },
      { name: "startDate", value: "" },
      { name: "endDate", value: "" },
      { name: "title_matchType", value: "0" },
      { name: "title", value: "" },
      { name: "content_matchType", value: "0" },
      { name: "content", value: "" },
      { name: "rows", value: "10" },
    ]);
  });

  it("returns null for blank queries", () => {
    expect(buildOfficialSiteSearchRequest({ query: "   " })).toBeNull();
  });

  it("builds advanced search fields when compound inputs are present", () => {
    const request = buildOfficialSiteSearchRequest({
      content: "奖学金",
      contentMatchMode: "fuzzy",
      endDate: "2026-03-31",
      query: "奖学金",
      rows: 50,
      startDate: "2026-03-01",
      title: "通知",
    });

    expect(request?.fields).toEqual(
      expect.arrayContaining([
        { name: "combinedSearch", value: "1" },
        { name: "content_matchType", value: "1" },
        { name: "content", value: "奖学金" },
        { name: "rows", value: "50" },
        { name: "startDate", value: "2026-03-01" },
        { name: "endDate", value: "2026-03-31" },
        { name: "title", value: "通知" },
      ]),
    );
  });
});
