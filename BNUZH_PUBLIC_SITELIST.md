# BNUZH 公开站点清单

复核日期：2026-10-12。来源：[北京师范大学珠海校区全文检索](https://www.bnuzh.edu.cn/cms/web/search/index.jsp) 页面源码中的 `var siteList`，通过真实 HTTP 请求提取并与运行时注册表核对。

- 官方搜索页共 **50 个选项**：**49 个站点**及 `id=0` 的“所有站点”聚合选项。
- 49 个站点均有 `pubUrl`；其中 `smartGet=1` 为 46 个、`smartGet=0` 为 3 个。
- 当前抓取接入 **47 个站点、952 个目标**。另外两个站点保留官方搜索身份并暂不安排抓取。
- 完整快照于 **2026-10-12 11:20（北京时间）**验证通过：**47/47 个源为 live、11,415 条聚合记录**，无 partial、degraded 或错误。全部目标在第一轮 Node 请求完成；官方清单对比为零漂移。
- 官方元数据集中保存在 `packages/source-registry/src/bnuzhSites.ts`，注册表从同一清单派生；`/catalog` 入口只加载元数据。

## 本轮变更

- 新增官方条目：国际交流与合作办公室英文网、新知行书院、用户指引专题网。珠海管委会原已在代码中，本轮补齐文档。
- 原知行书院的官方发布地址改为 `https://zhixing-old.bnuzh.edu.cn`；新站使用新的 CMS 身份，分别维护，避免把新站内容归到旧站。
- 保卫办、实设办已恢复公开访问并接入，分别验证 14、11 个日期列表。
- 修复乐育书院英文月份日期、人才办列表 class，以及英文站新闻与学生生活目录迁移。
- 删除资产管理办公室与迎新网的已确认 404 目标、两个失效归档分页；科研项目管理父栏目改抓七个公开子栏目，禁止公开访问的 `.blk.htm` 入口优先替换为官方导航中的 `.htm`。
- 真实对比未发现从官方清单中移除的站点；parser 和 targets 均无清单以外的孤立注册。

## 暂不抓取的官方条目

| 站点 | 复核证据 | 处理 |
| --- | --- | --- |
| 北京师范大学知行书院（旧站） | 新 `pubUrl` 的 DNS 解析失败；原域名已发布新知行站点 | 保留官方身份与旧模板解析器，暂停目标调度；这是外部访问故障，不能据此认定站点已从官方清单删除 |
| 国际交流与合作办公室英文网 | 官方 `pubUrl` 与中文站相同，当前返回中文站；未找到可确认的英文公开入口，`/English/` 返回 404 | 保留官方身份，暂停抓取，避免重复发布中文内容 |

## 当前官方站点

以下 URL 保留官方清单中的原始协议与路径。部分抓取目标使用已验证的 HTTPS 列表页，不改写官方元数据。

| 官方名称 | pubUrl | CMS 路径 | 抓取状态 |
| --- | --- | --- | --- |
| 国际交流与合作办公室英文网 | [打开](https://io.bnuzh.edu.cn) | `gjjlyhzbgsyww` | 暂不抓取 |
| 新知行书院 | [打开](https://zhixing.bnuzh.edu.cn) | `xzxsy` | 已接入 |
| 珠海管委会 | [打开](https://zhb.bnu.edu.cn) | `zhb` | 已接入 |
| 用户指引专题网 | [打开](https://fwzn.bnuzh.edu.cn) | `yhzyztw` | 已接入 |
| 党委保卫工作办公室 | [打开](https://dwbw.bnuzh.edu.cn) | `dwbwgzbgs` | 已接入 |
| 北京师范大学珠海校区实验室安全与设备管理办公室 | [打开](https://ssb.bnuzh.edu.cn) | `bjsfdxzhxqsysaqysbglbgs` | 已接入 |
| 北京师范大学儿童博物馆线上馆 | [打开](http://childrensmuseum.bnuzh.edu.cn) | `bjsfdxetbwg` | 已接入 |
| 地理实验教学中心 | [打开](https://sczx.bnuzh.edu.cn/dlsyjxzx) | `dlsyjxzx` | 已接入 |
| 通知公告 | [打开](https://notice.bnuzh.edu.cn) | `tzgg` | 已接入 |
| 北师大未来设计学院硕士研究生毕业展 | [打开](https://sfd-degreeshow.bnuzh.edu.cn) | `bsdwlsjxyssyjsbyz` | 已接入 |
| 图书馆 | [打开](https://library.bnuzh.edu.cn) | `tsg` | 已接入 |
| 后勤办公室 | [打开](https://hqb.bnuzh.edu.cn) | `hqbwz` | 已接入 |
| 校史馆网站 | [打开](https://xiaoshi.bnuzh.edu.cn) | `xsgwz` | 已接入 |
| 砺行书院 | [打开](https://lixing.bnuzh.edu.cn/) | `lxsy` | 已接入 |
| 微信门户 | [打开](https://wx.bnuzh.edu.cn) | `wxmh` | 已接入 |
| 北京中心 | [打开](https://zhbjzx.bnuzh.edu.cn) | `bjzx` | 已接入 |
| 北京师范大学知行书院 | [打开](https://zhixing-old.bnuzh.edu.cn) | `bjsfdxzxxy` | 暂不抓取 |
| 物理实验教学中心 | [打开](https://sczx.bnuzh.edu.cn/wlsyjxzx) | `wlsyjxzx` | 已接入 |
| 党委组织工作办公室 | [打开](https://dwzgb.bnuzh.edu.cn) | `dwzzgzbgs` | 已接入 |
| 资产管理办公室 | [打开](https://oam.bnuzh.edu.cn) | `zcglbgs` | 已接入 |
| 校区发展基金会网站 | [打开](https://edf.bnuzh.edu.cn) | `xqfzjjhwz` | 已接入 |
| 校地党建结对共建专题网 | [打开](https://djjd.bnuzh.edu.cn) | `xddjjdgjztw` | 已接入 |
| 文理学院地理系网站 | [打开](https://geo.bnuzh.edu.cn) | `wlxydlxwz` | 已接入 |
| 党委教师工作办公室 | [打开](https://dwjgb.bnuzh.edu.cn/) | `dwjsgzbgs` | 已接入 |
| 教师教育实践网 | [打开](https://jwb.bnuzh.edu.cn/jsjysjw) | `jsjysjw` | 已接入 |
| 动植物图鉴录入网站 | [打开](https://ihap.bnuzh.edu.cn) | `dzwtjlrwz` | 已接入 |
| 档案馆网站 | [打开](https://dangan.bnuzh.edu.cn) | `dagwz` | 已接入 |
| 弘文书院网站 | [打开](https://hongwen.bnuzh.edu.cn) | `hwsywz` | 已接入 |
| 珠海校区实验教学平台 | [打开](https://sczx.bnuzh.edu.cn) | `jwbsyysjcxjyzxwz` | 已接入 |
| 理工实验平台网站 | [打开](https://iscst.bnuzh.edu.cn/) | `lgsyptwz` | 已接入 |
| 会同书院网站 | [打开](https://ht.bnuzh.edu.cn/) | `htsywz` | 已接入 |
| 地表过程与资源生态国家重点实验室珠海基地 | [打开](https://espre.bnuzh.edu.cn/) | `dbgcyzystgjzdsyszhjd` | 已接入 |
| 科研办公室网站 | [打开](https://kyb.bnuzh.edu.cn/) | `kybgswz` | 已接入 |
| 校区团委网站 | [打开](https://youth.bnuzh.edu.cn/) | `xqtwwz` | 已接入 |
| 乐育书院网站 | [打开](https://leyu.bnuzh.edu.cn/) | `lysywz` | 已接入 |
| 学生职业发展与就业指导中心网站 | [打开](https://career.bnuzh.edu.cn/) | `xszyfzyjyzdzxwz` | 已接入 |
| 网络信息中心 | [打开](http://nic.bnuzh.edu.cn/) | `wlxxzx` | 已接入 |
| 中国教育会计学会会议 | [打开](https://easc.bnuzh.edu.cn/) | `zgjykjxhhy` | 已接入 |
| 党委学生工作办公室 | [打开](https://dwxgb.bnuzh.edu.cn/) | `dwxsgzbgs` | 已接入 |
| 国际交流与合作办公室 | [打开](https://io.bnuzh.edu.cn) | `gjjlyhzbgs` | 已接入 |
| 乡长学院 | [打开](https://tcc.bnuzh.edu.cn) | `xcxy` | 已接入 |
| 迎新网 | [打开](https://welcome.bnuzh.edu.cn/) | `yxw` | 已接入 |
| 教务部 | [打开](https://jwb.bnuzh.edu.cn/) | `jwb` | 已接入 |
| 凤凰书院英文网 | [打开](https://phs.bnuzh.edu.cn/English/) | `fhsyyww` | 已接入 |
| 凤凰书院 | [打开](https://phs.bnuzh.edu.cn/) | `fhsy` | 已接入 |
| 党委宣传工作办公室(新闻中心) | [打开](https://xcb.bnuzh.edu.cn) | `zhxqxww` | 已接入 |
| 人才办 | [打开](http://hr.bnuzh.edu.cn/) | `rcb` | 已接入 |
| 珠海校区英文网 | [打开](http://english.bnuzh.edu.cn/) | `ebnuz` | 已接入 |
| 北京师范大学珠海校区主站 | [打开](http://www.bnuzh.edu.cn) | `bnuz` | 已接入 |

## 后续维护

运行 `npm run check:sources` 重新提取官方清单并检查新增、移除、名称及 URL 变化；用 `npm run check:sources -- --probe` 检查每个已接入源的代表列表页。实际栏目、分页和例外见 [站点结构表](docs/site-structure.md)。变更抓取目标后运行源库回归测试及完整快照流程。
