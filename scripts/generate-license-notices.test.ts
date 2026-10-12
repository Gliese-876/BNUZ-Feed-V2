import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

const { createNotices, prepareLicenseAssets } = createRequire(import.meta.url)("./generate-license-notices.cjs") as {
  createNotices(root: string): string;
  prepareLicenseAssets(root: string, options?: { check?: boolean }): string;
};
type Entry = {
  version?: string;
  license?: string;
  dependencies?: Record<string, string>;
  dev?: boolean;
  link?: boolean;
  resolved?: string;
};
const directories: string[] = [];
const text = "Copyright Example authors.   \r\nPermission and conditions supplied by the example package.\t\r\n";

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "bnuz-licenses-"));
  directories.push(root);
  const web: Entry = { dependencies: {} };
  const packages: Record<string, Entry> = { "apps/web": web };
  const save = () => writeFileSync(join(root, "package-lock.json"), JSON.stringify({ packages }));
  function add(directory: string, name: string, entry: Entry = { version: "1.0.0", license: "MIT" }) {
    packages[directory] = entry;
    mkdirSync(join(root, directory), { recursive: true });
    writeFileSync(join(root, directory, "package.json"), JSON.stringify({ name, ...entry }));
    writeFileSync(join(root, directory, "LICENSE"), text);
  }
  writeFileSync(join(root, "LICENSE"), "Project MIT license\n");
  writeFileSync(join(root, "NOTICE.md"), "Project licensing scope\n");
  return { root, packages, web, save, add };
}

afterEach(() => {
  for (const root of directories.splice(0)) {
    if (dirname(resolve(root)) !== resolve(tmpdir()) || !basename(root).startsWith("bnuz-licenses-")) {
      throw new Error("Refusing to remove an unexpected fixture directory.");
    }
    rmSync(root, { recursive: true, force: true });
  }
});

describe("third-party license notices", () => {
  it("includes transitive workspace and PWA runtime dependencies, excluding unrelated build tools", () => {
    const f = fixture();
    f.web.dependencies = { "@bnuz-feed/core": "0.1.0" };
    f.packages["node_modules/@bnuz-feed/core"] = { link: true, resolved: "packages/core" };
    f.packages["packages/core"] = { dependencies: { "feed-helper": "1.0.0" } };
    f.add("node_modules/feed-helper", "feed-helper");
    f.add("node_modules/workbox-core", "workbox-core", { version: "1.0.0", license: "MIT", dev: true, dependencies: { "cache-helper": "1.0.0" } });
    f.add("node_modules/cache-helper", "cache-helper", { version: "1.0.0", license: "ISC", dev: true });
    f.add("node_modules/workbox-build", "workbox-build", { version: "1.0.0", license: "MIT", dev: true, dependencies: { "build-tool": "1.0.0" } });
    f.add("node_modules/vite", "vite", { version: "1.0.0", license: "MIT", dev: true, dependencies: { "build-tool": "1.0.0" } });
    f.add("node_modules/vite-plugin-pwa", "vite-plugin-pwa", { version: "1.0.0", license: "MIT", dev: true, dependencies: { "build-tool": "1.0.0" } });
    f.packages["node_modules/build-tool"] = { version: "1.0.0", license: "GPL-3.0-only", dev: true };
    f.save();
    const notices = createNotices(f.root);
    expect(notices).toContain("feed-helper@1.0.0");
    expect(notices).toContain("workbox-core@1.0.0");
    expect(notices).toContain("cache-helper@1.0.0");
    expect(notices).toContain("workbox-build@1.0.0");
    expect(notices).toContain("vite@1.0.0");
    expect(notices).toContain("vite-plugin-pwa@1.0.0");
    expect(notices).not.toContain("build-tool@");
    expect(notices).not.toContain("@bnuz-feed/core@");
  });

  it("resolves nested versions and preserves one shared license text with all package attributions", () => {
    const f = fixture();
    f.web.dependencies = { "view-helper": "1.0.0", "store-helper": "1.0.0" };
    f.add("node_modules/view-helper", "view-helper", { version: "1.0.0", license: "MIT", dependencies: { shared: "1.0.0" } });
    f.add("node_modules/store-helper", "store-helper", { version: "1.0.0", license: "MIT", dependencies: { shared: "2.0.0" } });
    f.add("node_modules/view-helper/node_modules/shared", "shared");
    f.add("node_modules/shared", "shared", { version: "2.0.0", license: "MIT" });
    f.save();
    const notices = createNotices(f.root);
    expect(notices).toContain("shared@1.0.0");
    expect(notices).toContain("shared@2.0.0");
    expect(notices.match(/Copyright Example authors\./g)).toHaveLength(1);
    expect(notices).not.toContain("\r");
    expect(notices).not.toMatch(/[ \t]+$/m);
    expect(notices).toBe(createNotices(f.root));
  });

  it("stops publication when a runtime package has no license file or an empty one", () => {
    const f = fixture();
    f.web.dependencies = { helper: "1.0.0" };
    f.add("node_modules/helper", "helper");
    f.save();
    rmSync(join(f.root, "node_modules/helper/LICENSE"));
    expect(() => createNotices(f.root)).toThrow("No complete license text");
    writeFileSync(join(f.root, "node_modules/helper/LICENSE"), "\n");
    expect(() => createNotices(f.root)).toThrow("Empty license text");
  });

  it("requires review for new runtime licenses and rejects an installation that differs from the lockfile", () => {
    const f = fixture();
    f.web.dependencies = { helper: "1.0.0" };
    f.add("node_modules/helper", "helper", { version: "1.0.0", license: "GPL-3.0-only" });
    f.save();
    expect(() => createNotices(f.root)).toThrow("Review the runtime license");
    f.add("node_modules/helper", "helper");
    f.save();
    writeFileSync(join(f.root, "node_modules/helper/package.json"), JSON.stringify({ name: "helper", version: "2.0.0", license: "MIT" }));
    expect(() => createNotices(f.root)).toThrow("differs from the lockfile");
  });

  it("checks stale notices without modifying them and publishes the original project and third-party texts", () => {
    const f = fixture();
    f.web.dependencies = { helper: "1.0.0" };
    f.add("node_modules/helper", "helper");
    f.save();
    writeFileSync(join(f.root, "THIRD_PARTY_NOTICES.txt"), "outdated");
    expect(() => prepareLicenseAssets(f.root, { check: true })).toThrow("out of date");
    expect(readFileSync(join(f.root, "THIRD_PARTY_NOTICES.txt"), "utf8")).toBe("outdated");
    expect(existsSync(join(f.root, "apps/web/public/legal"))).toBe(false);
    const notices = prepareLicenseAssets(f.root);
    expect(prepareLicenseAssets(f.root, { check: true })).toBe(notices);
    expect(readFileSync(join(f.root, "apps/web/public/legal/LICENSE.txt"), "utf8")).toBe("Project MIT license\n");
    expect(readFileSync(join(f.root, "apps/web/public/legal/NOTICE.txt"), "utf8")).toBe("Project licensing scope\n");
    expect(readFileSync(join(f.root, "apps/web/public/legal/THIRD_PARTY_NOTICES.txt"), "utf8")).toBe(notices);
  });
});
