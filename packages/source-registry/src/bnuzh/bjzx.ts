export { bjzxFetchTargets } from "./targets/bjzx";

import { createConfiguredHtmlListParser } from "../parsers/configuredHtmlListParser";

const itemSelector = 'a[href*="docs/"]';

function resolveAttachmentTitle(item: Element): string | undefined {
  const text = item.textContent?.replace(/\s+/g, " ").trim();

  if (!text) {
    return undefined;
  }

  return text.replace(/\s*下载文件\s*$/, "").replace(/\.(pdf|xlsx|xls|docx|doc)$/i, "").trim() || undefined;
}

export const bjzxParser = createConfiguredHtmlListParser({
  parserKey: "bnuzh/bjzx",
  targets: [
    {
      requestId: "home",
      itemSelector,
      channel: "附件下载",
      title: resolveAttachmentTitle,
      url: { attr: "href" },
      rawId: { attr: "href" },
      limit: 20,
    },
  ],
});
