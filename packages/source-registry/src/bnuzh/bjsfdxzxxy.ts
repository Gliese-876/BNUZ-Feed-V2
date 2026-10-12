import { newsCardTargets, standardTargets, photoTargets } from "./targets/bjsfdxzxxy";
export { bjsfdxzxxyFetchTargets } from "./targets/bjsfdxzxxy";
import { createConfiguredHtmlListParser } from "../parsers/configuredHtmlListParser";
import { createStandardTarget, createNewsCardTarget, createPhotoTarget } from "../parsers/zhixingTargets";

export const bjsfdxzxxyParser = createConfiguredHtmlListParser({
  parserKey: "bnuzh/bjsfdxzxxy",
  targets: [
    ...newsCardTargets.map(createNewsCardTarget),
    ...standardTargets.map(createStandardTarget),
    ...photoTargets.map(createPhotoTarget),
  ],
});
