import { createConfiguredHtmlListParser } from "../parsers/configuredHtmlListParser";
import { createPhotoTarget, createStandardTarget } from "../parsers/zhixingTargets";
import { xzxsySections } from "./targets/xzxsy";

export { xzxsyFetchTargets } from "./targets/xzxsy";

export const xzxsyParser = createConfiguredHtmlListParser({
  parserKey: "bnuzh/xzxsy",
  targets: xzxsySections.map((section) =>
    section.kind === "photo" ? createPhotoTarget(section) : createStandardTarget(section),
  ),
});
