# BNUZ Feed V2

BNUZ Feed V2 是一个面向北京师范大学珠海校区公开信息站点的信息聚合项目。它将分散在不同子站中的通知、新闻、栏目页与公告内容抓取、解析、归并为统一信息流，并通过一个适合日常使用的 Web 界面进行展示。

项目整体采用 `React + TypeScript + Vite` 的 monorepo 结构。生产环境默认走“预抓取快照 + 同源静态发布”链路，以规避浏览器跨域抓取带来的 CORS 问题；前端页面对外展示名称保持为 `BNUZ Feed`，仓库与项目名称为 `BNUZ Feed V2`。

## 在线访问

- GitHub Pages: `https://abcabc123789456.github.io/BNUZ-Feed-V2/`
- 仓库地址: `https://github.com/abcabc123789456/BNUZ-Feed-V2`

## 项目目标

- 聚合校区公开站点信息，降低跨站浏览成本。
- 将抓取、解析、归并、缓存、发布链路做成稳定工程，而不是一次性脚本。
- 在中国大陆可访问的静态托管环境中稳定部署，不依赖浏览器直接跨域抓站。
- 让前端以“可读、可筛、可搜、可持续刷新”的方式服务真实使用场景。

## 当前状态

- 仓库中共记录 `45` 个站点来源。
- 其中 `43` 个公开可访问站点已经接入当前生产链路。
- 前台、快照生成和默认构建均只使用这 `43` 个可用站点。
- 当前不可访问的 `2` 个站点不会出现在前台筛选和搜索范围中。

站点结构、栏目口径与接入记录见 [docs/site-structure.md](docs/site-structure.md)。

## 主要能力

- 自动聚合 BNUZH 公开站点内容，并统一为单一信息流。
- 默认使用同源快照模式，避免前端直接跨域抓取造成 CORS 失败。
- 页面进入后自动刷新当前数据源，刷新过程按来源解耦，单站失败不会拖累全站。
- 支持本地缓存。
  快照数据写入 `IndexedDB`，站点/栏目筛选状态写入 `localStorage`。
- 支持按站点与栏目筛选，默认全选，移动端使用抽屉，桌面端使用常驻侧栏。
- 支持页面内信息流搜索。
- 支持封装校区官方全文检索。
  可从聚合站中直接发起全站或单站检索，并使用官方复合检索参数。
- 支持系统日间 / 夜间主题自动切换。
- 适配桌面端与移动端。
- 支持 GitHub Actions 定时生成快照并构建 Web 静态产物。

## 架构概览

### 数据链路

```text
公开站点
  -> fetchTargets
  -> parser
  -> normalize
  -> dedupe / merge
  -> snapshot 或本地缓存
  -> React Web UI
```

### 运行模式

- `snapshot`
  默认模式。前端只读取同源的 `/data/feed-snapshot.json` 与 `/data/source-health.json`。
- `browser`
  调试模式。浏览器直接抓取公开站点，并在可用时通过 Worker 执行抓取与解析。仅建议本地调试使用。

### 刷新策略

- 页面初始化后自动刷新当前数据源。
- 刷新请求串行入队，避免重复触发。
- 浏览器直抓模式下，站点级和站点内抓取都做了限流。
- 失败重试按站点独立执行，不会因为单站失败阻塞其他来源。
- 页面信息流使用渐进式渲染，滚动到底部自动续载，避免一次性渲染大量卡片。

## 仓库结构

```text
apps/
  web/                  Web 应用、页面 UI、运行时装配
packages/
  contracts/            共享类型、错误模型、Worker 协议
  core/                 聚合、去重、合并、快照逻辑
  react-bindings/       FeedProvider 与 React Hooks
  runtime-browser/      浏览器抓取、Worker、IndexedDB 存储
  runtime-snapshot/     同源快照数据源
  source-registry/      站点注册、fetchTargets、parser 实现
scripts/
  generate-snapshot.ts  生成 feed 快照与站点健康信息
docs/
  architecture.md       架构说明
  site-structure.md     站点结构、栏目口径、接入记录
.github/workflows/
  refresh-web.yml       定时生成快照并构建 Web
```

## 前端说明

当前 Web 端不是调试面板，而是一个可长期使用的聚合阅读入口。其前台重点包括：

- 简洁的信息流阅读界面
- 站点 / 栏目筛选
- 页面内搜索
- 官方全文检索入口
- 移动端抽屉式筛选面板
- 系统主题自适应
- 本地筛选状态持久化

底层的自动刷新、失败重试、快照来源与抓取机制不会被过度暴露在前台，优先保证用户阅读体验与交互稳定性。

