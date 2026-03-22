# BNUZ Feed V2

BNUZ Feed V2 是一个面向北京师范大学珠海校区公开信息站点的信息聚合项目。它会抓取并整理分散在不同子站中的通知、新闻、栏目页与公告内容，再通过一个适合日常使用的 Web 界面统一展示。

项目采用 `React + TypeScript + Vite` 的 monorepo 结构。生产环境默认使用“预抓取快照 + 同源静态发布”模式，以规避浏览器直接跨域抓站带来的 CORS 问题。前端对外展示名称保持为 `BNUZ Feed`，仓库名称为 `BNUZ Feed V2`。

## 在线访问

- GitHub Pages: [BNUZ Feed V2](https://abcabc123789456.github.io/BNUZ-Feed-V2/)
- 仓库地址: [abcabc123789456/BNUZ-Feed-V2](https://github.com/abcabc123789456/BNUZ-Feed-V2)
- 站点结构与接入记录: [docs/site-structure.md](docs/site-structure.md)
- 架构说明: [docs/architecture.md](docs/architecture.md)

## 项目概览

这个项目主要解决三个问题：

- 把校区多个公开站点的信息集中到一个阅读入口。
- 把抓取、解析、归并、缓存、发布做成可持续维护的工程链路。
- 让站点能稳定部署在静态托管环境中，而不是依赖用户浏览器直接跨站抓取。

## 当前范围

- 仓库中共记录 `45` 个站点来源。
- 当前生产链路使用其中 `43` 个公开可访问站点。
- 前台页面、快照生成和默认构建都只基于这 `43` 个可用站点。
- 当前不可访问的 `2` 个站点不会出现在前台筛选和搜索范围中。

## 核心能力

- 聚合多个 BNUZH 公开站点内容，并统一为单一信息流。
- 默认使用同源快照模式，避免前端直接跨域抓取造成失败。
- 支持按站点和栏目筛选，默认全选。
- 支持页面内搜索。
- 支持封装校区官方全文检索入口。
- 支持移动端抽屉式筛选和桌面端常驻侧栏。
- 支持系统主题切换。
- 支持本地缓存：
  快照数据写入 `IndexedDB`，筛选状态写入 `localStorage`。
- 支持 GitHub Actions 定时生成快照、构建并发布静态站点。

## 数据链路

```text
公开站点
  -> fetchTargets
  -> parser
  -> normalize
  -> dedupe / merge
  -> snapshot 或本地缓存
  -> React Web UI
```

## 运行模式

### `snapshot`

默认模式。前端只读取同源的快照文件：

- `/data/feed-snapshot.json`
- `/data/source-health.json`

### `browser`

调试模式。浏览器直接抓取公开站点，并在可用时通过 Worker 执行抓取与解析。这个模式只建议在本地调试时使用。

## 官方全文检索

项目已把校区官方全文检索页封装进聚合站顶部入口，支持：

- 所有站点 / 单站范围切换
- 基础关键词检索
- 精确 / 模糊匹配
- 复合检索
- 新标签页打开结果

官方检索入口来自：

- [北京师范大学珠海校区全文检索](https://www.bnuzh.edu.cn/cms/web/search/index.jsp)

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

| 命令 | 作用 |
| --- | --- |
| `npm run check` | TypeScript 类型检查 |
| `npm test` | 运行 `apps` 和 `packages` 下的测试 |
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

| 变量名 | 默认值 | 说明 |
| --- | --- | --- |
| `BNUZ_FEED_SNAPSHOT_CONCURRENCY` | `6` | 站点级并发数 |
| `BNUZ_FEED_SNAPSHOT_TARGET_CONCURRENCY` | `3` | 站点内抓取 / 解析并发数 |
| `BNUZ_FEED_SNAPSHOT_TIMEOUT_MS` | `12000` | 单请求超时时间，单位毫秒 |

## 部署方式

当前仓库默认采用“快照构建 + GitHub Pages 静态部署”。

首次启用时，需要在仓库 `Settings -> Pages -> Build and deployment -> Source` 中选择 `GitHub Actions`。

标准部署链路如下：

1. 执行 `npm run snapshot`
2. 执行 `npm run build`
3. 上传 `apps/web/dist`
4. 由 GitHub Actions 部署到 GitHub Pages

工作流会自动根据仓库名设置 `VITE_BASE_PATH`，因此项目型 Pages 地址 `/<repo>/` 与根域名 Pages 地址 `/` 都可以正确生成资源路径。

快照文件位于 `apps/web/public/data/`：

- `feed-snapshot.json`
- `source-health.json`

## 自动化更新

仓库内置 GitHub Actions 工作流 [refresh-web.yml](.github/workflows/refresh-web.yml)，用于：

- 手动触发构建
- 每 `6` 小时刷新一次快照
- 在主分支更新后构建并部署静态站点
- 将最新构建结果发布到 GitHub Pages

工作流的基本步骤如下：

1. `npm ci`
2. `npm run snapshot`
3. `npm run build`
4. 上传 `apps/web/dist` Pages 制品
5. 部署到 GitHub Pages

当前定时表达式为 `0 */6 * * *`，即每 `6` 小时整点执行一次。

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
  refresh-web.yml       定时生成快照、构建并部署 Web
```

## 维护入口

如果要继续维护这个项目，优先看这些位置：

- [docs/site-structure.md](docs/site-structure.md)：单站点抓取口径、栏目结构与接入记录
- [docs/architecture.md](docs/architecture.md)：模块边界与整体架构说明
- [packages/source-registry/src](packages/source-registry/src)：站点注册、`fetchTargets` 与 `parser` 实现
- [scripts/generate-snapshot.ts](scripts/generate-snapshot.ts)：快照生成入口
- [apps/web/src/runtime/createAggregationService.ts](apps/web/src/runtime/createAggregationService.ts)：Web 端运行时装配

## 新增或调整站点时的建议流程

1. 确认目标站点属于匿名可访问的公开信息源。
2. 在 `source-registry` 中补充或调整 `fetchTargets` 与 `parser`。
3. 为新增解析逻辑补齐基础测试。
4. 更新 [docs/site-structure.md](docs/site-structure.md)。
5. 重新执行 `npm run snapshot`、`npm test`、`npm run build`。

README 只保留项目整体视角；站点级细节、栏目级口径与复核记录不在这里展开。

## 免责声明

本项目仅用于学习、研究与个人信息整理，展示内容均来自北京师范大学珠海校区各公开网页的公开信息。

本项目不代表北京师范大学珠海校区及其下属单位的官方立场，也不构成任何官方发布渠道。具体通知、公告、时间安排与附件内容请以原始来源页面为准。

如果相关内容涉及版权、隐私、误抓取或其他不适宜展示的信息，请联系仓库维护者处理。
