# BNUZ Feed V2

BNUZ Feed V2 是一个面向北京师范大学珠海校区公开信息站点的聚合阅读项目。它会从多个公开网页中提取通知、新闻和栏目内容，生成统一的信息流，并通过静态 Web 站点提供浏览、筛选和搜索入口。

项目采用 `React + TypeScript + Vite` 的 monorepo 结构。线上默认使用“预生成快照 + 同源静态发布”模式，以避免浏览器直接跨站抓取带来的 CORS 与稳定性问题。

项目的需求梳理、实现迭代与文档维护主要在 `Codex` 协作下以 `Vibe Coding` 方式推进。

## 在线访问

- GitHub Pages: [BNUZ Feed V2](https://abcabc123789456.github.io/BNUZ-Feed-V2/)
- 仓库地址: [abcabc123789456/BNUZ-Feed-V2](https://github.com/abcabc123789456/BNUZ-Feed-V2)
- 开发文档: [docs/architecture.md](docs/architecture.md)
- 站点结构与接入记录: [docs/site-structure.md](docs/site-structure.md)

## 功能概览

- 聚合多个 BNUZH 公开站点的通知、新闻和栏目内容
- 按站点和栏目筛选内容
- 对当前快照执行本地搜索
- 提供校区官方全文检索入口
- 生产环境默认读取静态快照，浏览器端抓取仅用于调试
- 通过 GitHub Actions 定时生成快照并部署到 GitHub Pages

## 工作方式

### 生产模式

生产环境默认读取两个静态文件:

- `/data/feed-snapshot.json`
- `/data/source-health.json`

这些文件由 `npm run snapshot` 预先生成，并随站点一同发布。前端会在运行时把结果缓存到 `IndexedDB`，以加快启动速度并提供失败回退能力。

### 调试模式

将 `VITE_FEED_SOURCE_MODE` 设为 `browser` 后，前端会尝试在浏览器中直接抓取公开站点。这个模式适合本地调试 parser 或排查抓取问题，不建议作为线上默认模式。

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

### 快照生成

快照脚本支持并发抓取、失败重试和增量补抓，可通过以下变量调整行为:

| 变量名 | 默认值 | 说明 |
| --- | --- | --- |
| `BNUZ_FEED_SNAPSHOT_CONCURRENCY` | `6` | 站点级并发数 |
| `BNUZ_FEED_SNAPSHOT_TARGET_CONCURRENCY` | `3` | 站点内抓取/解析并发数 |
| `BNUZ_FEED_SNAPSHOT_TIMEOUT_MS` | `12000` | 单请求超时时间，单位毫秒 |
| `BNUZ_FEED_SNAPSHOT_MAX_ATTEMPTS` | `3` | 单个站点在一次快照生成中的最大尝试次数 |
| `BNUZ_FEED_SNAPSHOT_RETRY_DELAY_MS` | `1500` | 两轮补抓之间的等待时间，单位毫秒 |

## 部署

当前仓库默认使用“生成快照 + 构建静态站点 + GitHub Pages 发布”的方式部署:

1. 执行 `npm run snapshot`
2. 执行 `npm run build`
3. 发布 `apps/web/dist`
4. 由 GitHub Actions 部署到 GitHub Pages

工作流会根据仓库名自动设置 `VITE_BASE_PATH`，因此项目型 Pages 地址 `/<repo>/` 与根域名 Pages 地址 `/` 都可以正确生成资源路径。

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
  architecture.md       开发文档
  site-structure.md     站点结构、栏目口径、接入记录
.github/workflows/
  refresh-web.yml       定时生成快照、构建并部署 Web
```

## 进一步阅读

- [docs/architecture.md](docs/architecture.md): 模块边界、运行链路和开发约定
- [docs/site-structure.md](docs/site-structure.md): 站点接入结构、栏目说明和复核记录
- [scripts/generate-snapshot.ts](scripts/generate-snapshot.ts): 快照生成入口
- [apps/web/src/runtime/createAggregationService.ts](apps/web/src/runtime/createAggregationService.ts): Web 端运行时装配

## 免责声明

本项目仅用于学习、研究与个人信息整理，展示内容均来自北京师范大学珠海校区各公开网页的公开信息。

本项目不代表北京师范大学珠海校区及其下属单位的官方立场，也不构成任何官方发布渠道。具体通知、公告、时间安排与附件内容请以原始来源页面为准。
