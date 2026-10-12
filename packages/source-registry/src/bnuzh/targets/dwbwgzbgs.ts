import type { FetchTarget } from "@bnuz-feed/contracts";

const channels = [
  ["tzgg", "通知公告"],
  ["gzdt", "工作动态"],
  ["djyl", "党建引领"],
  ["aqsc/xfaq", "安全生产/消防安全"],
  ["aqsc/xyza", "安全生产/校园治安"],
  ["aqsc/xyjt", "安全生产/校园交通"],
  ["paxy/jsjy", "平安校园/警示教育"],
  ["paxy/ktnw", "平安校园/课堂内外"],
  ["paxy/fzyd", "平安校园/法制园地"],
  ["aqjy", "安全教育"],
  ["zcfg", "政策法规"],
  ["hzyw/hzyw", "户政业务"],
  ["bszn", "办事指南"],
  ["jcsp", "精彩视频"],
] as const;

export const dwbwgzbgsFetchTargets: FetchTarget[] = channels.map(([path, channel]) => ({
  id: path,
  url: `https://dwbw.bnuzh.edu.cn/${path}/index.htm`,
  channel,
}));
