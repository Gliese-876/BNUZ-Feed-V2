# BNUZ Feed 开发文档

## 1. 项目定位

`BNUZ Feed` 是一个面向北京师范大学珠海校区公开站点的信息聚合前端。项目目标不是重建校内业务系统，而是把多个公开网页中的通知、新闻、活动和栏目内容整理成统一的信息流，并提供稳定的筛选、搜索、回看和跳转入口。

当前仓库已经从“验证抓取链路是否可行”进入“持续维护可用产品”的阶段。线上默认依赖静态快照和 GitHub Pages，浏览器直抓只保留给本地调试、解析器排障和回归验证。

站点接入事实和栏目复核记录见 [site-structure.md](/C:/Users/86186/Documents/Code/BNUZ_Feed/docs/site-structure.md)。

## 2. 仓库结构

```text
apps/
  web/                  Vite Web 应用、页面 UI、运行时装配
packages/
  contracts/            共享类型、错误模型、快照契约
  core/                 标准化、去重、原始命中统计、聚合服务
  react-bindings/       FeedProvider 与 React hooks
  runtime-browser/      浏览器抓取、Worker、IndexedDB 持久化
  runtime-snapshot/     /data/*.json 静态快照数据源
  source-registry/      站点注册表、fetchTargets、parser 实现
docs/
  architecture.md       本文档
  site-structure.md     站点结构、栏目口径、接入记录
scripts/
  generate-snapshot.ts  快照生成入口
  snapshotStrategy.ts   快照轮次策略
  snapshotFetch.ts      Node fetch / 浏览器抓取适配
```

职责边界：

- `contracts` 只定义共享协议，不放实现。
- `core` 只关心数据模型、去重、原始计数、合并和快照克隆，不依赖 React。
- `source-registry` 只描述“抓什么”和“怎么解析”，不负责发请求。
- `runtime-browser` 与 `runtime-snapshot` 负责把不同数据源接入统一聚合服务。
- `apps/web` 负责把聚合服务装配成可运行的界面。

## 3. 运行链路

当前主链路如下：

```text
bnuzhSources
  -> createParserRegistry()
  -> BrowserLiveSource / SnapshotSource
  -> Parser
  -> Normalizer
  -> createLayeredAggregationService(...)
  -> IndexedDB Repository
  -> FeedProvider
  -> useFeedSnapshot / useFeedRefresh
  -> apps/web/src/App.tsx
```

关键文件：

- [createAggregationService.ts](/C:/Users/86186/Documents/Code/BNUZ_Feed/apps/web/src/runtime/createAggregationService.ts)
- [generate-snapshot.ts](/C:/Users/86186/Documents/Code/BNUZ_Feed/scripts/generate-snapshot.ts)
- [snapshotStrategy.ts](/C:/Users/86186/Documents/Code/BNUZ_Feed/scripts/snapshotStrategy.ts)
- [runRefresh.ts](/C:/Users/86186/Documents/Code/BNUZ_Feed/packages/runtime-browser/src/runRefresh.ts)
- [bnuzhSources.ts](/C:/Users/86186/Documents/Code/BNUZ_Feed/packages/source-registry/src/bnuzhSources.ts)

运行时行为：

- `snapshot` 模式读取 `/data/feed-snapshot.json` 和 `/data/source-health.json`。
- `browser` 模式尝试浏览器端真实抓取，并在可用时通过 Worker 执行解析。
- `createLayeredAggregationService(...)` 会优先读取 `IndexedDB` 缓存；刷新成功后再写回本地。
- 主数据源失败且当前没有可用内存快照时，运行时回退到静态快照。

## 4. 快照生成与部署

### 4.1 当前快照策略

快照链路现在不是“单轮全抓失败即结束”，而是“单轮内按源稳定化补抓 + 必要时浏览器补全 + 最多三整轮收敛”：

1. `scripts/generate-snapshot.ts` 先执行 `node` 阶段。
2. `node` 阶段调用 `executeBrowserRefreshUntilStable(...)`，只对失败源继续补抓，不会重置已成功结果。
3. 如果整轮结束后仍有非 `live` 源，再只对这些源进入 `browser` 阶段补全。
4. 如果这一整轮仍未收敛到全 `live`，则重新开始下一整轮。
5. 超过整轮上限仍未收敛，脚本直接失败，GitHub Actions 不会部署坏快照。

