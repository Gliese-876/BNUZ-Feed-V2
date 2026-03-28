# BNUZH Feed 开发文档

## 1. 项目定位

`BNUZH Feed` 是一个面向北京师范大学珠海校区公开站点的信息聚合前端。项目目标不是重建校内业务系统，而是把公开网页中的通知、新闻和栏目内容整理成统一的信息流，并提供稳定的筛选、检索与回看入口。

当前仓库已经从“验证抓取链路是否可行”进入“持续维护可用产品”的阶段，现状如下：

- 工程基于 `React + TypeScript + Vite`，采用 monorepo 结构。
- `packages/source-registry/src/bnuzhSources.ts` 共登记 `45` 个站点。
- 其中 `43` 个站点已经接入真实 `fetchTargets` 与 `parser`，会参与前台展示、快照生成和官方搜索站点范围。
- 仍有 `2` 个站点保留为占位实现，不进入生产快照与前台筛选。
- 线上默认使用“静态快照 + GitHub Pages”模式，浏览器直抓仅保留给本地调试与回归排查。

站点级接入台账见 [site-structure.md](/C:/Users/86186/Documents/Code/BNUZ_Feed/docs/site-structure.md)。

## 2. 仓库结构

```text
apps/
  web/                  Vite Web 应用、页面 UI、运行时装配
packages/
  contracts/            共享类型、错误模型、Worker 协议
  core/                 标准化、去重、聚合、快照处理
  react-bindings/       FeedProvider 与 React hooks
  runtime-browser/      浏览器抓取、Worker、IndexedDB 存储
  runtime-snapshot/     /data/*.json 静态快照数据源
  source-registry/      站点注册表、fetchTargets、parser 实现
docs/
  architecture.md       本文档
  site-structure.md     已接入站点结构与复核记录
scripts/
  generate-snapshot.ts  生成 feed 快照与站点健康状态
```

职责边界保持不变：

- `contracts` 只定义协议，不承载实现。
- `core` 只关心聚合逻辑，不依赖 React，也不依赖具体站点。
- `source-registry` 只描述“抓什么、用哪个 parser”，不负责执行请求。
- `runtime-browser` 与 `runtime-snapshot` 负责把数据源接到统一聚合服务。
- `apps/web` 负责把服务装配成可运行的界面。

## 3. 当前运行链路

当前真实链路如下：

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

关键实现文件：

- [createAggregationService.ts](/C:/Users/86186/Documents/Code/BNUZ_Feed/apps/web/src/runtime/createAggregationService.ts)
- [generate-snapshot.ts](/C:/Users/86186/Documents/Code/BNUZ_Feed/scripts/generate-snapshot.ts)
- [bnuzhSources.ts](/C:/Users/86186/Documents/Code/BNUZ_Feed/packages/source-registry/src/bnuzhSources.ts)

运行时行为：

- `snapshot` 模式优先读取 `/data/feed-snapshot.json` 与 `/data/source-health.json`。
- `browser` 模式尝试浏览器端真实抓取，并在可用时通过 Worker 执行解析。
- `createLayeredAggregationService(...)` 会优先回放 `IndexedDB` 缓存，刷新成功后再写回本地。
- 主数据源失败且当前没有内存快照时，运行时回退到静态快照。

## 4. Web 前端当前形态

前端主入口位于 [App.tsx](/C:/Users/86186/Documents/Code/BNUZ_Feed/apps/web/src/App.tsx)，当前页面形态已经与早期版本不同，下面的描述以当前实现为准。

### 4.1 顶部操作区

顶部区域包含三类动作：

- “全站检索”：打开官方全文检索弹窗。
- “选择栏目”：打开信息源筛选抽屉。
- “更新内容”：触发刷新控制器，拉取最新聚合结果。

本地搜索框位于内容区工具栏，不在顶部弹窗里混用。

### 4.2 统一的“选择栏目”抽屉

当前所有屏幕尺寸统一使用同一套抽屉逻辑：

- 顶部始终显示“选择栏目”按钮。
- 桌面端原先常驻在左侧的筛选侧边栏已经删除。
- 抽屉面板 `source-panel` 在所有尺寸下都以覆盖层形式出现，不再占用页面左侧固定布局。
- 打开时使用 `is-open` 状态，关闭时先进入 `is-closing`，等待退场动画结束后再卸载。

相关实现：

- [App.tsx](/C:/Users/86186/Documents/Code/BNUZ_Feed/apps/web/src/App.tsx)
- [useOverlayPresence.ts](/C:/Users/86186/Documents/Code/BNUZ_Feed/apps/web/src/useOverlayPresence.ts)
- [styles.css](/C:/Users/86186/Documents/Code/BNUZ_Feed/apps/web/src/styles.css)

筛选行为本身没有改变：

- 默认全选全部可用站点与栏目。
- 站点与栏目勾选状态继续写入 `localStorage`。
- 内容过滤仍由 [feedIndex.ts](/C:/Users/86186/Documents/Code/BNUZ_Feed/apps/web/src/feedIndex.ts) 基于标题、摘要、站点名、栏目名执行前端匹配。

### 4.3 本地搜索

“搜索当前内容”仍然是本地过滤，不会请求官方全文搜索页：

- 数据源是当前 `snapshot.items`。
- 搜索索引由标题、摘要、站点名、栏目名拼接后统一做小写匹配。
- 站点筛选、栏目筛选和关键词过滤会共同作用于当前列表。

相关实现：

