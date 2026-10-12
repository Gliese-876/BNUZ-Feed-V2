import { type FetchTarget } from "@bnuz-feed/contracts";

export type TargetConfig = {
  requestId: string;
  url: string;
  channel: string;
};

export const baseUrl = "https://sczx.bnuzh.edu.cn/wlsyjxzx/";

export const targetConfigs: TargetConfig[] = [
  { requestId: "xwgg", url: `${baseUrl}xwgg/index.htm`, channel: "新闻公告" },
  { requestId: "zxfc", url: `${baseUrl}zxfc/index.htm`, channel: "中心风采" },
  { requestId: "sjcx/xkjs", url: `${baseUrl}sjcx/xkjs/index.htm`, channel: "学科竞赛" },
  { requestId: "sjcx/cxcy", url: `${baseUrl}sjcx/cxcy/index.htm`, channel: "创新创业" },
  { requestId: "syjx/szzy", url: `${baseUrl}syjx/szzy/index.htm`, channel: "数字资源" },
  { requestId: "sbhj/yqsb", url: `${baseUrl}sbhj/yqsb/index.htm`, channel: "仪器设备" },
  { requestId: "kjzc/kjqy", url: `${baseUrl}kjzc/kjqy/index.htm`, channel: "科技前沿" },
  { requestId: "kjzc/kpyd", url: `${baseUrl}kjzc/kpyd/index.htm`, channel: "科普园地" },
  { requestId: "kjzc/yssy", url: `${baseUrl}kjzc/yssy/index.htm`, channel: "演示实验" },
  { requestId: "syaq/aqzd", url: `${baseUrl}syaq/aqzd/index.htm`, channel: "安全制度" },
  { requestId: "syaq/aqjy", url: `${baseUrl}syaq/aqjy/index.htm`, channel: "安全教育" },
  { requestId: "syaq/aqzr", url: `${baseUrl}syaq/aqzr/index.htm`, channel: "安全准入" },
  { requestId: "syaq/aqjc", url: `${baseUrl}syaq/aqjc/index.htm`, channel: "安全检查" },
  { requestId: "cgzs/jscg/jshj", url: `${baseUrl}cgzs/jscg/jshj/index.htm`, channel: "教师获奖" },
  { requestId: "cgzs/jscg/jgxm", url: `${baseUrl}cgzs/jscg/jgxm/index.htm`, channel: "教改项目" },
  { requestId: "cgzs/jscg/zllw", url: `${baseUrl}cgzs/jscg/zllw/index.htm`, channel: "专利论文" },
  { requestId: "cgzs/xscg/xsxm", url: `${baseUrl}cgzs/xscg/xsxm/index.htm`, channel: "学生项目" },
  { requestId: "cgzs/xscg/xkjs", url: `${baseUrl}cgzs/xscg/xkjs/index.htm`, channel: "学科竞赛" },
  { requestId: "cgzs/xscg/xslw", url: `${baseUrl}cgzs/xscg/xslw/index.htm`, channel: "学生论文" },
  { requestId: "cgzs/xscg/xshj1", url: `${baseUrl}cgzs/xscg/xshj1/index.htm`, channel: "学生获奖" },
];

export const wlsyjxzxFetchTargets: FetchTarget[] = targetConfigs.map((target) => ({
  id: target.requestId,
  url: target.url,
  channel: target.channel,
}));
