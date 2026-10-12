import { type FetchTarget } from "@bnuz-feed/contracts";

export const baseUrl = "https://dwjgb.bnuzh.edu.cn/";

export const targetSpecs = [
  { requestId: "gzdt/xwdt", path: "gzdt/xwdt/index.htm", channel: "\u5de5\u4f5c\u52a8\u6001" },
  { requestId: "gzdt/tzgg", path: "gzdt/tzgg/index.htm", channel: "\u901a\u77e5\u516c\u544a" },
  { requestId: "jxwz", path: "jxwz/index.htm", channel: "\u7cbe\u9009\u6587\u7ae0" },
  { requestId: "zt/ysjh", path: "zt/ysjh/index.htm", channel: "\u201c\u4f18\u5e08\u8ba1\u5212\u201d\u56de\u4fe1\u7cbe\u795e" },
  { requestId: "zt/xxddesdjs", path: "zt/xxddesdjs/index.htm", channel: "\u5b66\u4e60\u515a\u7684\u4e8c\u5341\u5927\u7cbe\u795e" },
  { requestId: "zt/dxjt", path: "zt/dxjt/index.htm", channel: "\u5fb7\u99a8\u8bb2\u575b" },
  { requestId: "sdsf/sddf", path: "sdsf/sddf/index.htm", channel: "\u5e08\u5fb7\u5178\u8303" },
  { requestId: "sdsf/jsfc", path: "sdsf/jsfc/index.htm", channel: "\u6559\u5e08\u98ce\u91c7" },
  { requestId: "xxjy/llxx", path: "xxjy/llxx/index.htm", channel: "\u7406\u8bba\u5b66\u4e60" },
  { requestId: "xxjy/jypx", path: "xxjy/jypx/index.htm", channel: "\u6559\u80b2\u57f9\u8bad" },
  { requestId: "xxjy/jsjy", path: "xxjy/jsjy/index.htm", channel: "\u8b66\u793a\u6559\u80b2" },
  { requestId: "zdjs/sjwj", path: "zdjs/sjwj/index.htm", channel: "\u4e0a\u7ea7\u6587\u4ef6" },
  { requestId: "zdjs/xxwj", path: "zdjs/xxwj/index.htm", channel: "\u5b66\u6821\u6587\u4ef6" },
  { requestId: "sdjd/clgd", path: "sdjd/clgd/index.htm", channel: "\u5904\u7406\u89c4\u5b9a" },
  { requestId: "sdjd/qktb", path: "sdjd/qktb/index.htm", channel: "\u60c5\u51b5\u901a\u62a5" },
] as const;

export const dwjsgzbgsFetchTargets: FetchTarget[] = targetSpecs.map((target) => ({
  id: target.requestId,
  url: `${baseUrl}${target.path}`,
  channel: target.channel,
}));
