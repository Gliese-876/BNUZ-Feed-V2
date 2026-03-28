# BNUZ Feed V2

BNUZ Feed V2 是一个面向北京师范大学珠海校区公开信息站点的聚合阅读项目。它会抓取并整理分散在不同公开站点中的通知、新闻与栏目内容，再通过统一的 Web 界面展示。

项目采用 `React + TypeScript + Vite` 的 monorepo 结构。线上默认使用“预抓取快照 + 同源静态发布”模式，避免浏览器直接跨站抓取带来的 CORS 问题。

本项目的需求梳理、代码实现、界面迭代、交互修复、文档维护与发布流程，均在 Codex 协作下以 Vibe Coding 方式完成。

## 在线访问

- GitHub Pages: [BNUZ Feed V2](https://abcabc123789456.github.io/BNUZ-Feed-V2/)
- 仓库地址: [abcabc123789456/BNUZ-Feed-V2](https://github.com/abcabc123789456/BNUZ-Feed-V2)
- 开发文档: [docs/architecture.md](docs/architecture.md)
- 站点结构与接入记录: [docs/site-structure.md](docs/site-structure.md)

## 当前范围

- 仓库中共登记 `45` 个站点来源。
- 当前生产链路使用其中 `43` 个公开可访问站点。
- 前台页面、快照生成和默认构建只基于这 `43` 个可用站点。
- 当前不可访问的 `2` 个站点不会出现在前台筛选和官方搜索范围中。

## 核心能力

- 聚合多个 BNUZH 公开站点内容，并统一为单一信息流。
- 默认使用同源快照模式，避免前端直接跨域抓取失败。
- 支持按站点和栏目筛选，默认全选。
- 支持页面内本地搜索。
- 支持封装校区官方全文检索入口。
- 支持统一的“选择栏目”抽屉浮窗，桌面端和小屏端使用同一套交互。
- 支持弹窗、下拉和抽屉的出现/消失动画，避免闪现。
- 支持本地缓存：快照数据写入 `IndexedDB`，筛选状态写入 `localStorage`。
- 支持 GitHub Actions 定时生成快照、构建并发布静态站点。

## Web 交互约定

### 本地搜索

- 页面中部“搜索当前内容”是对当前快照内容的前端过滤。
- 本地索引会综合标题、摘要、站点名和栏目名进行匹配。

### 选择栏目

- 所有屏幕尺寸都通过顶部“选择栏目”按钮打开筛选抽屉。
- 旧的大屏左侧常驻侧边栏已经移除。
- 抽屉默认隐藏，点击按钮后以覆盖层形式从左侧浮出。
- 关闭时会先进入退场状态，再回到隐藏态。

### 官方全文检索

- 顶部“全站检索”会打开 `OfficialSearchDialog`。
- 这个弹窗只是封装校区官方搜索页，不在项目内抓取或重排结果。
- 弹窗支持：
  - 所有站点或单站范围切换
  - 搜索词精确/模糊匹配
  - 复合检索中的关键词、标题、正文、时间区间、每页条数
  - 新标签页打开官方结果页
- 日期控件使用原生 `input[type="date"]`，通过触发按钮控制浏览器自带日期选择器。

### 动效

- 全站检索弹窗、弹窗内自定义下拉、栏目抽屉都使用显式的进入/退出状态。
- 关闭时不会立即卸载，而是先播放退场动画。

## 运行模式

### `snapshot`

默认模式。前端只读取同源快照文件：

- `/data/feed-snapshot.json`
- `/data/source-health.json`

### `browser`

调试模式。浏览器直接抓取公开站点，并在可用时通过 Worker 执行抓取与解析。这个模式只建议在本地调试时使用。

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
| `BNUZ_FEED_SNAPSHOT_TARGET_CONCURRENCY` | `3` | 站点内抓取/解析并发数 |
| `BNUZ_FEED_SNAPSHOT_TIMEOUT_MS` | `12000` | 单请求超时时间，单位毫秒 |

## 部署方式

当前仓库默认使用“快照构建 + GitHub Pages 静态部署”。

标准部署链路如下：

1. 执行 `npm run snapshot`
2. 执行 `npm run build`
3. 上传 `apps/web/dist`
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

## 维护入口

- [docs/architecture.md](docs/architecture.md)：模块边界、运行链路和前端交互约定
- [docs/site-structure.md](docs/site-structure.md)：站点级抓取入口、栏目结构与复核记录
- [packages/source-registry/src](packages/source-registry/src)：站点注册、`fetchTargets` 与 `parser`
- [scripts/generate-snapshot.ts](scripts/generate-snapshot.ts)：快照生成入口
- [apps/web/src/runtime/createAggregationService.ts](apps/web/src/runtime/createAggregationService.ts)：Web 端运行时装配

## 免责声明

本项目仅用于学习、研究与个人信息整理，展示内容均来自北京师范大学珠海校区各公开网页的公开信息。

本项目不代表北京师范大学珠海校区及其下属单位的官方立场，也不构成任何官方发布渠道。具体通知、公告、时间安排与附件内容请以原始来源页面为准。
