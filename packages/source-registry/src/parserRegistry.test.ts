import { describe, expect, it } from "vitest";
import type { Parser } from "@bnuz-feed/contracts";
import { createParserRegistry } from "./parserRegistry";

describe("parser registry", () => {
  it("returns no implementation for unknown keys without allocating placeholders", () => {
    const registry = createParserRegistry();
    expect(registry.get("missing")).toBeUndefined();
    expect(registry.get("constructor")).toBeUndefined();
    expect(registry.get("__proto__")).toBeUndefined();
  });

  it("allows explicit overrides and preserves parser identity", () => {
    const parser: Parser = { async parse() { return []; } };
    const registry = createParserRegistry({ parsers: { "bnuzh/bnuz": parser } });
    expect(registry.get("bnuzh/bnuz")).toBe(parser);
    expect(registry.get("bnuzh/bnuz")).toBe(registry.get("bnuzh/bnuz"));
  });
});