## 官方全文检索封装

项目已将校区官方全文检索页封装进聚合站顶部入口。当前支持：

- 所有站点 / 单站范围切换
- 基础关键词检索
- 关键词精确 / 模糊匹配
- 复合检索
  包括关键词、标题、正文、时间区间、每页条数
- 结果在新标签页打开
  结果页中的时间、位置、排序等进一步筛选仍交由官方检索页处理

官方检索入口本身来自：

- `https://www.bnuzh.edu.cn/cms/web/search/index.jsp`

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 本地开发

```bash
npm run dev
```

### 3. 常用命令

```bash
npm run check
npm test
npm run snapshot
npm run build
npm run build:snapshot
```

命令说明：

- `npm run check`
  TypeScript 类型检查。
- `npm test`
  运行 `apps` 与 `packages` 下的测试。
- `npm run snapshot`
  抓取公开站点并生成快照文件。
- `npm run build`
  构建 Web 应用。
- `npm run build:snapshot`
  先生成快照，再构建生产包。

## 环境变量

### Web 运行时

| 变量名 | 默认值 | 说明 |
| --- | --- | --- |
| `VITE_FEED_SOURCE_MODE` | `snapshot` | 设为 `browser` 时启用浏览器直抓调试模式 |
| `VITE_AUTO_REFRESH` | `true` | 页面进入后是否自动刷新当前数据源 |

### 快照生成

| 变量名 | 默认值 | 说明 |
| --- | --- | --- |
| `BNUZ_FEED_SNAPSHOT_CONCURRENCY` | `6` | 站点级并发数 |
| `BNUZ_FEED_SNAPSHOT_TARGET_CONCURRENCY` | `3` | 站点内抓取 / 解析并发数 |
| `BNUZ_FEED_SNAPSHOT_TIMEOUT_MS` | `12000` | 单请求超时时间，单位毫秒 |

## 部署建议

当前仓库默认采用“快照构建 + GitHub Pages 静态部署”的生产方式。

首次启用时，需要在仓库 `Settings -> Pages -> Build and deployment -> Source` 中选择 `GitHub Actions`。

标准部署链路如下：

1. 执行 `npm run snapshot`
2. 执行 `npm run build`
3. 上传 `apps/web/dist`
4. 由 GitHub Actions 部署到 GitHub Pages

工作流会自动根据仓库名设置 `VITE_BASE_PATH`，因此项目型 Pages 地址 `/<repo>/` 与根域名 Pages 地址 `/` 都可以正确生成资源路径。

这样做的直接好处：

- 规避浏览器跨域限制
- 首屏稳定，可直接消费同源静态数据
- 刷新压力转移到构建端或 CI，而不是终端用户浏览器

快照文件位于 `apps/web/public/data/`，包括：

- `feed-snapshot.json`
- `source-health.json`

## 自动化构建

仓库内置 GitHub Actions 工作流 [refresh-web.yml](.github/workflows/refresh-web.yml)，用于：

- 手动触发构建
- 每小时刷新快照
- 在主分支更新后构建并部署 Web 静态站点
- 将最新构建结果发布到 GitHub Pages

工作流的基本步骤：

1. `npm ci`
2. `npm run snapshot`
3. `npm run build`
4. 上传 `apps/web/dist` Pages 制品
5. 部署到 GitHub Pages

当前定时表达式为 `0 * * * *`，即每小时整点执行一次。

## 维护入口

如果后续继续维护本项目，优先关注以下位置：

- [docs/site-structure.md](docs/site-structure.md)
  单站点抓取口径、栏目结构与接入记录。
- [docs/architecture.md](docs/architecture.md)
  模块边界与整体架构说明。
- [packages/source-registry/src](packages/source-registry/src)
  站点注册、`fetchTargets` 与 `parser` 实现。
- [scripts/generate-snapshot.ts](scripts/generate-snapshot.ts)
  快照生成入口。
- [apps/web/src/runtime/createAggregationService.ts](apps/web/src/runtime/createAggregationService.ts)
  Web 端运行时装配。

## 新增或调整站点时的建议流程

1. 先确认站点属于匿名可访问的公开信息源。
2. 在 `source-registry` 中补充或调整 `fetchTargets` 与 `parser`。
3. 为新增解析逻辑补齐最基本的测试。
4. 更新 [docs/site-structure.md](docs/site-structure.md)。
5. 重新执行 `npm run snapshot`、`npm test`、`npm run build`。

README 只保留项目整体视角；站点级细节、栏目级口径与复核记录不在这里展开。