脚本默认参数来自 [generate-snapshot.ts](/C:/Users/86186/Documents/Code/BNUZ_Feed/scripts/generate-snapshot.ts)：

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `BNUZ_FEED_SNAPSHOT_CONCURRENCY` | `6` | 源级并发 |
| `BNUZ_FEED_SNAPSHOT_TARGET_CONCURRENCY` | `3` | 源内目标并发 |
| `BNUZ_FEED_SNAPSHOT_TIMEOUT_MS` | `5000` | `node fetch` 单请求超时 |
| `BNUZ_FEED_SNAPSHOT_BROWSER_TIMEOUT_MS` | `5000` | 浏览器抓取单请求超时，默认跟随 `TIMEOUT_MS` |
| `BNUZ_FEED_SNAPSHOT_NODE_MAX_ATTEMPTS` | `10` | 单轮 `node` 阶段内每个失败源的最大尝试次数 |
| `BNUZ_FEED_SNAPSHOT_BROWSER_MAX_ATTEMPTS` | `5` | 单轮浏览器补全阶段内每个失败源的最大尝试次数 |
| `BNUZ_FEED_SNAPSHOT_ROUND_LIMIT` | `3` | 整轮上限；超过则脚本失败 |
| `BNUZ_FEED_SNAPSHOT_RETRY_DELAY_MS` | `1500` | 同一阶段内相邻 attempt 间隔 |
| `BNUZ_FEED_SNAPSHOT_BROWSER_HOSTS` | 空 | 命中这些 host 时，浏览器阶段改用 Chromium 抓取 |

### 4.2 当前 GitHub Actions 覆盖值

线上工作流会覆盖一组更保守的云端参数：

| 变量 | 当前值 | 说明 |
| --- | --- | --- |
| `BNUZ_FEED_SNAPSHOT_CONCURRENCY` | `3` | 降低云端源级并发 |
| `BNUZ_FEED_SNAPSHOT_TARGET_CONCURRENCY` | `2` | 降低云端源内并发 |
| `BNUZ_FEED_SNAPSHOT_TIMEOUT_MS` | `5000` | 云端 `node fetch` 超时 |
| `BNUZ_FEED_SNAPSHOT_BROWSER_TIMEOUT_MS` | `5000` | 云端浏览器抓取超时 |
| `BNUZ_FEED_SNAPSHOT_NODE_MAX_ATTEMPTS` | `10` | 云端 `node` 阶段补抓上限 |
| `BNUZ_FEED_SNAPSHOT_BROWSER_MAX_ATTEMPTS` | `5` | 云端浏览器补全阶段补抓上限 |
| `BNUZ_FEED_SNAPSHOT_ROUND_LIMIT` | `3` | 最多三整轮 |
| `BNUZ_FEED_SNAPSHOT_RETRY_DELAY_MS` | `5000` | 云端阶段间等待时间 |
| `BNUZ_FEED_SNAPSHOT_BROWSER_HOSTS` | `www.bnuzh.edu.cn` | 主站 host 在浏览器阶段改走 Chromium |

对应工作流：

- [refresh-web.yml](/C:/Users/86186/Documents/Code/BNUZ_Feed/.github/workflows/refresh-web.yml)
- [manual-refresh-web.yml](/C:/Users/86186/Documents/Code/BNUZ_Feed/.github/workflows/manual-refresh-web.yml)

其中 `refresh-web.yml` 的自动调度按北京时间每日 `06:00` 开始每 `15` 分钟执行一次，`22:00` 为最后一次触发。

### 4.3 部署门禁

当前线上部署完全由 GitHub Actions 冷启动完成，不依赖本地机器。现状：

- 使用 `Node 24`。
- 安装 Playwright Chromium，供浏览器补全阶段使用。
- 先执行 `npm run snapshot`。
- 再执行 `node scripts/check-snapshot-health.cjs`，只要仍存在 `partial` 或其他非 `live` 状态就直接失败。
- 只有健康检查通过后才会执行 `npm run build` 并部署到 GitHub Pages。

这意味着线上部署的前提已经不是“快照能写出来”，而是“快照健康度达标”。

## 5. 数据模型与去重

### 5.1 `FeedItem` 当前语义

