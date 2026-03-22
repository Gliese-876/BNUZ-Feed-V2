# BNUZH 公开 siteList 摘要

来源: [北京师范大学珠海校区全文检索](https://www.bnuzh.edu.cn/cms/web/search/index.jsp?) 页面源码中的 `var siteList = [...]`

提取时间: `2026-03-15`

## 概览

- `siteList` 总条目数: `46`
- 其中 `siteID=0` 的“所有站点”为搜索页内置聚合选项，不对应独立 `pubUrl`
- 公开 `pubUrl` 条目数: `45`
- `smartGet=1` 条目数: `42`
- `smartGet=0` 条目数: `3`
- 页面默认首页文件基本统一为 `index.htm`
- 从公开子站首页继续抽取新闻/通知/公告栏目页，通常比单纯依赖全站搜索更稳

## 本轮进度

- `2026-03-22` Playwright 复核确认当前不可访问并按要求跳过: `党委保卫工作办公室`、`北京师范大学珠海校区实验室安全与设备管理办公室`
- `2026-03-21` 已完成并接入抓取的 35 个站点:
  - `北京师范大学儿童博物馆线上馆`
  - `地理实验教学中心`
  - `通知公告`
  - `北师大未来设计学院硕士研究生毕业展`
  - `图书馆`
  - `后勤办公室`
  - `校史馆网站`
  - `砺行书院`
  - `微信门户`
  - `北京中心`
  - `北京师范大学知行书院`
  - `物理实验教学中心`
  - `党委组织工作办公室`
  - `资产管理办公室`
  - `校区发展基金会网站`
  - `校地党建结对共建专题网`
  - `文理学院地理系网站`
  - `党委教师工作办公室`
  - `教师教育实践网`
  - `动植物图鉴录入网站`
  - `档案馆网站`
  - `弘文书院网站`
  - `珠海校区实验教学平台`
  - `理工实验平台网站`
  - `会同书院网站`
  - `地表过程与资源生态国家重点实验室珠海基地`
  - `科研办公室网站`
  - `校区团委网站`
  - `乐育书院网站`
  - `学生职业发展与就业指导中心网站`
  - `网络信息中心`
  - `中国教育会计学会会议`
  - `党委学生工作办公室`
  - `国际交流与合作办公室`
  - `乡长学院`
- `2026-03-21` 对更早一轮新增的 5 个站点做 `Playwright` 二次复核后，补齐了以下漏抓栏目：
  - `校地党建结对共建专题网`：`图文动态`
  - `文理学院地理系网站`：`学生风采`
  - `党委教师工作办公室`：`精选文章`、`“优师计划”回信精神`、`学习党的二十大精神`、`德馨讲坛`
  - `动植物图鉴录入网站`：`乐育楼`、`弘文楼`、`图书馆`、`粤华苑`
  - `教师教育实践网`：`教师教育课程资源` 10 个学科页当前均为空，维持不接入
- `2026-03-21` 上一轮完成并接入后续 5 个站点：
  - `档案馆网站`：11 个 `noticeUl` 列表页，覆盖工作动态、法规制度、办事指南和相关下载
  - `弘文书院网站`：19 个 `article-list` 栏目，覆盖首页新闻、书院团队、书院服务和学生事务
  - `珠海校区实验教学平台`：11 个目标页，覆盖通知公告、综合新闻、竞赛项目、安全制度、支部工作和首页成果轮播
  - `理工实验平台网站`：30 个目标页，覆盖分页文章列表、附件列表和 5 个设备中心卡片页
  - `会同书院网站`：9 个稳定频道，共 70 个分页 `fetchTargets`，通过日期 token 过滤正文锚点
- `2026-03-21` 本轮完成并接入后续 5 个站点：
  - `地表过程与资源生态国家重点实验室珠海基地`：12 个 `article-list` 目标页，覆盖新闻中心、通知、学术活动、研究进展、科研经验交流、国际合作、会议报告和活动风采
  - `科研办公室网站`：15 个稳定频道，共 62 个分页/列表 `fetchTargets`，覆盖科研动态、申报通知、科研活动、规章制度、校地合作和资料下载
  - `校区团委网站`：6 个稳定频道，共 23 个分页 `fetchTargets`，统一复用 `article-list` 骨架抓新闻、通知、理论学习和团学活动
  - `乐育书院网站`：17 个稳定列表页，补入支部风采、团学风采、生涯引航与服务指南下的稳定日期型栏目，覆盖站内详情、公众号外链和校内兄弟站白名单外链
  - `学生职业发展与就业指导中心网站`：14 个公开列表路由，已修正 `就业活动`、`就业政策` 的真实列表地址，并补入 `公益课程`、`公职就业`、`基础教育`
- `2026-03-21` 本轮继续完成并接入后续 5 个站点：
  - `网络信息中心`：5 组公开列表，共 8 个分页/列表 `fetchTargets`，覆盖通知公告、规章制度、漏洞公告、教师服务指南和学生服务指南
  - `中国教育会计学会会议`：同一首页拆分 `新闻通知` 日期列表与 `会议安排` 卡片 2 个消息源；首页 `swiper` 只作为预览，不再单独入库
  - `党委学生工作办公室`：26 个稳定频道，共 42 个分页 `fetchTargets`，统一复用 `article-list` 骨架覆盖学工动态、党建思政、奖助工作、心理健康、社区与研究生事务
  - `国际交流与合作办公室`：13 个稳定频道，共 21 个 `fetchTargets`，混合同骨架日期列表、无日期 Newsletter issue 列表与 `国际会议/最新通知` 附件通知页
  - `乡长学院`：`新闻动态` 4 页分页加 `校友动态` 1 页公开内容，共 5 个 `fetchTargets`
- `2026-03-21` 使用 `Playwright MCP` 复查上述 5 个站点后，补齐并确认了以下结论：
  - `中国教育会计学会会议`：`新闻通知` 应以首页 `ul.news-list` 日期列表为准，`swiper` 轮播仅作预览
  - `党委学生工作办公室`：补入 `学生党员教育培训`、`学生党支部建设`、`专题教育活动`、`社会实践`、`班级建设`、`工作通知`、`宿舍事务办理`、`特色活动`
  - `国际交流与合作办公室`：补入 `国际会议/最新通知`
  - `网络信息中心`：`服务流程` 等页仍为静态办事指南，不新增抓取
  - `乡长学院`：`参观考察` 及其余栏目仍为静态图文页、空壳页或说明页，不新增抓取
- `2026-03-22` 本轮继续完成并接入后续 5 个站点：
  - `迎新网`：6 个稳定列表页，覆盖 `迎新快讯` 2 页、`迎新指引`、`学在北师大`、`住在北师大`、`乐在北师大`；Playwright 复查未发现漏抓
  - `教务部`：129 个 `fetchTargets`，混合 `li.line` 归档列表与按块标题过滤的 `.article-list` 多区块页；除 `通知公告`、`综合新闻`、`教学改革`、`教师教育`、`实践教学`、`质量保障`、`教务学务`、`教学资源`、`国际交流`、`学位管理`、`教师发展` 外，复查补入 `办事指南` 9 组与 `常用下载` 6 组真实列表
  - `凤凰书院英文网`：13 个英文频道，兼容普通 `li` 列表与 `dd` 图文卡片；复查补入 `Notices and Activities`、`Dynamics of the Center`、`Guangdong-Hong Kong-Macao Cultural and Educational Exchange Activities`、`Project and Training`
  - `凤凰书院`：14 个目标页，统一复用 `.gp-subRight li > a[href]` 骨架；复查补入 `中心动态`、`菁师计划`、`粤港澳文化与教育交流活动`
  - `新闻网`：138 个 `fetchTargets`，覆盖 `头条关注` 38 页、`通知公告` 17 页、`综合报道` 81 页、`媒体师大`、`光影师大`；Playwright 复查未发现漏抓

## 聚合条目

| 名称 | siteID | pubUrl | 备注 |
| --- | --- | --- | --- |
| 所有站点 | `0` |  | 搜索页默认全站聚合选项 |

## 公开子站列表

| 名称 | pubUrl | siteID | path | rootChannelID | smartGet | 首页文件 |
| --- | --- | --- | --- | --- | --- | --- |
| [!] 党委保卫工作办公室 | `https://dwbw.bnuzh.edu.cn` | `9f333a97019248b0bf8f48b232397257` | `dwbwgzbgs` | `bfd0be20217047ba88983dd7699ddaef` | `1` | `index.htm` |
| [!] 北京师范大学珠海校区实验室安全与设备管理办公室 | `https://ssb.bnuzh.edu.cn` | `0eb7d5617b434e70baf90c78007fbe01` | `bjsfdxzhxqsysaqysbglbgs` | `c8c2fa5b1e884ed3931087e132dacf2c` | `1` | `index.htm` |
| [x] 北京师范大学儿童博物馆线上馆 | `http://childrensmuseum.bnuzh.edu.cn` | `1f38a8b49b964025b9b187440ba345d0` | `bjsfdxetbwg` | `0b438b8871954fecbcae4e24450e98ea` | `1` | `index.htm` |
| [x] 地理实验教学中心 | `https://sczx.bnuzh.edu.cn/dlsyjxzx` | `f1dfc3dc45e84156b470f7b860ea9956` | `dlsyjxzx` | `46b13438cc6f4ac48bd2e3d22766343a` | `0` | `index.htm` |
| [x] 通知公告 | `https://notice.bnuzh.edu.cn` | `87fb9d8daa5d4b4ab7c9f5efe8dfd5cc` | `tzgg` | `079dc4bb1b2d48bd8d0a5c72006d9b3e` | `1` | `index.htm` |
| [x] 北师大未来设计学院硕士研究生毕业展 | `https://sfd-degreeshow.bnuzh.edu.cn` | `d0cbeecb90a14a169dfe9cdb2c97c270` | `bsdwlsjxyssyjsbyz` | `649ce0284aa14e1d894caa413cc9839f` | `1` | `index.htm` |
| [x] 图书馆 | `https://library.bnuzh.edu.cn` | `55cf70db9df5483eb0a88ff3cf3eab54` | `tsg` | `09fdd3632e71440eb4fdb8dba842e7f2` | `1` | `index.htm` |
| [x] 后勤办公室 | `https://hqb.bnuzh.edu.cn` | `86753130ceb542929a38b9d9319e9372` | `hqbwz` | `0a58804b29a7430b8aecad6d13cd73ba` | `1` | `index.htm` |
| [x] 校史馆网站 | `https://xiaoshi.bnuzh.edu.cn` | `d524eba4e8d744d58ce18fabec140359` | `xsgwz` | `1ed503d21e124500ab43620f091dffc2` | `1` | `index.htm` |
| [x] 砺行书院 | `https://lixing.bnuzh.edu.cn/` | `def14df8e70e46fbb1bc9e78159aa9fb` | `lxsy` | `f4b8986d39994785af53e0147533c2d0` | `1` | `index.htm` |
| [x] 微信门户 | `https://wx.bnuzh.edu.cn` | `c9f778e52e5f43808a1a89b836c6be4f` | `wxmh` | `aa3a32542c644051b590dd680a6bcc99` | `1` | `index.htm` |
| [x] 北京中心 | `https://zhbjzx.bnuzh.edu.cn` | `eb20cbad5a894fc9aee0de698ef38038` | `bjzx` | `3cafe11f80ac47128db52a4d9281bdf0` | `1` | `index.htm` |
| [x] 北京师范大学知行书院 | `https://zhixing.bnuzh.edu.cn` | `d0e8c9b742a9498ebeb52f76523f9771` | `bjsfdxzxxy` | `24d3829a93204f43bc4f815e2c01beb9` | `1` | `index.htm` |
| [x] 物理实验教学中心 | `https://sczx.bnuzh.edu.cn/wlsyjxzx` | `09acfd3aeff34c479786499b7d8b0b7a` | `wlsyjxzx` | `4b34b27d5a424db79acb4ec6323f32e2` | `0` | `index.htm` |
| [x] 党委组织工作办公室 | `https://dwzgb.bnuzh.edu.cn` | `01e60809114c446dad43a679c9573fe7` | `dwzzgzbgs` | `5fccf16ff7364d458233fff7bce21da2` | `1` | `index.htm` |
| [x] 资产管理办公室 | `https://oam.bnuzh.edu.cn` | `70981c669ee748c4ba5dcd4022a42f58` | `zcglbgs` | `adf40b1076bd44e885e4aacd613b0d85` | `1` | `index.htm` |
| [x] 校区发展基金会网站 | `https://edf.bnuzh.edu.cn` | `71c3567220ec405ab75c90983f9822af` | `xqfzjjhwz` | `98851fc03c11422aadf9f707d3dea26c` | `1` | `index.htm` |
| [x] 校地党建结对共建专题网 | `https://djjd.bnuzh.edu.cn` | `8f2630501d2b497b93b895da12d0903a` | `xddjjdgjztw` | `f26d1211fb824e068ee09da469467ab1` | `1` | `index.htm` |
| [x] 文理学院地理系网站 | `https://geo.bnuzh.edu.cn` | `947b53536cf848cb93793fed0af208dc` | `wlxydlxwz` | `8fb140bbe2d24e18a28623f2cb80ee03` | `1` | `index.htm` |
| [x] 党委教师工作办公室 | `https://dwjgb.bnuzh.edu.cn/` | `a100866175714d5782818c210cec8060` | `dwjsgzbgs` | `d5b671b036f54c4c9708caa748970c6f` | `1` | `index.htm` |
| [x] 教师教育实践网 | `https://jwb.bnuzh.edu.cn/jsjysjw` | `a26211ac66e84356ae7726f5ceb8deb3` | `jsjysjw` | `3e49145323e14add97cb789e077d60b4` | `0` | `index.htm` |
| [x] 动植物图鉴录入网站 | `https://ihap.bnuzh.edu.cn` | `31631a3717734412baa24e2d6706961f` | `dzwtjlrwz` | `c04a1967e2784881a5bdbcedb3c62499` | `1` | `index.htm` |
| [x] 档案馆网站 | `https://dangan.bnuzh.edu.cn` | `c00aa4c1b0f64acb9a70432cec15c71c` | `dagwz` | `fa45204928074f8f99974056a2f653ae` | `1` | `index.htm` |
| [x] 弘文书院网站 | `https://hongwen.bnuzh.edu.cn` | `15f56dbc97ec445e95f40ceed144be2a` | `hwsywz` | `ef5374e27b764a62b98eb38e55796b67` | `1` | `index.htm` |
| [x] 珠海校区实验教学平台 | `https://sczx.bnuzh.edu.cn` | `c252f4c7e0324913b6defd418af12cbd` | `jwbsyysjcxjyzxwz` | `b777df87dd1b4915a8cec94e16ef603a` | `1` | `index.htm` |
| [x] 理工实验平台网站 | `https://iscst.bnuzh.edu.cn/` | `16e7de8fdc4a47cfbbcfd69bad3087b8` | `lgsyptwz` | `ff642aa0b93e43fc96b2af8c69667ac6` | `1` | `index.htm` |
| [x] 会同书院网站 | `https://ht.bnuzh.edu.cn/` | `7b06ff51eebb4ac9973b2bd4821d25cb` | `htsywz` | `0e68653a3bf64347a2d8c71c212312ba` | `1` | `index.htm` |
| [x] 地表过程与资源生态国家重点实验室珠海基地 | `https://espre.bnuzh.edu.cn/` | `b1b34f8f364948dd870d0b08f0c7b0a2` | `dbgcyzystgjzdsyszhjd` | `d8c9a72d82c448b286d6a804757b1f9a` | `1` | `index.htm` |
| [x] 科研办公室网站 | `https://kyb.bnuzh.edu.cn/` | `9193b9297fc840aaaac832f8a8a2c6c3` | `kybgswz` | `014334af31ef444facf5cf849c610253` | `1` | `index.htm` |
| [x] 校区团委网站 | `https://youth.bnuzh.edu.cn/` | `5624a6f0b836401d8e9b6459da95b24e` | `xqtwwz` | `02276846354f4666b92719f267e2e972` | `1` | `index.htm` |
| [x] 乐育书院网站 | `https://leyu.bnuzh.edu.cn/` | `cc95de40844b45e8b14870dbf3d358cd` | `lysywz` | `3c5302e2eb4f4553b13a53032a5a61e1` | `1` | `index.htm` |
| [x] 学生职业发展与就业指导中心网站 | `https://career.bnuzh.edu.cn/` | `9e442f682ee94c92a56260b87daadd3d` | `xszyfzyjyzdzxwz` | `666d51e8919740aba018efc644c520ec` | `1` | `index.htm` |
| [x] 网络信息中心 | `http://nic.bnuzh.edu.cn/` | `9e48dbe870a04ac5aefbefff5aeb68e1` | `wlxxzx` | `50e2f8ae73db4bdb95357ca2e0a9ee4e` | `1` | `index.htm` |
| [x] 中国教育会计学会会议 | `https://easc.bnuzh.edu.cn/` | `20a9c6f38cf246239bc912fec4be08b6` | `zgjykjxhhy` | `707d7776a31c42a5aa2f2bbf0dc0aac2` | `1` | `index.htm` |
| [x] 党委学生工作办公室 | `https://dwxgb.bnuzh.edu.cn/` | `e0c5a11a3fec4476b4c24202ff6820ab` | `dwxsgzbgs` | `6461785752a041dfbe4bd214ba7385b2` | `1` | `index.htm` |
| [x] 国际交流与合作办公室 | `https://io.bnuzh.edu.cn/` | `f8b68f1c9a724254a4feb6285bb8cef3` | `gjjlyhzbgs` | `75e0d5afe9f541c8820ecd539ff4710a` | `1` | `index.htm` |
| [x] 乡长学院 | `https://tcc.bnuzh.edu.cn` | `944f1df5c6ed4ef8a94db5d8f6f72aa9` | `xcxy` | `4087c72302f2408ca27caf2ffb1c5c55` | `1` | `index.htm` |
| [x] 迎新网 | `https://welcome.bnuzh.edu.cn/` | `c5ba1fc8bc32462d9299d79a8d0d0ee1` | `yxw` | `57e28edc78774bac8fd58bde9939fc0f` | `1` | `index.htm` |
| [x] 教务部 | `https://jwb.bnuzh.edu.cn/` | `75e9fe7e62fb4d13a04c54339b880077` | `jwb` | `d20de603f5114c74a03a42686cfee0d7` | `1` | `index.htm` |
| [x] 凤凰书院英文网 | `https://phs.bnuzh.edu.cn/English/` | `57c21fb282a442bc936ce7188d98ed82` | `fhsyyww` | `d9cb79e3ed8949008224a0c6b5e4b15d` | `1` | `index.htm` |
| [x] 凤凰书院 | `https://phs.bnuzh.edu.cn/` | `7de05bfb07b44620b482d189a2d7cc44` | `fhsy` | `a5d47dc651074eee9e1f189adc26347f` | `1` | `index.htm` |
| [x] 新闻网 | `https://zhnews.bnuzh.edu.cn` | `b3e7c5f24a434f788257a698f79c37ff` | `zhxqxww` | `d5eeb7bf79554f8b944d39849b789577` | `1` | `index.htm` |
| [x] 人才办 | `http://hr.bnuzh.edu.cn/` | `bfa3769881d248c5a8c379f84ba47149` | `rcb` | `b3ceecfc2376422cbd2284615fd5ebc1` | `1` | `index.htm` |
| [x] 珠海校区英文网 | `http://english.bnuzh.edu.cn/` | `1bd3af39c2cf4c2bbe07a1c2bc12e76b` | `ebnuz` | `386366f4fb4144269b6e2a4a002bd055` | `1` | `index.htm` |
| [x] 北京师范大学珠海校区主站 | `http://www.bnuzh.edu.cn` | `f018e769b2bd4733a968e902befe7e17` | `bnuz` | `3ac1603c91334fb1b5666f5a16d6de95` | `1` | `index.htm` |

## 直接可用的抓取提示

- 这份 `siteList` 是搜索页公开下发的数据，不需要模拟登录。
- `pubUrl` 可以直接作为子站抓取种子。
- `siteID` 可以直接回填到搜索页请求里做单站检索。
- `rootChannelID` 适合后续分析各子站栏目结构，但它本身不是现成的公开列表页 URL。
- `smartGet=0` 的站点目前有 `3` 个:
  - `https://sczx.bnuzh.edu.cn/dlsyjxzx`
  - `https://sczx.bnuzh.edu.cn/wlsyjxzx`
  - `https://jwb.bnuzh.edu.cn/jsjysjw`
