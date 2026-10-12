import { type FetchTarget } from "@bnuz-feed/contracts";

export type PageTarget = {
  requestId: string;
  channel: string;
  path: string;
};

export const baseUrl = "https://xcb.bnuzh.edu.cn";

export const ttgzPages = Array.from({ length: 39 }, (_, index) => index);

export const tzggPages = Array.from({ length: 17 }, (_, index) => index);

export const zhbdPages = Array.from({ length: 84 }, (_, index) => index);

export const mtsdPages = Array.from({ length: 55 }, (_, index) => index);

export const ttgzTargets: PageTarget[] = ttgzPages.map((pageIndex) => ({
  requestId: pageIndex === 0 ? "ttgz" : `ttgz/index${pageIndex}`,
  channel: "头条关注",
  path: pageIndex === 0 ? "/xqxw/ttgz/index.htm" : `/xqxw/ttgz/index${pageIndex}.htm`,
}));

export const tzggTargets: PageTarget[] = tzggPages.map((pageIndex) => ({
  requestId: pageIndex === 0 ? "tzgg" : `tzgg/index${pageIndex}`,
  channel: "通知公告",
  path: pageIndex === 0 ? "/xqxw/tzgg/index.htm" : `/xqxw/tzgg/index${pageIndex}.htm`,
}));

export const zhbdTargets: PageTarget[] = zhbdPages.map((pageIndex) => ({
  requestId: pageIndex === 0 ? "zhbd" : `zhbd/index${pageIndex}`,
  channel: "综合报道",
  path: pageIndex === 0 ? "/xqxw/zhbd/index.htm" : `/xqxw/zhbd/index${pageIndex}.htm`,
}));

export const mtsdTargets: PageTarget[] = mtsdPages.map((pageIndex) => ({
  requestId: pageIndex === 0 ? "mtsd" : `mtsd/index${pageIndex}`,
  channel: "媒体师大",
  path: pageIndex === 0 ? "/xqxw/mtsd/index.htm" : `/xqxw/mtsd/index${pageIndex}.htm`,
}));

export const gysdTargets: PageTarget[] = [
  {
    requestId: "gysd",
    channel: "光影师大",
    path: "/gysd/index.htm",
  },
];

export const zhxqxwwFetchTargets: FetchTarget[] = [...ttgzTargets, ...tzggTargets, ...zhbdTargets, ...mtsdTargets, ...gysdTargets].map((target) => ({
  id: target.requestId,
  url: `${baseUrl}${target.path}`,
  channel: target.channel,
}));
