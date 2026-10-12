import { type FetchTarget } from "@bnuz-feed/contracts";

export type SectionSpec = {
  key: string;
  channel: string;
  path: string;
  pages: number;
};

export const baseUrl = "https://ht.bnuzh.edu.cn/";

export const sectionSpecs: SectionSpec[] = [
  {
    key: "sdyw",
    channel: "师大要闻",
    path: "sdyw",
    pages: 12,
  },
  {
    key: "tzgg",
    channel: "通知公告",
    path: "tzgg",
    pages: 3,
  },
  {
    key: "czyl",
    channel: "成长引领",
    path: "czyl",
    pages: 15,
  },
  {
    key: "xyfz",
    channel: "学业发展",
    path: "xyfz",
    pages: 13,
  },
  {
    key: "syfw",
    channel: "生涯服务",
    path: "syfw",
    pages: 19,
  },
  {
    key: "htfc",
    channel: "会同风采",
    path: "htfc",
    pages: 5,
  },
  {
    key: "cjyw",
    channel: "常见业务",
    path: "bszn/cjyw",
    pages: 1,
  },
  {
    key: "zywj",
    channel: "重要文件",
    path: "bszn/zywj",
    pages: 1,
  },
  {
    key: "cyxz",
    channel: "常用下载",
    path: "bszn/cyxz",
    pages: 1,
  },
];

export const htsywzFetchTargets: FetchTarget[] = sectionSpecs.flatMap((section) =>
  Array.from({ length: section.pages }, (_, pageIndex) => {
    const suffix = pageIndex === 0 ? "" : String(pageIndex);
    const id = `${section.key}/index${suffix}`;
    const url = `${baseUrl}${section.path}/index${suffix}.htm`;

    return {
      id,
      url,
      channel: section.channel,
    } satisfies FetchTarget;
  }),
);
