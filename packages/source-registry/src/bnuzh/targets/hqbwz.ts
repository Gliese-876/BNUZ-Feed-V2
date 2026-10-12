import { type FetchTarget } from "@bnuz-feed/contracts";

export const baseUrl = "https://hqb.bnuzh.edu.cn";

export const hqbwzFetchTargets: FetchTarget[] = [
  { id: "xwdt", url: `${baseUrl}/xwgg/xwdt/index.htm`, channel: "新闻动态" },
  { id: "tzgg", url: `${baseUrl}/xwgg/tzgg/index.htm`, channel: "通知公告" },
  { id: "xynxgzcgz", url: `${baseUrl}/zcgz/xynxgzcgz/index.htm`, channel: "行业内相关政策规章" },
  { id: "xxxgzcgz", url: `${baseUrl}/zcgz/xxxgzcgz/index.htm`, channel: "学校相关政策规章" },
  { id: "zbgz", url: `${baseUrl}/dqjs/zbgz/index.htm`, channel: "支部工作" },
  { id: "zhsw", url: `${baseUrl}/bszn/zhsw/index.htm`, channel: "综合事务" },
  { id: "xsyb", url: `${baseUrl}/bszn/xsyb/index.htm`, channel: "学生医保" },
  { id: "ggws", url: `${baseUrl}/bszn/ggws/index.htm`, channel: "公共卫生" },
  { id: "cyfw", url: `${baseUrl}/bszn/cyfw/index.htm`, channel: "餐饮服务" },
  { id: "zgwy", url: `${baseUrl}/bszn/zgwy/index.htm`, channel: "自管物业" },
  { id: "yllh", url: `${baseUrl}/bszn/yllh/index.htm`, channel: "园林绿化" },
  { id: "dpcl", url: `${baseUrl}/bszn/dpcl/index.htm`, channel: "电瓶车辆" },
  { id: "ldjy", url: `${baseUrl}/ldjy/index.blk.htm`, channel: "劳动教育" },
  { id: "xzzq", url: `${baseUrl}/xzzq/index.htm`, channel: "下载专区" },
];
