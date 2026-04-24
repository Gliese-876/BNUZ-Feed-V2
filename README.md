# BNUZ Feed V2

BNUZ Feed V2 是一个面向北京师范大学珠海校区公开信息站点的聚合阅读项目。它会从多个公开网页中提取通知、新闻、活动和栏目内容，整理成统一的信息流，并通过静态 Web 站点提供浏览、筛选和搜索入口。

项目采用 `React + TypeScript + Vite` 的 monorepo 结构。线上默认使用“预生成快照 + 同源静态发布”模式，避免浏览器直接跨站抓取带来的 `CORS` 和稳定性问题。项目的需求梳理、实现迭代和文档维护主要在 `Codex` 协作下以 `Vibe Coding` 方式推进。

## 在线访问

- GitHub Pages: [BNUZ Feed V2](https://gliese-876.github.io/BNUZ-Feed-V2/)
- 仓库地址: [Gliese-876/BNUZ-Feed-V2](https://github.com/Gliese-876/BNUZ-Feed-V2)
- 开发文档: [docs/architecture.md](docs/architecture.md)
- 站点结构与接入记录: [docs/site-structure.md](docs/site-structure.md)

## 功能概览

- 聚合多个 BNUZH 公开站点的通知、新闻、活动和栏目内容
- 按站点和栏目筛选内容
- 对当前快照执行本地搜索
- 在顶部显示“去重后条数（原始条数）”
- 在“选择栏目”侧栏按去重前原始命中数显示站点和栏目计数
- 提供校区官方全文搜索入口
- 线上默认读取静态快照，浏览器直抓仅用于本地调试
- 通过 GitHub Actions 按北京时间每日 `06:00` 至 `22:00` 每 `15` 分钟生成快照并部署到 GitHub Pages

## 工作方式

### 生产模式

生产环境默认读取两个静态文件：

- `/data/feed-snapshot.json`
- `/data/source-health.json`

这些文件由 `npm run snapshot` 预先生成，并随站点一同发布。前端会在运行时把结果缓存到 `IndexedDB`，用于启动加速和失败回退。

### 快照生成

当前快照脚本不是单轮全抓后直接结束，而是：

1. 先跑 `node fetch` 阶段，对失败源做稳定化补抓。
2. 如果仍有非 `live` 源，再只对这些源启用浏览器补全。
3. 一整轮仍未收敛时，重新开启下一整轮。
4. 超过整轮上限仍未收敛则直接失败，不部署坏快照。

线上 GitHub Actions 还会在构建阶段执行健康检查；只要仍存在 `partial` 或其他非 `live` 源，就会中止部署。

### 调试模式

把 `VITE_FEED_SOURCE_MODE` 设为 `browser` 后，前端会尝试在浏览器中直接抓取公开站点。这个模式适合本地调试 parser 或排查抓取问题，不建议作为线上默认模式。

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 本地开发

```bash
npm run dev
```

### 3. 生成快照

```bash
npm run snapshot
```

### 4. 构建生产版本

```bash
npm run build
```

## 常用命令

| 命令 | 作用 |
| --- | --- |
| `npm run check` | TypeScript 类型检查 |
| `npm test` | 运行测试 |
| `npm run snapshot` | 抓取公开站点并生成快照文件 |
| `npm run build` | 构建 Web 应用 |
| `npm run build:snapshot` | 先生成快照，再构建生产包 |

## 环境变量

### Web 运行时

| 变量名 | 默认值 | 说明 |
| --- | --- | --- |
| `VITE_FEED_SOURCE_MODE` | `snapshot` | 设为 `browser` 时启用浏览器直抓调试模式 |
| `VITE_AUTO_REFRESH` | `true` | 页面进入后是否自动刷新当前数据源 |

### 快照脚本默认值

以下默认值来自 [generate-snapshot.ts](scripts/generate-snapshot.ts)：

| 变量名 | 默认值 | 说明 |
| --- | --- | --- |
| `BNUZ_FEED_SNAPSHOT_CONCURRENCY` | `6` | 源级并发数 |
| `BNUZ_FEED_SNAPSHOT_TARGET_CONCURRENCY` | `3` | 源内抓取和解析并发数 |
| `BNUZ_FEED_SNAPSHOT_TIMEOUT_MS` | `5000` | `node fetch` 单请求超时，单位毫秒 |
| `BNUZ_FEED_SNAPSHOT_BROWSER_TIMEOUT_MS` | `5000` | 浏览器抓取单请求超时，默认与 `TIMEOUT_MS` 一致 |
| `BNUZ_FEED_SNAPSHOT_NODE_MAX_ATTEMPTS` | `10` | 单轮 `node` 阶段内每个失败源的最大尝试次数 |
| `BNUZ_FEED_SNAPSHOT_BROWSER_MAX_ATTEMPTS` | `5` | 单轮浏览器补全阶段内每个失败源的最大尝试次数 |
| `BNUZ_FEED_SNAPSHOT_ROUND_LIMIT` | `3` | 整轮上限；超过后脚本失败 |
| `BNUZ_FEED_SNAPSHOT_RETRY_DELAY_MS` | `1500` | 同一阶段内两次尝试之间的等待时间 |
| `BNUZ_FEED_SNAPSHOT_BROWSER_HOSTS` | 空 | 命中这些 host 时，浏览器阶段改用 Chromium 抓取 |

### GitHub Actions 当前覆盖值

云端工作流目前会覆盖以下参数：

- `BNUZ_FEED_SNAPSHOT_CONCURRENCY=3`
- `BNUZ_FEED_SNAPSHOT_TARGET_CONCURRENCY=2`
- `BNUZ_FEED_SNAPSHOT_TIMEOUT_MS=5000`
- `BNUZ_FEED_SNAPSHOT_BROWSER_TIMEOUT_MS=5000`
- `BNUZ_FEED_SNAPSHOT_NODE_MAX_ATTEMPTS=10`
- `BNUZ_FEED_SNAPSHOT_BROWSER_MAX_ATTEMPTS=5`
- `BNUZ_FEED_SNAPSHOT_ROUND_LIMIT=3`
- `BNUZ_FEED_SNAPSHOT_RETRY_DELAY_MS=5000`
- `BNUZ_FEED_SNAPSHOT_BROWSER_HOSTS=www.bnuzh.edu.cn`

自动刷新计划当前为：北京时间每日 `06:00` 开始每 `15` 分钟执行一次，`22:00` 为最后一次触发。

## 部署

当前仓库默认使用“生成快照 + 构建静态站点 + GitHub Pages 发布”的方式部署：

1. 执行 `npm run snapshot`
2. 执行 `node scripts/check-snapshot-health.cjs`
3. 执行 `npm run build`
4. 发布 `apps/web/dist`

工作流会根据仓库名自动设置 `VITE_BASE_PATH`，因此项目型 Pages 地址 `/<repo>/` 与根域名 Pages 地址 `/` 都可以正确生成资源路径。

## 仓库结构

```text
apps/
  web/                  Web 应用、页面 UI、运行时装配
packages/
  contracts/            共享类型、错误模型、快照契约
  core/                 聚合、去重、原始计数与快照处理
  react-bindings/       FeedProvider 与 React Hooks
  runtime-browser/      浏览器抓取、Worker、IndexedDB 存储
  runtime-snapshot/     同源快照数据源
  source-registry/      站点注册、fetchTargets、parser 实现
scripts/
  generate-snapshot.ts  快照生成入口
  snapshotStrategy.ts   快照轮次策略
docs/
  architecture.md       开发文档
  site-structure.md     站点结构、栏目口径、接入记录
.github/workflows/
  refresh-web.yml       按北京时间每日 06:00-22:00 每 15 分钟生成快照、构建并部署 Web
```

## 进一步阅读

- [docs/architecture.md](docs/architecture.md): 模块边界、运行链路、快照策略和前端约定
- [docs/site-structure.md](docs/site-structure.md): 站点接入结构、栏目说明和复核记录
- [scripts/generate-snapshot.ts](scripts/generate-snapshot.ts): 快照生成入口
- [apps/web/src/runtime/createAggregationService.ts](apps/web/src/runtime/createAggregationService.ts): Web 端运行时装配

## 免责声明

本项目仅用于学习、研究与个人信息整理，展示内容均来自北京师范大学珠海校区各公开网页的公开信息。

本项目不代表北京师范大学珠海校区及其下属单位的官方立场，也不构成任何官方发布渠道。具体通知、公告、时间安排与附件内容请以原始来源页面为准。
