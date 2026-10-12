# BNUZ Feed 开发文档

本项目聚合北京师范大学珠海校区公开站点的信息。生产环境使用静态快照，浏览器直抓用于本地调试。站点接入和复核记录见 [site-structure.md](site-structure.md)。

## 模块职责

| 模块 | 职责 |
| --- | --- |
| `contracts` | 来源、条目、健康状态和运行时接口 |
| `core` | 标准化、去重、来源拆分、快照合并、缓存协调 |
| `source-registry/catalog` | 不含解析器的站点与抓取入口元数据 |
| `source-registry` | HTML 解析器与解析器注册表 |
| `runtime-browser` | 并发抓取、失败源重试、Worker、IndexedDB |
| `runtime-snapshot` | 同源静态快照读取与旧格式兼容 |
| `react-bindings` | React 订阅、启动与刷新状态 |
| `apps/web` | 运行时装配、搜索索引、筛选和阅读界面 |
| `scripts` | 官网清单核验、快照生成与发布健康检查 |

## 数据链路

```text
官方 siteList → 站点元数据 / fetchTargets → HTML 解析器
                                              ↓
                                     标准化 → 去重 → 快照
                                                       ↓
Web ← FeedProvider ← 聚合服务 ← 同源 JSON / IndexedDB
```

Web 默认只读取 `data/feed-snapshot.json`，优先使用其中同版本的健康状态；仅旧快照缺少健康信息时读取 `source-health.json`。快照经过校验后进入内存和 IndexedDB，持久化失败不阻断有效内容展示。浏览器调试抓取按需加载，生产阅读界面通过纯元数据入口获取来源与栏目。

## 快照生成

入口为 [generate-snapshot.ts](../scripts/generate-snapshot.ts)。每轮先执行 Node 抓取，再对未健康来源执行浏览器补抓；之后的轮次保留成功来源，只重试未健康来源。浏览器实例由一轮补抓共享，并在全部任务结束后关闭。

默认参数和环境变量见 [README](../README.md)。GitHub Actions 使用两轮上限、10 分钟抓取步骤及 14 分钟构建超时，系统 Chrome 由 Playwright 控制。自动调度按北京时间每日 06:00 至 22:00，每 15 分钟触发。

只有全部预期抓取来源均为 `live`，生成器才会写入快照。JSON 使用紧凑格式。发布前 [check-snapshot-health.cjs](../scripts/check-snapshot-health.cjs) 再检查数据与健康状态，拒绝空快照和非 `live` 状态。

代码发布与全量抓取分开：`push` 通过 `prepare-publish-snapshot.ts` 在仓库和已发布数据间选择较新的健康快照，核对当前来源覆盖；定时或手动刷新仍需抓取成功。所有事件共用串行队列，部署前核对 main 的最新 SHA，避免旧任务覆盖新版本。详见 [deployment.md](deployment.md)。

## 去重与统计

`FeedItem` 的 `sourceId` 是主要展示来源，`sourceIds` 为所有关联来源。`rawOccurrences` 记录每个“来源 + 栏目”的原始命中数，`rawCount` 为其总和。

去重先匹配条目 ID，再匹配规范化 URL 与标题。同一文章的 HTTP/HTTPS 变体可以合并；同一 URL 的不同标题分别保留。原始抓取记录的重复命中相加，重试结果按修订合并，避免每轮重试重复累计数量。仅含月日的原文日期保留其精度，不补造年份，排序时按日期未知处理。

按来源更新时通过 `splitFeedItemsBySource` 将条目及其命中数一同拆分。替换一个来源只替换属于它的记录，其他来源及栏目不会丢失或重复累计。

界面列表显示去重后的内容；筛选面板显示去重前命中数。顶部的“当前结果”和“原始收录”分别标明去重后的内容数与原始命中数，随站点、栏目和关键词筛选共同变化。本地索引预先保存搜索文本与来源栏目键，输入时无需反复解析命中记录。

## WebUI

界面以瑞士国际主义的网格和文字层级为基础，融合孟菲斯几何、波浪和亮色点缀；装饰避开阅读主体。主页面由阅读列表、来源筛选面板和官方搜索对话框组成。默认展示学生精选；全部信息与自定义栏目均可切换。`localStorage` v2 保存预设模式或自定义栏目，迁移 v1 时将旧默认全选转为精选并保留明确自定义选择。规则及维护说明见 [student-collection.md](student-collection.md)。内容增量渲染，并提供手动加载入口。文章使用原生链接，支持键盘、复制链接和在新标签页打开。

覆盖层共享焦点管理：打开后聚焦、限制 Tab 焦点范围、支持 Escape 关闭、关闭后回到触发按钮。官方搜索使用原生选择框和日期输入，按官方 POST 字段提交到官方页面；其站点范围包含完整官方站点清单。

## 维护与验证

```bash
npm run check          # 类型检查，包含未使用代码检查
npm test               # 回归测试
npm run check:sources  # 联网核验官网 siteList
npm run snapshot       # 联网生成全部来源快照
node scripts/check-snapshot-health.cjs
npm run build
```

更新来源时维护 `source-registry` 的目标配置及解析器，并补入真实页面结构的精简回归样本。区分网络暂时不可达、空栏目、真实路径失效与选择器不匹配；HTTP 200 不代表解析成功。详细证据和无法接入的原因记录在 [site-structure.md](site-structure.md)。