当前 `FeedItem` 不再只表示“一条最终展示项”，还会携带它和原始抓取结果之间的映射关系：

- `sourceId`：主源 ID。
- `sourceIds`：去重合并后涉及的全部源。
- `rawCount`：该展示项在去重前对应的原始条目总数。
- `rawOccurrences`：原始条目按“源 + 栏目”的分布。

相关类型定义在 [packages/contracts/src/index.ts](/C:/Users/86186/Documents/Code/BNUZ_Feed/packages/contracts/src/index.ts)。

### 5.2 去重规则

当前去重逻辑位于 [dedupe.ts](/C:/Users/86186/Documents/Code/BNUZ_Feed/packages/core/src/dedupe.ts)，分两层：

1. 先按 `item.id` 合并。
2. 再按“规范化 URL + 规范化标题”做别名去重。

保留规则：

- 同一篇文章的 `http/https` 变体会合并。
- 同一篇文章在多个源同时出现会合并。
- 同一 URL 但标题不同的条目不会误合并。

合并时不仅会合并 `sourceIds`，还会累计 `rawCount` 和 `rawOccurrences`。这保证了前端既能展示去重后的列表，也能继续拿到去重前的统计口径。

### 5.3 原始计数语义

当前有两个容易混淆的数字：

- `snapshot.items.length`：去重后的条目数。
- `sourceHealth[sourceId].itemCount`：该源去重前的原始条目数。

在增量刷新、缓存回放和快照读取链路里，项目现在都会尽量保留原始计数，不再把它们错误地覆盖成去重后条数。相关实现见：

- [rawOccurrences.ts](/C:/Users/86186/Documents/Code/BNUZ_Feed/packages/core/src/rawOccurrences.ts)
- [service.ts](/C:/Users/86186/Documents/Code/BNUZ_Feed/packages/core/src/service.ts)
- [snapshot.ts](/C:/Users/86186/Documents/Code/BNUZ_Feed/packages/core/src/snapshot.ts)
- [snapshotSource.ts](/C:/Users/86186/Documents/Code/BNUZ_Feed/packages/runtime-snapshot/src/snapshotSource.ts)
- [runRefresh.ts](/C:/Users/86186/Documents/Code/BNUZ_Feed/packages/runtime-browser/src/runRefresh.ts)

## 6. Web 前端当前行为

主入口位于 [App.tsx](/C:/Users/86186/Documents/Code/BNUZ_Feed/apps/web/src/App.tsx)。

### 6.1 顶部统计卡片

当前顶部统计区的含义是：

- `信息源`：可用源数量。
- `栏目`：可选栏目数量。
- `去重后条数（原始条数）`：当前筛选结果中，去重后展示条数和去重前原始条数，格式为 `8000（10000）`。
- `最近更新`：当前快照时间。

这里的“原始条数”不是全局总量，而是受当前站点、栏目和关键词筛选共同影响的结果。

### 6.2 “选择栏目”抽屉

当前所有屏幕尺寸统一使用同一套抽屉逻辑：

- 顶部始终显示“选择栏目”按钮。
- 抽屉在所有尺寸下都以覆盖层形式出现。
- 打开时进入 `is-open`，关闭时先进入 `is-closing`，等待退场动画结束后再卸载。

筛选状态继续写入 `localStorage`，实现见 [useSourceSelection.ts](/C:/Users/86186/Documents/Code/BNUZ_Feed/apps/web/src/useSourceSelection.ts)。

### 6.3 侧栏计数口径

“选择栏目”中的站点数和栏目数现在按去重前的原始命中数统计，而不是按 `snapshot.items` 的去重后结果统计。

这意味着：

- 跨源合并后的同一条内容，在相关源下仍会按各自原始命中计数。
- 同一源同一栏目下被合并掉的重复条目，侧栏仍会显示原始命中量。

实现位于 [sourceCatalog.ts](/C:/Users/86186/Documents/Code/BNUZ_Feed/apps/web/src/sourceCatalog.ts)。

### 6.4 本地搜索与筛选

当前“搜索当前内容”仍然是本地过滤，不会调用校内官方全文搜索：

- 数据源是当前 `snapshot.items`。
- 搜索索引由标题、摘要、栏目名和源名构成。
- 站点筛选和栏目筛选的匹配现在基于 `rawOccurrences`，因此跨源去重后的条目仍能在对应源/栏目下被正确筛中。

