# BNUZH Feed

`BNUZH Feed` 是一个用于聚合北京师范大学珠海校区公开站点信息的前端 monorepo。项目当前重点是把“站点抓取、列表解析、数据标准化、聚合去重、缓存回退、React 消费”这条链路做稳定，而不是先做完整业务 UI。

目前仓库里登记了 `45` 个公开站点，其中 `43` 个已经接入真实 `fetchTargets` 和 parser，Web 端提供的是一个最小运行壳层，用来手动触发刷新、查看聚合结果和站点健康状态。

## 目录概览

- `apps/web`：Vite 应用与运行时装配
- `packages/contracts`：共享类型和错误模型
- `packages/core`：标准化、去重、聚合服务
- `packages/source-registry`：站点清单、parser 注册表与具体站点实现
- `packages/runtime-browser`：浏览器抓取、Worker、IndexedDB 仓储
- `packages/runtime-snapshot`：静态快照数据源
- `packages/react-bindings`：React Provider 与 hooks
- `docs/architecture.md`：开发文档
- `docs/site-structure.md`：已接入站点结构表

## 本地运行

```bash
npm install
npm run dev
```

常用命令：

- `npm run check`：TypeScript 类型检查
- `npm test`：运行测试
- `npm run build`：构建 Web 应用

## 运行模式

- 默认是 `browser` 模式，直接抓取公开站点。
- 设定 `VITE_FEED_SOURCE_MODE=snapshot` 可切到快照模式。
- `VITE_AUTO_REFRESH=true` 可开启自动刷新；默认关闭。

快照文件位于 `apps/web/public/data/`，浏览器模式下的结果会写入 IndexedDB 作为缓存。

## 相关文档

- `docs/architecture.md`：项目定位、模块边界、运行链路和接入流程
- `docs/site-structure.md`：各站点的 `parserKey`、`fetchTargets` 与复核记录
- `BNUZH_PUBLIC_SITELIST.md`：公开站点原始清单
