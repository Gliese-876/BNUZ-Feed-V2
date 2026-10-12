import { type FetchTarget } from "@bnuz-feed/contracts";

export type SectionSpec = {
  requestId: string;
  path: string;
  channel: string;
  pages?: number;
};

export const baseUrl = "https://kyb.bnuzh.edu.cn/";

export const sectionSpecs: SectionSpec[] = [
  { requestId: "tpxw", path: "tpxw/index.htm", channel: "图片新闻" },
  { requestId: "kydt", path: "kydt", channel: "科研动态", pages: 17 },
  { requestId: "sbtz", path: "tzgg/sbtz", channel: "申报通知", pages: 1 },
  { requestId: "kyhd", path: "tzgg/kyhd/index.htm", channel: "科研活动" },
  { requestId: "kyrl", path: "kyrl/index.htm", channel: "科研日历" },
  { requestId: "kyxmglgd/gjzrkxjj", path: "glgz/kyxmglgd/gjzrkxjj/index.htm", channel: "科研项目管理规定/国家自然科学基金" },
  { requestId: "kyxmglgd/gjkjzdzx", path: "glgz/kyxmglgd/gjkjzdzx/index.htm", channel: "科研项目管理规定/国家科技重大专项" },
  { requestId: "kyxmglgd/gjzdyfjh", path: "glgz/kyxmglgd/gjzdyfjh/index.htm", channel: "科研项目管理规定/国家重点研发计划" },
  { requestId: "kyxmglgd/gjshkxjj", path: "glgz/kyxmglgd/gjshkxjj/index.htm", channel: "科研项目管理规定/国家社会科学基金" },
  { requestId: "kyxmglgd/jybxm", path: "glgz/kyxmglgd/jybxm/index.htm", channel: "科研项目管理规定/教育部项目" },
  { requestId: "kyxmglgd/qgjykxgh", path: "glgz/kyxmglgd/qgjykxgh/index.htm", channel: "科研项目管理规定/全国教育科学规划" },
  { requestId: "kyxmglgd/gdsxm", path: "glgz/kyxmglgd/gdsxm/index.htm", channel: "科研项目管理规定/广东省项目" },
  { requestId: "kyjfglgd", path: "glgz/kyjfglgd/index.htm", channel: "科研经费管理规定" },
  { requestId: "kyptglgd", path: "glgz/kyptglgd/index.htm", channel: "科研平台管理规定" },
  { requestId: "kycgglgd", path: "glgz/kycgglgd/index.htm", channel: "科研成果管理规定" },
  { requestId: "kxyjxgfg", path: "glgz/kxyjxgfg/index.htm", channel: "科学研究相关法规" },
  { requestId: "xngzzd", path: "glgz/xngzzd/index.htm", channel: "校内规章制度" },
  { requestId: "xmgl", path: "ywzn/xmgl/index.htm", channel: "项目管理" },
  { requestId: "zscq", path: "ywzn/zscq/index.htm", channel: "知识产权" },
  { requestId: "xdhz", path: "xdhz/index.htm", channel: "校地合作" },
  { requestId: "zlxz", path: "zlxz/index.htm", channel: "资料下载" },
];

export function createTargets(): FetchTarget[] {
  return sectionSpecs.flatMap((section) => {
    if (!section.pages) {
      return [
        {
          id: section.requestId,
          url: new URL(section.path, baseUrl).toString(),
          channel: section.channel,
        } satisfies FetchTarget,
      ];
    }

    return Array.from({ length: section.pages }, (_, index) => {
      const suffix = index === 0 ? "" : String(index);
      const requestId = index === 0 ? section.requestId : `${section.requestId}/index${suffix}`;
      const path = `${section.path}/index${suffix}.htm`;

      return {
        id: requestId,
        url: new URL(path, baseUrl).toString(),
        channel: section.channel,
      } satisfies FetchTarget;
    });
  });
}

export const kybgswzFetchTargets = createTargets();
