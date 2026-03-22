# BNUZH Feed 开发文档

## 1. 项目定位

`BNUZH Feed` 是一个面向北京师范大学珠海校区公开站点的前端聚合工程。项目目标不是直接搭建完整业务系统，而是先把“站点发现、页面抓取、列表解析、记录标准化、聚合去重、缓存回退、React 消费”这条链路拆清楚并跑通，便于后续持续扩站。

当前代码状态与仓库现状一致：

- 工程基于 `React + TypeScript + Vite`，采用 monorepo 结构。
- Web 端目前仍是运行时验证壳层，用于查看刷新结果、缓存来源和各站点健康状态，不是正式业务 UI。
- `packages/source-registry/src/bnuzhSources.ts` 中一共登记了 `45` 个公开站点。
- 其中 `43` 个站点已经接入真实 `fetchTargets` 与 parser。
- 仍有 `2` 个站点不可访问，继续保留占位 parser：
  - `党委保卫工作办公室`
  - `北京师范大学珠海校区实验室安全与设备管理办公室`

完整站点台账见 `docs/site-structure.md`，公开站点原始清单见 `BNUZH_PUBLIC_SITELIST.md`。

## 2. 仓库结构

```text
apps/
  web/                  Vite 应用入口、运行时组合根、最小验证壳层
packages/
  contracts/            共享类型、错误模型、Worker 通信协议
  core/                 标准化、去重、快照处理、聚合服务
  source-registry/      站点清单、parser 注册表、通用 parser、占位 parser
  runtime-browser/      浏览器抓取、Worker、IndexedDB 仓储、错误归类
  runtime-snapshot/     /data/*.json 静态快照数据源
  react-bindings/       FeedProvider 与 React hooks
docs/
  architecture.md       本文档
  site-structure.md     已接入站点结构表与复核记录
```

各层职责边界如下：

- `contracts` 只定义协议和数据结构，不承载实现。
- `core` 只关心聚合逻辑，不依赖 React，也不依赖具体站点。
- `source-registry` 只描述“有哪些站点、用哪个 parser、抓哪些目标页”，不负责请求执行。
- `runtime-browser` 负责真实抓取与运行期仓储。
- `runtime-snapshot` 负责静态快照回放。
- `react-bindings` 只依赖 `AggregationService`，不直接接触 parser。
- `apps/web` 负责把各模块装配成可运行的页面。

## 3. 当前运行链路

当前应用的真实运行链路如下：

```text
bnuzhSources
  -> createParserRegistry()
  -> BrowserLiveSource 或 SnapshotSource
  -> Parser
  -> Normalizer
  -> createLayeredAggregationService
  -> IndexedDB Repository
  -> FeedProvider
  -> useFeedSnapshot / useFeedRefresh / useSourceHealth
  -> apps/web RuntimeShell
```

关键实现点：

- `apps/web/src/runtime/createAggregationService.ts` 会同时创建：
  - `BrowserLiveSource`
  - `SnapshotSource`
  - `IndexedDB` 仓储
  - `createLayeredAggregationService(...)`
- 浏览器模式下，默认请求参数是：
  - `concurrency = 4`
  - `timeoutMs = 8000`
- `createLayeredAggregationService` 的职责是：
  - 启动时优先读取 IndexedDB 缓存
  - 刷新成功后保存最新快照
  - 主数据源失败且当前无内存快照时，回退到静态快照
- `runtime-browser` 会优先尝试使用 Worker；若环境不支持或 Worker 失败，则自动退回主线程执行。

## 4. Web 端当前形态

`apps/web/src/App.tsx` 当前只提供最小运行壳层，页面主要展示：

- 当前数据源模式
- 快照来源（`live` / `cache` / `snapshot`）
- 聚合后的条目数
- 站点健康状态
- 手动触发刷新按钮

这说明项目现阶段已经具备“抓取到 React 消费”的完整框架，但正式列表页、筛选页和运营化 UI 仍未展开。

## 5. 运行模式与配置

运行时配置位于 `apps/web/src/runtime/config.ts`。

- `VITE_FEED_SOURCE_MODE=snapshot` 时使用快照模式。
- 其余情况默认使用 `browser` 模式。
- `VITE_AUTO_REFRESH` 默认关闭，只有显式传入 `1` 或 `true` 才会自动刷新。

