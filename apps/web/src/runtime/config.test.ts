import { describe, expect, it } from "vitest";

import { resolvePublicAssetUrl } from "./config";

describe("runtime config", () => {
  it("resolves asset URLs from the root path by default", () => {
    expect(resolvePublicAssetUrl("data/feed-snapshot.json", "/")).toBe("/data/feed-snapshot.json");
  });

  it("resolves asset URLs from a GitHub Pages project base path", () => {
    expect(resolvePublicAssetUrl("data/feed-snapshot.json", "/BNUZ-Feed-V2/")).toBe(
      "/BNUZ-Feed-V2/data/feed-snapshot.json",
    );
  });

  it("normalizes missing slashes in the supplied base path", () => {
    expect(resolvePublicAssetUrl("/data/source-health.json", "BNUZ-Feed-V2")).toBe(
      "/BNUZ-Feed-V2/data/source-health.json",
    );
  });
});
