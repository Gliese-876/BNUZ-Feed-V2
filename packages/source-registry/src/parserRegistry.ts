import type { Parser, ParserRegistry } from "@bnuz-feed/contracts";

import { implementedBnuzhParsers } from "./bnuzh";

export interface ParserRegistryOptions {
  parsers?: Record<string, Parser>;
}

export function createParserRegistry(options: ParserRegistryOptions = {}): ParserRegistry {
  const parsers = {
    ...implementedBnuzhParsers,
    ...(options.parsers ?? {}),
  };

  return {
    get(parserKey: string) {
      return Object.hasOwn(parsers, parserKey) ? parsers[parserKey] : undefined;
    },
  };
}
