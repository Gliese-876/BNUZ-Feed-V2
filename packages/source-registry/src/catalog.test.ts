import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import { bnuzhSources, campusOnlySourceIds, officialBnuzhSites, publicBnuzhSources } from "./catalog";
import { createParserRegistry } from "./parserRegistry";

describe("official catalog", () => {
  it("retains all official identities and distinguishes the aggregate search option", () => {
    expect(officialBnuzhSites).toHaveLength(50);
    expect(bnuzhSources).toHaveLength(49);
    expect(officialBnuzhSites.filter((site) => !site.pubUrl)).toEqual([{ id: "0", name: "所有站点", smartGet: 0 }]);
    expect(new Set(officialBnuzhSites.map((site) => site.id)).size).toBe(officialBnuzhSites.length);
    expect(bnuzhSources.find((source) => source.parserKey === "bnuzh/bjsfdxzxxy")?.entryUrls).toEqual(["https://zhixing-old.bnuzh.edu.cn"]);
    expect(bnuzhSources.find((source) => source.parserKey === "bnuzh/xzxsy")?.id).toBe("87aa44758c0c48bb956bdae3bc09c3ad");
  });

  it("only schedules verified implementations and keeps unavailable sites in the official catalog", () => {
    const registry = createParserRegistry();
    for (const source of publicBnuzhSources) {
      expect(source.enabled).toBe(true);
      expect(registry.get(source.parserKey), source.parserKey).toBeDefined();
      const targets = source.fetchTargets!;
      expect(new Set(targets.map((target) => target.id)).size, source.parserKey).toBe(targets.length);
      for (const target of targets) expect(new URL(target.url).protocol).toMatch(/^https?:$/);
    }
    expect(bnuzhSources.filter((source) => !source.enabled).map((source) => source.parserKey).sort()).toEqual([
      "bnuzh/bjsfdxzxxy", "bnuzh/gjjlyhzbgsyww",
    ]);
    expect(publicBnuzhSources.filter((source) => campusOnlySourceIds.includes(source.id)).map((source) => source.parserKey)).toEqual([
      "bnuzh/dwbwgzbgs", "bnuzh/bjsfdxzhxqsysaqysbglbgs",
    ]);
  });

  it("has no parser or target registrations outside the official site identities", async () => {
    const { implementedBnuzhFetchTargets } = await import("./bnuzh/targets");
    const { implementedBnuzhParsers } = await import("./bnuzh");
    const officialKeys = new Set(bnuzhSources.map((source) => source.parserKey));
    expect(Object.keys(implementedBnuzhFetchTargets).filter((key) => !officialKeys.has(key))).toEqual([]);
    expect(Object.keys(implementedBnuzhParsers).filter((key) => !officialKeys.has(key))).toEqual([]);
  });

  it("loads catalog data without importing parser implementations", () => {
    const visited = new Set<string>();
    function inspect(file: string): void {
      if (visited.has(file)) return;
      visited.add(file);
      const source = readFileSync(file, "utf8");
      expect(source, file).not.toMatch(/\b(?:DOMParser|ConfiguredHtmlListParser|createConfiguredHtmlListParser|implementedBnuzhParsers)\b/);
      const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
      for (const node of ast.statements) {
        let specifier: string | undefined;
        if (ts.isImportDeclaration(node) && node.importClause && !node.importClause.isTypeOnly) {
          const bindings = node.importClause.namedBindings;
          if (bindings && ts.isNamedImports(bindings) && bindings.elements.every((item) => item.isTypeOnly)) continue;
          specifier = (node.moduleSpecifier as ts.StringLiteral).text;
        } else if (ts.isExportDeclaration(node) && !node.isTypeOnly && node.moduleSpecifier) {
          specifier = (node.moduleSpecifier as ts.StringLiteral).text;
        }
        if (!specifier?.startsWith(".")) continue;
        const base = resolve(dirname(file), specifier);
        if (specifier.endsWith(".json")) {
          expect(() => JSON.parse(readFileSync(base, "utf8"))).not.toThrow();
          continue;
        }
        inspect(existsSync(`${base}.ts`) ? `${base}.ts` : resolve(base, "index.ts"));
      }
    }
    inspect(fileURLToPath(new URL("./catalog.ts", import.meta.url)));
  });
});
