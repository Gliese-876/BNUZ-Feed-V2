import type { Parser, ParserRegistry } from "@bnuz-feed/contracts";

import { implementedBnuzhParsers } from "./bnuzh";
import { PlaceholderParser } from "./placeholderParser";

export interface ParserRegistryOptions {
  parsers?: Record<string, Parser>;
}

export function createParserRegistry(options: ParserRegistryOptions = {}): ParserRegistry {
  const cache = new Map<string, Parser>();
  const parsers = {
    ...implementedBnuzhParsers,
    ...(options.parsers ?? {}),
  };

  return {
    get(parserKey: string) {
      const explicit = parsers[parserKey];
      if (explicit) {
        return explicit;
      }

      if (!cache.has(parserKey)) {
        cache.set(parserKey, new PlaceholderParser(parserKey));
      }

      return cache.get(parserKey);
    },
  };
}