实现位于 [feedIndex.ts](/C:/Users/86186/Documents/Code/BNUZ_Feed/apps/web/src/feedIndex.ts)。

### 6.5 官方全文搜索弹窗

官方全文搜索入口位于 [OfficialSearchDialog.tsx](/C:/Users/86186/Documents/Code/BNUZ_Feed/apps/web/src/OfficialSearchDialog.tsx)，其职责仍然只是封装校内官方搜索表单，不在项目内抓取或重排官方搜索结果。

当前约定：

- 普通搜索提交 `query` 并在新标签页打开官方结果页。
- 复合检索支持关键词、标题、正文、时间区间、每页条数和匹配方式。
- 站点范围来自当前 `sourceCatalog`，外加一个“所有站点”选项。

## 7. 站点接入与复核口径

站点接入仍遵守以下原则：

- 只抓可公开访问的页面。
- 优先抓稳定的列表页，不优先抓首页拼装块。
- 只把标题、链接和时间序列稳定的栏目写入 `fetchTargets`。
- 多分页栏目显式展开为多个 `fetchTargets`，不在 parser 内做隐式翻页。
- 优先复用通用解析器，只有在通用解析器不够时才写站点专用 parser。

复核时需要区分“动态消息源”和“静态说明页”：

- 只有持续产出通知、新闻、活动、快讯、速递等时间序列内容的栏目，才按消息源口径核对缺漏。
- 规章制度、办事指南、设备中心、楼宇介绍、图片展示等静态栏目，不因为当前无条目而自动判定漏抓。
- 页面 `200` 且存在正文列表，但 parser 返回 `0` 时，优先视为 parser 漏抓。

详细站点事实继续维护在 [site-structure.md](/C:/Users/86186/Documents/Code/BNUZ_Feed/docs/site-structure.md)。

## 8. 测试与验证

本轮开发后，和当前实现直接相关的回归点包括：

- [dedupe.test.ts](/C:/Users/86186/Documents/Code/BNUZ_Feed/packages/core/src/dedupe.test.ts)
- [service.test.ts](/C:/Users/86186/Documents/Code/BNUZ_Feed/packages/core/src/service.test.ts)
- [runRefresh.test.ts](/C:/Users/86186/Documents/Code/BNUZ_Feed/packages/runtime-browser/src/runRefresh.test.ts)
- [feedIndex.test.ts](/C:/Users/86186/Documents/Code/BNUZ_Feed/apps/web/src/feedIndex.test.ts)
- [sourceCatalog.test.ts](/C:/Users/86186/Documents/Code/BNUZ_Feed/apps/web/src/sourceCatalog.test.ts)
- [App.test.tsx](/C:/Users/86186/Documents/Code/BNUZ_Feed/apps/web/src/App.test.tsx)
- [OfficialSearchDialog.test.tsx](/C:/Users/86186/Documents/Code/BNUZ_Feed/apps/web/src/OfficialSearchDialog.test.tsx)
- [siteSearch.test.ts](/C:/Users/86186/Documents/Code/BNUZ_Feed/apps/web/src/siteSearch.test.ts)

常用命令：

```bash
npm run check
npm test
npm run snapshot
npm run build
```

针对快照与前端计数相关改动，常用的快速验证命令是：

```bash
npm test -- packages/core/src/dedupe.test.ts packages/core/src/service.test.ts packages/runtime-browser/src/runRefresh.test.ts apps/web/src/feedIndex.test.ts apps/web/src/sourceCatalog.test.ts apps/web/src/App.test.tsx
```

## 9. 维护约定

后续开发请继续遵守这些约定：

- 新增站点时，优先修改 `packages/source-registry` 与对应测试，不把抓取逻辑写进 UI。
- 新增弹窗、抽屉或下拉时，优先复用 [useOverlayPresence.ts](/C:/Users/86186/Documents/Code/BNUZ_Feed/apps/web/src/useOverlayPresence.ts)。
- 官方全文搜索只做表单封装，不在前端实现二次抓取、排序或缓存。
- 所有涉及数量展示的改动，都要先明确“这是去重后条数还是原始条数”。
- `docs/site-structure.md` 继续维护站点接入事实；本文档只维护架构、运行链路、数据模型和交互约定。
