import type { FetchTarget } from "@bnuz-feed/contracts";

import { createConfiguredHtmlListParser, type HtmlListParserConfig } from "../parsers/configuredHtmlListParser";

type TargetSpec = {
  requestId: string;
  path: string;
  channel: string;
  itemSelector: string;
};

const baseUrl = "https://phs.bnuzh.edu.cn/English/";

const targetSpecs: TargetSpec[] = [
  { requestId: "notice", path: "News/Notice/index.htm", channel: "Notice", itemSelector: "li" },
  { requestId: "schoolnews", path: "News/SchoolNews/index.htm", channel: "School News", itemSelector: "dd" },
  {
    requestId: "noticesactivities",
    path: "NoticesandActivities/index.htm",
    channel: "Notices and Activities",
    itemSelector: "li",
  },
  {
    requestId: "languagevillage",
    path: "InternationalEducation/PhoenixLanguageVillage/index.htm",
    channel: "Phoenix Language Village",
    itemSelector: "li",
  },
  {
    requestId: "summerschool",
    path: "InternationalEducation/SummerSchool/index.htm",
    channel: "Summer School",
    itemSelector: "li",
  },
  {
    requestId: "phoenixforum",
    path: "PhoenixAcademicConferences/PhoenixForumofBeijingNormalUniversity/index.htm",
    channel: "Phoenix Forum of Beijing Normal University",
    itemSelector: "li",
  },
  {
    requestId: "lectureseries",
    path: "PhoenixAcademicConferences/PhoenixLectureSeries/index.htm",
    channel: "Phoenix Lecture Series",
    itemSelector: "li",
  },
  { requestId: "admissions", path: "ProspectiveStudents/index.htm", channel: "Admissions", itemSelector: "li" },
  {
    requestId: "classseries",
    path: "Accommodation/GeneralEducation/index.htm",
    channel: "Phoenix Class Series",
    itemSelector: "li",
  },
  {
    requestId: "studentactivities",
    path: "Accommodation/StudentActivities/index.htm",
    channel: "Student Activities",
    itemSelector: "li",
  },
  {
    requestId: "centerdynamics",
    path: "Centers/GreaterBayAreaCulturalandEducationalCommunicationCenter/DynamicsoftheCenter/index.htm",
    channel: "Dynamics of the Center",
    itemSelector: "li",
  },
  {
    requestId: "centeractivities",
    path: "Centers/GreaterBayAreaCulturalandEducationalCommunicationCenter/GuangdongHongKongMacaoCulturalandEducationalExchangeActivities/index.htm",
    channel: "Guangdong-Hong Kong-Macao Cultural and Educational Exchange Activities",
    itemSelector: "li",
  },
  {
    requestId: "projecttraining",
    path: "Centers/GreaterBayAreaCulturalandEducationalCommunicationCenter/Projecttraining/index.htm",
    channel: "Project and Training",
    itemSelector: "li",
  },
];

function normalizeText(value: string | null | undefined): string | undefined {
  const normalized = value?.replace(/\s+/g, " ").trim();
  return normalized ? normalized : undefined;
}

function extractPublishedAt(value: string | null | undefined): string | undefined {
  const normalized = normalizeText(value);
  if (!normalized) {
    return undefined;
  }

  const compact = normalized.replace(/\s+/g, "");

  const fullMatch = compact.match(/(\d{4})[./-](\d{1,2})[./-](\d{1,2})/);
  if (fullMatch) {
    const [, year = "", month = "", day = ""] = fullMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const monthDayMatch = compact.match(/(\d{1,2})[./-](\d{1,2})/);
  if (monthDayMatch) {
    const [, month = "", day = ""] = monthDayMatch;
    return `${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  return undefined;
}

function resolveTitle(item: Element): string | undefined {
  const selectors = ["h3", "h5", "h4", ".gp-ellipsis", ".title", ".n_right h3"];

  for (const selector of selectors) {
    const text = normalizeText(item.querySelector(selector)?.textContent);
    if (text) {
      return text;
    }
  }

  return normalizeText(item.querySelector("a[href]")?.textContent ?? item.textContent);
}

function resolveSummary(item: Element): string | undefined {
  const selectors = ["p", ".summary", ".desc", ".intro"];

  for (const selector of selectors) {
    const text = normalizeText(item.querySelector(selector)?.textContent);
    if (text) {
      return text;
    }
  }

  return undefined;
}

const parserConfig: HtmlListParserConfig = {
  parserKey: "bnuzh/fhsyyww",
  targets: targetSpecs.map((target) => ({
    requestId: target.requestId,
    itemSelector: target.itemSelector,
    channel: target.channel,
    title: resolveTitle,
    url: { selector: "a[href]", attr: "href" },
    publishedAt: (item) => extractPublishedAt(item.textContent),
    summary: resolveSummary,
    rawId: { selector: "a[href]", attr: "href" },
    limit: 20,
    itemFilter: (item) => Boolean(item.querySelector("a[href]") && extractPublishedAt(item.textContent)),
  })),
};

export const fhsyywwFetchTargets: FetchTarget[] = targetSpecs.map((target) => ({
  id: target.requestId,
  url: `${baseUrl}${target.path}`,
  channel: target.channel,
}));

export const fhsyywwParser = createConfiguredHtmlListParser(parserConfig);
