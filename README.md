# BNUZ Feed

北京师范大学珠海校区公开信息聚合阅读器。使用 React、TypeScript 和 Vite，提供站点与栏目筛选、本地搜索、官方全文检索及增量阅读。

- [在线访问](https://gliese-876.github.io/BNUZ-Feed-V2/)
- [仓库](https://github.com/Gliese-876/BNUZ-Feed-V2)
- [开发文档](docs/architecture.md)
- [站点接入及复核记录](docs/site-structure.md)

## 开发与验证

```bash
npm ci
npm run dev
```

```bash
npm run check          # TypeScript 与未使用代码检查
npm test               # 回归测试
npm run check:sources  # 联网对比官方站点清单
npm run snapshot       # 抓取并生成静态快照
node scripts/check-snapshot-health.cjs
npm run build          # 构建到 apps/web/dist
```

`npm run build:snapshot` 可以连续生成快照并构建。单独构建使用仓库中已有的快照；其数据时间显示在页面上。

## 数据与运行方式

站点清单以[校区官方全文搜索页](https://www.bnuzh.edu.cn/cms/web/search/index.jsp)的 `siteList` 为依据。可抓取来源、入口和解析器在 `packages/source-registry` 维护；暂无公开可抓内容的官方站点仍可从官方搜索入口访问。最新核验结果、站点结构变化和接入限制见 [站点文档](docs/site-structure.md)。

生产页面默认读取同源的 `data/feed-snapshot.json`，通过 IndexedDB 缓存。健康数据已嵌入快照，`source-health.json` 作为旧格式兼容文件。浏览器直抓调试模式按需载入解析器，跨站请求能否成功取决于源站的 CORS 配置。

快照生成先运行 Node 抓取，再对未健康来源启用浏览器补抓。后续轮次只重试失败来源，保留成功结果。超过重试上限仍不健康时退出失败，并保留上次有效快照。发布健康检查拒绝空快照和非 `live` 状态。

列表按规范化 URL 与标题去重。界面以瑞士国际主义排版为基础，融合孟菲斯几何与色彩点缀；“当前结果”显示合并重复项后的内容数，“原始收录”显示筛选命中的原始记录数；筛选面板按原始命中数统计，跨来源文章仍可在相应来源和栏目下筛中。筛选和搜索在本地运行，官方全文检索通过 POST 打开官方结果页。

默认展示**学生精选**，关注教务考试、奖助、校园招聘活动、讲座、国际交流与生活服务。可一键切换“全部信息”，或在“选择栏目”中建立“我的关注”；恢复默认会回到学生精选。已有自定义选择会保留。预设维护方式见 [学生精选](docs/student-collection.md)。

## 配置

| Web 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `VITE_FEED_SOURCE_MODE` | `snapshot` | `browser` 启用浏览器直抓调试 |
| `VITE_AUTO_REFRESH` | `true` | 启动后更新缓存数据 |
| `VITE_BASE_PATH` | `/` | 静态站点资源基础路径，如 `/BNUZ-Feed-V2/` |

| 快照变量（前缀 `BNUZ_FEED_SNAPSHOT_`） | 默认值 | 说明 |
| --- | --- | --- |
| `CONCURRENCY` | `6` | 来源并发数 |
| `TARGET_CONCURRENCY` | `3` | 每来源请求并发数 |
| `TIMEOUT_MS` | `5000` | Node 请求超时 |
| `BROWSER_TIMEOUT_MS` | 跟随 `TIMEOUT_MS` | 浏览器请求超时 |
| `NODE_MAX_ATTEMPTS` | `10` | 每轮 Node 补抓上限 |
| `BROWSER_MAX_ATTEMPTS` | `5` | 每轮浏览器补抓上限 |
| `ROUND_LIMIT` | `3` | 总轮数上限 |
| `RETRY_DELAY_MS` | `1500` | 同阶段补抓间隔 |
| `BROWSER_HOSTS` | 空 | 逗号分隔，指定改用浏览器导航的域名 |
| `BROWSER_CHANNEL` | 空 | Playwright 浏览器通道，如 `chrome` |
| `BROWSER_EXECUTABLE_PATH` | 空 | 自定义浏览器可执行文件 |

设置 `BROWSER_HOSTS` 后，本地需安装对应 Playwright 浏览器或指定系统 Chrome。没有匹配域名时不启动浏览器。

## 部署

[GitHub Actions 工作流](.github/workflows/refresh-web.yml)按北京时间每日 06:00 至 22:00，每 15 分钟生成快照并发布到 GitHub Pages，也支持手动触发。推送和手动触发会运行类型检查及测试。

工作流使用 Node 24 和 runner 预装的 Chrome，Playwright 不下载浏览器。来源并发为 `3`、每来源请求并发为 `2`，总轮数上限为 `2`，构建及快照步骤上限均为 15 分钟。工作流根据仓库名设置资源基础路径；只有快照生成、健康检查和构建成功才会部署。

## 目录

```text
apps/web/               WebUI、搜索索引、运行时装配
packages/contracts/     共享接口
packages/core/          标准化、去重、快照与聚合服务
packages/source-registry/  官方来源、抓取入口与解析器
packages/runtime-browser/ 浏览器抓取与 IndexedDB
packages/runtime-snapshot/ 同源快照读取
packages/react-bindings/  React 状态与订阅
scripts/                站点核验、快照生成、健康检查
docs/                   架构与站点记录
```

本项目用于学习、研究与个人信息整理，不代表学校或下属单位。通知、时间安排与附件请以原始来源页面为准。
