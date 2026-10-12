import { type FetchTarget } from "@bnuz-feed/contracts";

export type TargetSpec = {
  requestId: string;
  path: string;
  channel: string;
  itemSelector: string;
};

export const baseUrl = "https://phs.bnuzh.edu.cn/English/";

export const targetSpecs: TargetSpec[] = [
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

export const fhsyywwFetchTargets: FetchTarget[] = targetSpecs.map((target) => ({
  id: target.requestId,
  url: `${baseUrl}${target.path}`,
  channel: target.channel,
}));