两种运行模式的实际含义：

- 浏览器直连模式
  - 直接请求公开站点页面
  - 在 Worker 或主线程里完成解析、标准化和聚合
  - 成功结果写入 IndexedDB
- 快照模式
  - 读取 `apps/web/public/data/feed-snapshot.json`
  - 读取 `apps/web/public/data/source-health.json`
  - 输出与实时模式结构一致的 `FeedSnapshot`

当前默认配置是：

- `sourceMode = browser`
- `autoRefresh = false`

这个默认值符合当前工程阶段：以人工触发刷新、观察单站失败、排查 selector 回归为主。

## 6. 核心数据契约

### 6.1 SourceDescriptor

`SourceDescriptor` 用来描述一个站点在运行时应该如何接入：

- `entryUrls`：站点原始入口，用于标识来源与人工追溯。
- `fetchTargets`：真实抓取目标页；站点一旦完成实现，就优先使用它，不再直接抓 `entryUrls`。
- `parserKey`：站点 parser 的唯一键，格式固定为 `bnuzh/<path>`。
- `capabilities.browserFetch`：是否允许浏览器直抓。
- `capabilities.snapshotFallback`：实时失败时是否允许快照兜底。

当前 `bnuzhSources.ts` 的实际行为是：

- 先声明全部站点的基础信息。
- 再从 `implementedBnuzhFetchTargets` 自动挂载已实现站点的 `fetchTargets`。
- 对已实现站点，统一把 `browserFetch` 置为 `true`。

### 6.2 FetchTarget

```ts
interface FetchTarget {
  id: string;
  url: string;
  channel?: string;
}
```

字段约定：

- `id`：站点内部的目标页标识，也是 parser 分流用的 `requestId`。
- `url`：真实公开列表页 URL，必须能匿名访问。
- `channel`：可选频道名，通常会回写到 `rawChannel`。

### 6.3 RawPage

```ts
interface RawPage {
  sourceId: string;
  requestId: string;
  requestUrl: string;
  finalUrl: string;
  fetchedAt: string;
  contentType?: string;
  bodyText: string;
  channel?: string;
}
```

其中最关键的是 `requestId`。它显式告诉 parser：“当前抓到的是哪个目标页”，避免 parser 反过来猜 URL。

### 6.4 SourceRecord / FeedItem / FeedSnapshot

数据分三层：

- `SourceRecord`
  - parser 产出的原始结构
  - 保留 `rawTitle`、`rawUrl`、`rawPublishedAt` 等站点原始信息
- `FeedItem`
  - normalizer 产出的统一结构
  - 会补齐统一字段，并保留 `sourceIds` 以支持跨入口去重后追踪来源
- `FeedSnapshot`
  - 聚合后的完整快照
  - 同时携带 `items` 与 `sourceHealth`

## 7. parser 与站点模块约定

### 7.1 注册方式

站点实现统一放在 `packages/source-registry/src/bnuzh/` 下。每个站点文件都应导出：

- `<path>FetchTargets`
- `<path>Parser`

随后在 `packages/source-registry/src/bnuzh/index.ts` 中统一注册到：

- `implementedBnuzhFetchTargets`
- `implementedBnuzhParsers`

`createParserRegistry()` 会优先注入这些已实现 parser。未实现站点则自动回落到 `PlaceholderParser`。

### 7.2 parser 接口

所有 parser 都遵循同一接口：

```ts
parse(page: RawPage): Promise<SourceRecord[]>
```

约定如下：

- 同一站点的多个栏目页尽量共用一个 parser。
- 通过 `requestId` 区分不同栏目。
- 解析失败时抛出 `AggregationError("PARSER_FAILED", ...)`。
- parser 未实现时抛出 `AggregationError("PARSER_NOT_IMPLEMENTED", ...)`。
- 解析成功但当前页没有有效记录时，返回空数组，由运行时统一归类为 `EMPTY_RESULT`。

### 7.3 通用 parser 的优先级

当前 BNUZ 子站的大多数实现优先复用：

- `createConfiguredHtmlListParser`
- `ConfiguredHtmlListParser`

它适合以下场景：

- 页面是公开 HTML 列表页
- DOM 结构稳定
- 可通过 selector 稳定拿到标题、链接、时间、摘要

只有在以下场景才建议写站点专用 parser：

