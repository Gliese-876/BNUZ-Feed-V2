import { createConfiguredHtmlListParser } from "../parsers/configuredHtmlListParser";
import { yhzyztwFetchTargets } from "./targets/yhzyztw";

export { yhzyztwFetchTargets } from "./targets/yhzyztw";

export const yhzyztwParser = createConfiguredHtmlListParser({
  parserKey: "bnuzh/yhzyztw",
  targets: yhzyztwFetchTargets.map((target) => ({
    requestId: target.id,
    channel: target.channel,
    itemSelector: target.id === "guides" ? "a.service-item[href]" : "a.hot-item[href]",
    title: target.id === "guides" ? {} : ".qa-text",
    url: { attr: "href" },
    rawId: { attr: "href" },
    summary: target.id === "rmwt" ? ".answer-text" : undefined,
    // These guides have no list publication dates; preserve that absence.
  })),
});