- [feedIndex.ts](/C:/Users/86186/Documents/Code/BNUZ_Feed/apps/web/src/feedIndex.ts)
- [useSourceSelection.ts](/C:/Users/86186/Documents/Code/BNUZ_Feed/apps/web/src/useSourceSelection.ts)
- [FadingTextInput.tsx](/C:/Users/86186/Documents/Code/BNUZ_Feed/apps/web/src/FadingTextInput.tsx)

### 4.4 官方全文检索弹窗

官方全文检索入口位于 [OfficialSearchDialog.tsx](/C:/Users/86186/Documents/Code/BNUZ_Feed/apps/web/src/OfficialSearchDialog.tsx)，当前实现约定如下：

- 弹窗只负责封装学校官方搜索表单，不在项目内抓取或重排官方搜索结果。
- 普通搜索会提交 `query`，并在新标签页打开官方结果页。
- 复合检索支持关键词、标题、正文、时间区间、每页条数和匹配方式。
- 站点范围来自当前公开可用的 `sourceCatalog`，会额外包含“所有站点”。
- 站点范围和匹配方式下拉框使用自定义浮层菜单，不再依赖原生 `<select>`。
- 日期输入继续使用浏览器原生 `input[type="date"]` 选择器，但页面上暴露的是统一的触发按钮；点击一次弹出原生日期选择器，再点一次关闭，不再出现年份文本被选中的问题。

提交逻辑位于 [siteSearch.ts](/C:/Users/86186/Documents/Code/BNUZ_Feed/apps/web/src/siteSearch.ts)：

- 普通关键词搜索不会再误带默认 `rows=10`，避免被官方页误判为复合检索。
- 只有在用户实际使用复合条件，或显式修改每页条数时，才会附带复合检索参数。

### 4.5 动效与弹层约定

当前所有主要弹层都采用显式的“保留挂载直到退场动画完成”策略，避免闪现：

- 全站检索弹窗
- 弹窗内自定义下拉菜单
- “选择栏目”抽屉
- 抽屉遮罩层

共享状态由 [useOverlayPresence.ts](/C:/Users/86186/Documents/Code/BNUZ_Feed/apps/web/src/useOverlayPresence.ts) 提供：

- `shouldRender` 控制组件在关闭后继续保留一段时间。
- `isClosing` 控制退场样式类名。
- 组件不会在 `open=false` 的同一帧立刻卸载。

这套约定是当前前端交互的基础假设。后续新增弹层时应复用同样模式，而不是回退到“状态一变就立即卸载”的做法。

## 5. 运行模式与配置

运行时配置位于 [config.ts](/C:/Users/86186/Documents/Code/BNUZ_Feed/apps/web/src/runtime/config.ts)。

- `VITE_FEED_SOURCE_MODE=snapshot` 时使用静态快照模式。
- 其余情况默认使用 `browser` 模式。
- `VITE_AUTO_REFRESH` 默认开启；显式传入 `0` 或 `false` 时关闭自动刷新。

当前默认配置仍然是：

- `sourceMode = snapshot`
- `autoRefresh = true`

这与现阶段的部署方式一致：线上优先保证稳定访问，本地再使用直抓模式做验证。

## 6. 站点接入约定

站点接入规范没有因为最近的 UI 改动而改变，仍遵守以下原则：

- 只抓匿名可访问的公开页面。
- 优先抓稳定的列表页，不优先抓首页拼装块。
- 只把标题、链接、时间序列稳定的栏目写入 `fetchTargets`。
- 相对链接统一基于 `page.finalUrl` 归一化为绝对链接。
- 多分页栏目应显式展开为多个 `fetchTargets`，而不是在 parser 内隐式翻页。
- 优先复用 `createConfiguredHtmlListParser`，只有在通用解析器不够时才写站点专用 parser。

站点接入详情继续统一维护在 [site-structure.md](/C:/Users/86186/Documents/Code/BNUZ_Feed/docs/site-structure.md)。

## 7. 测试与回归

当前与前端行为直接相关的回归点包括：

- [App.test.tsx](/C:/Users/86186/Documents/Code/BNUZ_Feed/apps/web/src/App.test.tsx)
  - 验证桌面端也使用抽屉浮层，而不是常驻左侧侧栏。
  - 验证抽屉关闭时会先进入退场状态。
- [OfficialSearchDialog.test.tsx](/C:/Users/86186/Documents/Code/BNUZ_Feed/apps/web/src/OfficialSearchDialog.test.tsx)
  - 验证官方搜索提交参数。
  - 验证复合检索输入框焦点行为。
  - 验证自定义下拉菜单和弹窗关闭时的保留挂载。
  - 验证日期选择触发按钮的 toggle 行为。
- [siteSearch.test.ts](/C:/Users/86186/Documents/Code/BNUZ_Feed/apps/web/src/siteSearch.test.ts)
- [feedIndex.test.ts](/C:/Users/86186/Documents/Code/BNUZ_Feed/apps/web/src/feedIndex.test.ts)

常用命令：

```bash
npm run check
npm test -- apps/web/src/App.test.tsx apps/web/src/OfficialSearchDialog.test.tsx apps/web/src/siteSearch.test.ts apps/web/src/feedIndex.test.ts
```

## 8. 维护约定

后续开发请继续遵守以下约定：

- 新增站点时，优先改 `packages/source-registry` 与对应测试，不要把抓取逻辑写进 UI。
- 新增弹窗、抽屉、下拉时，优先复用 `useOverlayPresence`，保持统一进退场行为。
- 官方全文检索只做表单封装，不在前端实现二次抓取、排序或缓存。
- 桌面与移动端尽量共享同一套交互逻辑，避免再分裂出两套筛选入口。
- `docs/site-structure.md` 继续维护站点接入事实，本文只维护架构、运行链路和交互约定。