- 同页混合多种容器，且需要候选分组打分
- 需要扫描正文锚点而不是固定列表容器
- 需要定制复杂日期抽取或标题清洗
- 需要把单页内容、卡片内容或附件列表退化成消息源

## 8. 站点接入的实际原则

以下原则对应当前仓库中已经落地的实现方式，而不是抽象约定：

- 只抓匿名可访问的公开页面。
- 优先抓独立列表页，不优先抓首页拼装块。
- 只保留标题、详情链接和时间序列稳定的页面。
- 页面没有可信时间时，不伪造 `publishedAt`。
- 跳转页、空壳页、静态介绍页、业务入口页不纳入 `fetchTargets`。
- 如果没有独立详情页，但同页存在稳定分段内容或附件列表，可以退化为“单页内容源”或“附件源”。
- 相对链接一律基于 `page.finalUrl` 归一化成绝对链接。
- 同一站点有多个分页时，应显式展开为多个 `fetchTargets`，而不是在 parser 内部隐式翻页。

当前代码里已经出现并反复复用的实现模式主要有：

- 标准文章列表页
- 标准附件列表页
- 正文区域锚点扫描
- 多候选容器打分后择优解析
- 单页分段内容抽取
- 多分页归档列表
- 同页混合站内详情、外链和附件
- 英文站点的月份日期解析与密集 `<ul>` 评分

这些模式的站点级事实台账统一维护在 `docs/site-structure.md`，不再在本文重复逐站展开。

## 9. 已接入现状

截至当前仓库状态：

- 共登记 `45` 个站点。
- 已实现真实抓取与解析的站点共 `43` 个。
- 未实现但仍保留在注册表中的站点共 `2` 个。
- 已实现站点的详细 `fetchTargets`、频道口径与复核备注，统一记录在 `docs/site-structure.md`。

这意味着当前工作重点已经从“搭框架”转到“持续扩站、复核入口、收敛 selector 风险”。项目的核心风险也因此更加明确：

- 某些站点结构变化导致 selector 回归
- 某些入口页面由公开页变为跳转页或空壳页
- 某些历史分页、轮播页或专题页与主列表重复
- 某些站点短期不可访问，需要继续保留占位实现

## 10. 新站点接入流程

推荐按下面的顺序工作：

1. 从 `BNUZH_PUBLIC_SITELIST.md` 确认站点名称、路径、入口 URL。
2. 优先用 Playwright MCP 复核首页导航、栏目入口和真实列表 DOM。
3. 若浏览器复核受阻，再用公开 HTML 或缓存页面做结构核验，但最终仍以真实公开 URL 为准。
4. 只把真实可抓、结构稳定的栏目写入 `fetchTargets`。
5. 优先尝试 `createConfiguredHtmlListParser`，确实不够时再写专用 parser。
6. 补最少两类测试：
   - `fetchTargets` 清单测试
   - 列表解析测试
7. 更新注册表与文档：
   - `packages/source-registry/src/bnuzh/index.ts`
   - `docs/site-structure.md`
   - 本文档

## 11. 测试与验证

当前仓库根脚本如下：

- `npm run dev`
- `npm run build`
- `npm run check`
- `npm test`

测试重点应放在两类问题上：

- 站点目录是否接对了真实入口
- selector、日期抽取、相对链接归一化是否在 HTML 变动后仍成立

## 12. 扩展约束

为避免架构重新耦合，后续开发应继续遵守以下边界：

- 新增站点时，优先只改 `packages/source-registry` 与对应测试。
- UI 组件不得直接请求外站，也不得直接 import parser。
- 如果未来改成 GitHub Actions 预抓取，只应切换数据源装配，不改 React hooks 契约。
- `core` 保持与站点无关，`react-bindings` 保持与具体 parser 无关。

## 13. 建议的后续方向

当前更合理的后续顺序是：

1. 继续补齐剩余不可访问站点，或在条件允许时转为真实实现。
2. 为 `runtime-browser` 增加更细粒度的失败诊断与限流能力。
3. 为高风险站点补更多真实 HTML 测试样例，降低 selector 回归概率。
4. 在现有 `FeedProvider` 基础上补正式列表页、筛选页和来源状态页。
5. 如果引入预抓取流程，统一产出快照文件并稳定快照模式。
