import type { FetchTarget } from "@bnuz-feed/contracts";

// The replacement Zhixing site has a new CMS identity and reorganized channels.
export const xzxsySections = [
  { requestId: "xwkx", channel: "新闻快讯", kind: "photo" },
  { requestId: "yrtd/bzr", channel: "导师", kind: "standard" },
  { requestId: "djyl/zbfc", channel: "支部风采", kind: "photo" },
  { requestId: "djyl/zthd", channel: "专题活动", kind: "photo" },
  { requestId: "djyl/dwjs", channel: "队伍建设", kind: "standard" },
  { requestId: "xssw/djsz", channel: "党建思政", kind: "standard" },
  { requestId: "xssw/txfc", channel: "团学风采", kind: "standard" },
  { requestId: "xssw/btjs", channel: "班团建设", kind: "photo" },
  { requestId: "xssw/xfjs", channel: "学风建设", kind: "standard" },
  { requestId: "xssw/xsjz", channel: "学生奖助", kind: "standard" },
  { requestId: "zxsy/zxjt", channel: "知行讲坛", kind: "standard" },
  { requestId: "zxsy/zxdh", channel: "知行导航", kind: "standard" },
  { requestId: "zxsy/zxyx", channel: "知行研习", kind: "standard" },
  { requestId: "zxsy/zxsl", channel: "知行沙龙", kind: "standard" },
  { requestId: "zxsy/zxwq", channel: "知行湾区", kind: "standard" },
  { requestId: "xyzj/xyhd", channel: "校友活动", kind: "standard" },
  { requestId: "xyzj/xyfc", channel: "校友风采", kind: "standard" },
  { requestId: "mtzx/xwbd", channel: "校外报道", kind: "standard" },
] as const;

export const xzxsyFetchTargets: FetchTarget[] = xzxsySections.map((section) => ({
  id: section.requestId,
  url: `https://zhixing.bnuzh.edu.cn/${section.requestId}/index.htm`,
  channel: section.channel,
}));
