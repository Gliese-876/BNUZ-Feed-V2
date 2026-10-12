import { buildChannelKey, type SourceCatalogNode } from "./sourceCatalog";

export const studentCollectionDescription =
  "从在校学生的日常需要出发，精选教务考试、奖助学工、就业机会、校园活动、国际交流与生活服务。";

// Use official source IDs and exact channel labels so new administrative channels
// do not silently enter the collection. Keep broad college news and faculty
// research/administration channels available through the full catalog.
export const studentCollectionRules: Readonly<Record<string, readonly string[]>> = {
  // 教务部：保留办理学习事务和参加竞赛、实践、交流的入口。
  "75e9fe7e62fb4d13a04c54339b880077": [
    "通知公告", "教学运行", "考务管理", "学科竞赛", "创新创业", "实习实践",
    "教师资格证", "毕业论文（设计）", "国家公派项目（学生类）", "海外实习",
    "国际化课程", "出境交流", "选课", "校历",
  ],
  // 学工办：覆盖本科生、研究生奖助通知及宿舍、心理活动服务。
  "e0c5a11a3fec4476b4c24202ff6820ab": [
    "工作通知", "奖励资助", "特色活动", "宿舍事务办理",
  ],
  // 就业中心：校园招聘活动与求职服务；大量单独岗位帖留给全部信息。
  "9e442f682ee94c92a56260b87daadd3d": [
    "通知公告", "就业活动", "宣讲会", "双选会", "就业指导", "就业政策", "公益课程",
  ],
  // 团委：面向学生的报名通知与校园活动。
  "5624a6f0b836401d8e9b6459da95b24e": ["通知公告", "精彩活动"],
  // 图书馆：开放安排、资源使用、新书与培训讲座。
  "55cf70db9df5483eb0a88ff3cf3eab54": ["最新消息", "资源动态", "新书速睇", "培训讲座"],
  // 校区主站：全校通知与公开学术活动，保留跨书院的公共信息。
  "f018e769b2bd4733a968e902befe7e17": ["通知公示", "学术活动"],
  // 后勤：开放安排、医保、餐饮、医疗与校园交通服务。
  "86753130ceb542929a38b9d9319e9372": [
    "通知公告", "学生医保", "公共卫生", "餐饮服务", "电瓶车辆",
  ],
  // 网络信息中心：校园网、校园卡及学生信息服务。
  "9e48dbe870a04ac5aefbefff5aeb68e1": ["通知公告", "学生服务指南"],
  // 保卫办：安全提醒、校园交通、反诈与毕业生户籍事务。
  "9f333a97019248b0bf8f48b232397257": [
    "通知公告", "安全教育", "安全生产/校园治安", "安全生产/校园交通",
    "安全生产/消防安全", "平安校园/警示教育", "户政业务",
  ],
  // 国际办：交流机会、留学生奖学金与面向学生的国际视野活动。
  "f8b68f1c9a724254a4feb6285bb8cef3": [
    "信息公告", "YES项目", "京师学生全球视野节",
  ],
  // 书院：选择奖助、活动、心理支持与职业服务，不整站纳入新闻。
  "15f56dbc97ec445e95f40ceed144be2a": [
    "活动预告", "学生奖助", "心理健康", "就业服务", "合作交流",
  ],
  "def14df8e70e46fbb1bc9e78159aa9fb": [
    "活动预告", "学生奖助", "心康服务", "就业服务",
  ],
  "cc95de40844b45e8b14870dbf3d358cd": [
    "通知公告", "活动预告", "就业速递", "名师名校长讲坛", "乐育沙龙",
  ],
  "7de05bfb07b44620b482d189a2d7cc44": [
    "通知和活动", "凤凰语言村", "学生活动", "凤凰讲堂",
  ],
  "87aa44758c0c48bb956bdae3bc09c3ad": [
    "学生奖助", "知行讲坛", "知行沙龙",
  ],
  // 实验教学平台：学生竞赛招募及相关通知。
  "c252f4c7e0324913b6defd418af12cbd": ["通知公告", "竞赛项目"],
};

export function getStudentChannelKeys(catalog: SourceCatalogNode[]): string[] {
  const keys = new Set<string>();

  for (const source of catalog) {
    const selectedChannels = studentCollectionRules[source.id];
    if (!selectedChannels) continue;

    for (const channel of source.channels) {
      if (selectedChannels.includes(channel.label)) {
        keys.add(buildChannelKey(source.id, channel.label));
      }
    }
  }

  return [...keys];
}
