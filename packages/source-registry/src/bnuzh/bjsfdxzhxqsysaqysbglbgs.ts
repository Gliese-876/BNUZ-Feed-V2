import { createCampusArticleListParser } from "../parsers/campusArticleListParser";
import { bjsfdxzhxqsysaqysbglbgsFetchTargets } from "./targets/bjsfdxzhxqsysaqysbglbgs";

export { bjsfdxzhxqsysaqysbglbgsFetchTargets } from "./targets/bjsfdxzhxqsysaqysbglbgs";
export const bjsfdxzhxqsysaqysbglbgsParser = createCampusArticleListParser(
  "bnuzh/bjsfdxzhxqsysaqysbglbgs",
  bjsfdxzhxqsysaqysbglbgsFetchTargets,
);
