import type { SourceDescriptor } from "@bnuz-feed/contracts";

import { implementedBnuzhFetchTargets } from "./bnuzh";

export const bnuzhSources: SourceDescriptor[] = [
  { id: "9f333a97019248b0bf8f48b232397257", name: "党委保卫工作办公室", entryUrls: ["https://dwbw.bnuzh.edu.cn"], parserKey: "bnuzh/dwbwgzbgs", enabled: true, capabilities: { browserFetch: true, snapshotFallback: true } },
  { id: "0eb7d5617b434e70baf90c78007fbe01", name: "北京师范大学珠海校区实验室安全与设备管理办公室", entryUrls: ["https://ssb.bnuzh.edu.cn"], parserKey: "bnuzh/bjsfdxzhxqsysaqysbglbgs", enabled: true, capabilities: { browserFetch: true, snapshotFallback: true } },
  { id: "1f38a8b49b964025b9b187440ba345d0", name: "北京师范大学儿童博物馆线上馆", entryUrls: ["http://childrensmuseum.bnuzh.edu.cn"], parserKey: "bnuzh/bjsfdxetbwg", enabled: true, capabilities: { browserFetch: true, snapshotFallback: true } },
  { id: "f1dfc3dc45e84156b470f7b860ea9956", name: "地理实验教学中心", entryUrls: ["https://sczx.bnuzh.edu.cn/dlsyjxzx"], parserKey: "bnuzh/dlsyjxzx", enabled: true, capabilities: { browserFetch: false, snapshotFallback: true } },
  { id: "87fb9d8daa5d4b4ab7c9f5efe8dfd5cc", name: "通知公告", entryUrls: ["https://notice.bnuzh.edu.cn"], parserKey: "bnuzh/tzgg", enabled: true, capabilities: { browserFetch: true, snapshotFallback: true } },
  { id: "d0cbeecb90a14a169dfe9cdb2c97c270", name: "北师大未来设计学院硕士研究生毕业展", entryUrls: ["https://sfd-degreeshow.bnuzh.edu.cn"], parserKey: "bnuzh/bsdwlsjxyssyjsbyz", enabled: true, capabilities: { browserFetch: true, snapshotFallback: true } },
  { id: "55cf70db9df5483eb0a88ff3cf3eab54", name: "图书馆", entryUrls: ["https://library.bnuzh.edu.cn"], parserKey: "bnuzh/tsg", enabled: true, capabilities: { browserFetch: true, snapshotFallback: true } },
  { id: "86753130ceb542929a38b9d9319e9372", name: "后勤办公室", entryUrls: ["https://hqb.bnuzh.edu.cn"], parserKey: "bnuzh/hqbwz", enabled: true, capabilities: { browserFetch: true, snapshotFallback: true } },
  { id: "d524eba4e8d744d58ce18fabec140359", name: "校史馆网站", entryUrls: ["https://xiaoshi.bnuzh.edu.cn"], parserKey: "bnuzh/xsgwz", enabled: true, capabilities: { browserFetch: true, snapshotFallback: true } },
  { id: "def14df8e70e46fbb1bc9e78159aa9fb", name: "砺行书院", entryUrls: ["https://lixing.bnuzh.edu.cn/"], parserKey: "bnuzh/lxsy", enabled: true, capabilities: { browserFetch: true, snapshotFallback: true } },
  { id: "c9f778e52e5f43808a1a89b836c6be4f", name: "微信门户", entryUrls: ["https://wx.bnuzh.edu.cn"], parserKey: "bnuzh/wxmh", enabled: true, capabilities: { browserFetch: true, snapshotFallback: true } },
  { id: "eb20cbad5a894fc9aee0de698ef38038", name: "北京中心", entryUrls: ["https://zhbjzx.bnuzh.edu.cn"], parserKey: "bnuzh/bjzx", enabled: true, capabilities: { browserFetch: true, snapshotFallback: true } },
  { id: "d0e8c9b742a9498ebeb52f76523f9771", name: "北京师范大学知行书院", entryUrls: ["https://zhixing.bnuzh.edu.cn"], parserKey: "bnuzh/bjsfdxzxxy", enabled: true, capabilities: { browserFetch: true, snapshotFallback: true } },
  { id: "09acfd3aeff34c479786499b7d8b0b7a", name: "物理实验教学中心", entryUrls: ["https://sczx.bnuzh.edu.cn/wlsyjxzx"], parserKey: "bnuzh/wlsyjxzx", enabled: true, capabilities: { browserFetch: false, snapshotFallback: true } },
  { id: "01e60809114c446dad43a679c9573fe7", name: "党委组织工作办公室", entryUrls: ["https://dwzgb.bnuzh.edu.cn"], parserKey: "bnuzh/dwzzgzbgs", enabled: true, capabilities: { browserFetch: true, snapshotFallback: true } },
  { id: "70981c669ee748c4ba5dcd4022a42f58", name: "资产管理办公室", entryUrls: ["https://oam.bnuzh.edu.cn"], parserKey: "bnuzh/zcglbgs", enabled: true, capabilities: { browserFetch: true, snapshotFallback: true } },
  { id: "71c3567220ec405ab75c90983f9822af", name: "校区发展基金会网站", entryUrls: ["https://edf.bnuzh.edu.cn"], parserKey: "bnuzh/xqfzjjhwz", enabled: true, capabilities: { browserFetch: true, snapshotFallback: true } },
  { id: "8f2630501d2b497b93b895da12d0903a", name: "校地党建结对共建专题网", entryUrls: ["https://djjd.bnuzh.edu.cn"], parserKey: "bnuzh/xddjjdgjztw", enabled: true, capabilities: { browserFetch: true, snapshotFallback: true } },
  { id: "947b53536cf848cb93793fed0af208dc", name: "文理学院地理系网站", entryUrls: ["https://geo.bnuzh.edu.cn"], parserKey: "bnuzh/wlxydlxwz", enabled: true, capabilities: { browserFetch: true, snapshotFallback: true } },
  { id: "a100866175714d5782818c210cec8060", name: "党委教师工作办公室", entryUrls: ["https://dwjgb.bnuzh.edu.cn/"], parserKey: "bnuzh/dwjsgzbgs", enabled: true, capabilities: { browserFetch: true, snapshotFallback: true } },
  { id: "a26211ac66e84356ae7726f5ceb8deb3", name: "教师教育实践网", entryUrls: ["https://jwb.bnuzh.edu.cn/jsjysjw"], parserKey: "bnuzh/jsjysjw", enabled: true, capabilities: { browserFetch: false, snapshotFallback: true } },
  { id: "31631a3717734412baa24e2d6706961f", name: "动植物图鉴录入网站", entryUrls: ["https://ihap.bnuzh.edu.cn"], parserKey: "bnuzh/dzwtjlrwz", enabled: true, capabilities: { browserFetch: true, snapshotFallback: true } },
  { id: "c00aa4c1b0f64acb9a70432cec15c71c", name: "档案馆网站", entryUrls: ["https://dangan.bnuzh.edu.cn"], parserKey: "bnuzh/dagwz", enabled: true, capabilities: { browserFetch: true, snapshotFallback: true } },
  { id: "15f56dbc97ec445e95f40ceed144be2a", name: "弘文书院网站", entryUrls: ["https://hongwen.bnuzh.edu.cn"], parserKey: "bnuzh/hwsywz", enabled: true, capabilities: { browserFetch: true, snapshotFallback: true } },
  { id: "c252f4c7e0324913b6defd418af12cbd", name: "珠海校区实验教学平台", entryUrls: ["https://sczx.bnuzh.edu.cn"], parserKey: "bnuzh/jwbsyysjcxjyzxwz", enabled: true, capabilities: { browserFetch: true, snapshotFallback: true } },
  { id: "16e7de8fdc4a47cfbbcfd69bad3087b8", name: "理工实验平台网站", entryUrls: ["https://iscst.bnuzh.edu.cn/"], parserKey: "bnuzh/lgsyptwz", enabled: true, capabilities: { browserFetch: true, snapshotFallback: true } },
  { id: "7b06ff51eebb4ac9973b2bd4821d25cb", name: "会同书院网站", entryUrls: ["https://ht.bnuzh.edu.cn/"], parserKey: "bnuzh/htsywz", enabled: true, capabilities: { browserFetch: true, snapshotFallback: true } },
  { id: "b1b34f8f364948dd870d0b08f0c7b0a2", name: "地表过程与资源生态国家重点实验室珠海基地", entryUrls: ["https://espre.bnuzh.edu.cn/"], parserKey: "bnuzh/dbgcyzystgjzdsyszhjd", enabled: true, capabilities: { browserFetch: true, snapshotFallback: true } },
  { id: "9193b9297fc840aaaac832f8a8a2c6c3", name: "科研办公室网站", entryUrls: ["https://kyb.bnuzh.edu.cn/"], parserKey: "bnuzh/kybgswz", enabled: true, capabilities: { browserFetch: true, snapshotFallback: true } },
  { id: "5624a6f0b836401d8e9b6459da95b24e", name: "校区团委网站", entryUrls: ["https://youth.bnuzh.edu.cn/"], parserKey: "bnuzh/xqtwwz", enabled: true, capabilities: { browserFetch: true, snapshotFallback: true } },
  { id: "cc95de40844b45e8b14870dbf3d358cd", name: "乐育书院网站", entryUrls: ["https://leyu.bnuzh.edu.cn/"], parserKey: "bnuzh/lysywz", enabled: true, capabilities: { browserFetch: true, snapshotFallback: true } },
  { id: "9e442f682ee94c92a56260b87daadd3d", name: "学生职业发展与就业指导中心网站", entryUrls: ["https://career.bnuzh.edu.cn/"], parserKey: "bnuzh/xszyfzyjyzdzxwz", enabled: true, capabilities: { browserFetch: true, snapshotFallback: true } },
  { id: "9e48dbe870a04ac5aefbefff5aeb68e1", name: "网络信息中心", entryUrls: ["http://nic.bnuzh.edu.cn/"], parserKey: "bnuzh/wlxxzx", enabled: true, capabilities: { browserFetch: true, snapshotFallback: true } },
  { id: "20a9c6f38cf246239bc912fec4be08b6", name: "中国教育会计学会会议", entryUrls: ["https://easc.bnuzh.edu.cn/"], parserKey: "bnuzh/zgjykjxhhy", enabled: true, capabilities: { browserFetch: true, snapshotFallback: true } },
  { id: "e0c5a11a3fec4476b4c24202ff6820ab", name: "党委学生工作办公室", entryUrls: ["https://dwxgb.bnuzh.edu.cn/"], parserKey: "bnuzh/dwxsgzbgs", enabled: true, capabilities: { browserFetch: true, snapshotFallback: true } },
  { id: "f8b68f1c9a724254a4feb6285bb8cef3", name: "国际交流与合作办公室", entryUrls: ["https://io.bnuzh.edu.cn/"], parserKey: "bnuzh/gjjlyhzbgs", enabled: true, capabilities: { browserFetch: true, snapshotFallback: true } },
  { id: "944f1df5c6ed4ef8a94db5d8f6f72aa9", name: "乡长学院", entryUrls: ["https://tcc.bnuzh.edu.cn"], parserKey: "bnuzh/xcxy", enabled: true, capabilities: { browserFetch: true, snapshotFallback: true } },
  { id: "c5ba1fc8bc32462d9299d79a8d0d0ee1", name: "迎新网", entryUrls: ["https://welcome.bnuzh.edu.cn/"], parserKey: "bnuzh/yxw", enabled: true, capabilities: { browserFetch: true, snapshotFallback: true } },
  { id: "75e9fe7e62fb4d13a04c54339b880077", name: "教务部", entryUrls: ["https://jwb.bnuzh.edu.cn/"], parserKey: "bnuzh/jwb", enabled: true, capabilities: { browserFetch: true, snapshotFallback: true } },
  { id: "57c21fb282a442bc936ce7188d98ed82", name: "凤凰书院英文网", entryUrls: ["https://phs.bnuzh.edu.cn/English/"], parserKey: "bnuzh/fhsyyww", enabled: true, capabilities: { browserFetch: true, snapshotFallback: true } },
  { id: "7de05bfb07b44620b482d189a2d7cc44", name: "凤凰书院", entryUrls: ["https://phs.bnuzh.edu.cn/"], parserKey: "bnuzh/fhsy", enabled: true, capabilities: { browserFetch: true, snapshotFallback: true } },
  { id: "b3e7c5f24a434f788257a698f79c37ff", name: "新闻网", entryUrls: ["https://zhnews.bnuzh.edu.cn"], parserKey: "bnuzh/zhxqxww", enabled: true, capabilities: { browserFetch: true, snapshotFallback: true } },
  { id: "bfa3769881d248c5a8c379f84ba47149", name: "人才办", entryUrls: ["http://hr.bnuzh.edu.cn/"], parserKey: "bnuzh/rcb", enabled: true, capabilities: { browserFetch: true, snapshotFallback: true } },
  { id: "1bd3af39c2cf4c2bbe07a1c2bc12e76b", name: "珠海校区英文网", entryUrls: ["http://english.bnuzh.edu.cn/"], parserKey: "bnuzh/ebnuz", enabled: true, capabilities: { browserFetch: true, snapshotFallback: true } },
  { id: "f018e769b2bd4733a968e902befe7e17", name: "北京师范大学珠海校区主站", entryUrls: ["http://www.bnuzh.edu.cn"], parserKey: "bnuzh/bnuz", enabled: true, capabilities: { browserFetch: true, snapshotFallback: true } }
].map((source) => {
  const fetchTargets = implementedBnuzhFetchTargets[source.parserKey];

  if (!fetchTargets) {
    return source;
  }

  return {
    ...source,
    fetchTargets,
    capabilities: {
      ...source.capabilities,
      browserFetch: true,
    },
  };
});

export const publicBnuzhSources = bnuzhSources.filter(
  (source) => (source.fetchTargets?.length ?? 0) > 0,
);
