import { createDefaultNormalizer } from "@bnuz-feed/core";
import { createBrowserLiveSource } from "@bnuz-feed/runtime-browser";
import { createParserRegistry, publicBnuzhSources } from "@bnuz-feed/source-registry";

export function createDebugBrowserSource() {
  return createBrowserLiveSource({
    sources: publicBnuzhSources,
    parserRegistry: createParserRegistry(),
    normalizer: createDefaultNormalizer(),
    requestOptions: { concurrency: 4, targetConcurrency: 2, timeoutMs: 8000 },
  });
}
