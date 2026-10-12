import { createCampusArticleListParser } from "../parsers/campusArticleListParser";
import { dwbwgzbgsFetchTargets } from "./targets/dwbwgzbgs";

export { dwbwgzbgsFetchTargets } from "./targets/dwbwgzbgs";
export const dwbwgzbgsParser = createCampusArticleListParser("bnuzh/dwbwgzbgs", dwbwgzbgsFetchTargets);
