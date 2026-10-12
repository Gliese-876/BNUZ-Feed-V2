import { type FetchTarget } from "@bnuz-feed/contracts";

export type TargetSpec = {
  requestId: string;
  path: string;
  channel: string;
  pages?: number;
};

export const baseUrl = "https://english.bnuzh.edu.cn/";

export const targetSpecs: TargetSpec[] = [
  { requestId: "news", path: "News/News/index.htm", channel: "News", pages: 5 },
  { requestId: "events", path: "News/Events/index.htm", channel: "Events", pages: 2 },
  { requestId: "bnuinhenews", path: "News/BNUinheNews/index.htm", channel: "BNU in the News", pages: 2 },
  { requestId: "newsletters", path: "News/Newsletters/index.htm", channel: "Newsletters" },
  { requestId: "admissions", path: "Admissions/index.htm", channel: "Admissions" },
  { requestId: "campus", path: "Campus/StudentLife/index.htm", channel: "Student Life" },
  { requestId: "campuslife", path: "CampusLife/index.htm", channel: "Campus Life" },
  { requestId: "pictures", path: "CampusLife/Pictures/index.htm", channel: "Pictures", pages: 2 },
  { requestId: "articles", path: "CampusLife/Articles/index.htm", channel: "Articles" },
  { requestId: "videos", path: "CampusLife/Videos/index.htm", channel: "Videos" },
  { requestId: "joinus", path: "JoinUs/index.htm", channel: "Join Us" },
  { requestId: "students", path: "Students/index.htm", channel: "Students" },
];

export function buildTargets(): FetchTarget[] {
  return targetSpecs.flatMap((spec) =>
    Array.from({ length: spec.pages ?? 1 }, (_, pageIndex) => {
      const requestId = pageIndex === 0 ? spec.requestId : `${spec.requestId}/index${pageIndex}`;
      const path = pageIndex === 0 ? spec.path : spec.path.replace("index.htm", `index${pageIndex}.htm`);

      return {
        id: requestId,
        url: `${baseUrl}${path}`,
        channel: spec.channel,
      } satisfies FetchTarget;
    }),
  );
}

export const ebnuzFetchTargets = buildTargets();
