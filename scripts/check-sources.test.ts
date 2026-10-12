import { afterEach, describe, expect, it, vi } from "vitest";

import { compareSourceCatalog, fetchOfficialSiteList, officialSiteListUrl, parseOfficialSiteList } from "./check-sources";

function page(sites: unknown[]) {
  return `<script>var siteList = ${JSON.stringify(sites)}\nrenderSearch(siteList)</script>`;
}

afterEach(() => vi.useRealTimers());

describe("parseOfficialSiteList", () => {
  it("reads the official JSON assignment without evaluating scripts or requiring a semicolon", () => {
    const sites = [{ id: "0", name: "所有站点" }, { id: "alpha", name: '名称 ] [ "', pubUrl: "https://alpha.example", path: "alpha" }];
    expect(parseOfficialSiteList(page(sites))).toEqual(sites);
  });

  it("supports formatted JSON containing brackets inside strings", () => {
    expect(parseOfficialSiteList('const siteList = [\n{"id":"alpha","name":"[站点]","extras":[1,2]}\n];'))
      .toEqual([{ id: "alpha", name: "[站点]" }]);
  });

  it.each([
    "<html>no source list</html>",
    'var siteList = [{"id":"alpha"}',
    "var siteList = []",
    "var siteList = [window.location]",
    page([{ name: "No id" }]),
    page([{ id: "alpha", name: "A" }, { id: "alpha", name: "B" }]),
    page([{ id: "alpha", name: "A", pubUrl: "javascript:alert(1)" }]),
    page([{ id: "alpha", name: "A", path: 1 }]),
  ])("rejects malformed or changed official data", (html) => {
    expect(() => parseOfficialSiteList(html)).toThrow();
  });
});

describe("compareSourceCatalog", () => {
  const allSites = { id: "0", name: "所有站点" };

  it("reports additions, removals, names, URL protocol changes and path changes", () => {
    const report = compareSourceCatalog([
      allSites,
      { id: "alpha", name: "新名称", pubUrl: "https://alpha.example", path: "new-alpha" },
      { id: "new", name: "新增站点", pubUrl: "https://new.example" },
    ], [
      allSites,
      { id: "alpha", name: "旧名称", pubUrl: "http://alpha.example/", path: "old-alpha" },
      { id: "removed", name: "旧站点", pubUrl: "https://removed.example" },
    ]);

    expect(report.driftCount).toBe(3);
    expect(report).toMatchObject({
      officialOptionCount: 3, registeredOptionCount: 3, officialSiteCount: 2, registeredSiteCount: 2,
    });
    expect(report.added.map((site) => site.id)).toEqual(["new"]);
    expect(report.removed.map((site) => site.id)).toEqual(["removed"]);
    expect(report.changed).toEqual([{
      id: "alpha", name: "新名称", fields: {
        name: { registered: "旧名称", official: "新名称" },
        pubUrl: { registered: "http://alpha.example/", official: "https://alpha.example" },
        path: { registered: "old-alpha", official: "new-alpha" },
      },
    }]);
    expect(report.withoutPublicUrl).toEqual([allSites]);
  });

  it("ignores whitespace and trailing slash differences and includes unpublished entries without false drift", () => {
    const report = compareSourceCatalog(
      [allSites, { id: "alpha", name: " A ", pubUrl: " https://alpha.example/ ", path: "alpha" }],
      [allSites, { id: "alpha", name: "A", pubUrl: "https://alpha.example", path: "alpha" }],
    );
    expect(report.driftCount).toBe(0);
    expect(report.withoutPublicUrl).toEqual([allSites]);
  });

  it("detects a removed public URL instead of hiding the registered source", () => {
    expect(compareSourceCatalog([{ id: "alpha", name: "A" }], [{ id: "alpha", name: "A", pubUrl: "https://alpha.example" }])
      .changed[0]?.fields.pubUrl).toEqual({ registered: "https://alpha.example", official: null });
  });
});

describe("fetchOfficialSiteList", () => {
  it("performs one read-only request to the official catalog and parses its response", async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(new Response(page([{ id: "0", name: "所有站点" }])));

    await expect(fetchOfficialSiteList({ fetchFn })).resolves.toEqual([{ id: "0", name: "所有站点" }]);
    expect(fetchFn).toHaveBeenCalledWith(officialSiteListUrl, { signal: expect.any(AbortSignal) });
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it("fails on HTTP errors instead of comparing an error page as an empty catalog", async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(new Response("Unavailable", { status: 503 }));
    await expect(fetchOfficialSiteList({ fetchFn })).rejects.toThrow("HTTP 503");
  });

  it("aborts requests after the configured timeout", async () => {
    vi.useFakeTimers();
    const fetchFn = vi.fn<typeof fetch>((_input, init) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
    }));
    const request = fetchOfficialSiteList({ fetchFn, timeoutMs: 20 });
    const assertion = expect(request).rejects.toThrow("timed out after 20 ms");

    await vi.advanceTimersByTimeAsync(20);
    await assertion;
  });
});
