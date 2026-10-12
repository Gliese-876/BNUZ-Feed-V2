# GitHub Pages 部署

## 触发方式

- 推送 main：运行类型检查与测试，选择健康快照，构建并发布。代码更新不依赖校园源站此刻是否可访问。
- 定时运行：北京时间 06:00—22:00 每 15 分钟刷新公网来源，全部抓取成功后发布。
- 手动运行：默认与定时刷新相同；取消 `refresh_data` 可只发布代码。

代码发布会比较仓库与已发布快照的更新时间，选取满足当前来源目录、健康状态与条目格式要求的较新数据。读取线上副本时使用本次运行编号作为查询参数，避开 Pages CDN 沿用上一版缓存。线上副本读取失败时使用仓库副本；两个候选都无效时中止发布。保留旧数据时不修改其更新时间，超过 24 小时会输出诊断提示。

## 稳定性约束

云端刷新要求 45 个公网来源全部为 `live`，不发布部分失败或空快照。Node/浏览器阶段各最多 3/2 次尝试，后续轮次只处理失败来源，总轮数 2；请求超时分别为 10/15 秒。抓取步骤最多 10 分钟、构建 job 最多 14 分钟，失败日志作为 artifact 保留 7 天。

保卫办、实设办的域名只在校内 DNS 解析，公开 GitHub runner 无法抓取。两站保留官方目录与上次有效内容，健康状态明确标为 `snapshot`，保持原来的 `checkedAt`、`lastSuccessAt` 和条目 `fetchedAt`。这一例外仅限 [networkPolicy.json](../packages/source-registry/src/networkPolicy.json) 列出的两个来源，缺少有效内容或成功时间仍中止发布，其他来源不得以旧数据替代失败。保留时间超过 24 小时会输出提示。

每次刷新先在仓库和线上数据中选择有效基线，避免将较新的校内数据回退到旧仓库副本。在校内运行 `npm run snapshot` 仍会抓取全部 47 个来源；提交生成的两个数据文件即可更新校内来源基线。

所有触发共用工作流并发组，运行中的任务不被下一次定时器取消。新任务可以替换等待中的旧任务；部署前再次核对 main 最新 SHA，旧提交跳过发布。Pages 资源路径及公开数据 URL 使用 configure-pages 的元数据，支持项目路径和根域名。

运行镜像固定为 Ubuntu 24.04，避免 `ubuntu-latest` 的系统迁移改变浏览器环境。Node 安装、Pages 与 artifact 操作使用已确认的 Node 24 原生 Actions 版本，避免依赖已弃用的 Node 20 强制兼容运行。

主站及珠海管委会会在补抓阶段使用 Chromium 导航，保留正常证书校验。网络诊断保留底层错误原因，区分 DNS、连接与页面解析失败。

推送和手动触发时，验证 job 先检查第三方许可声明是否与锁文件同步。Web 构建自动准备 `legal/` 下的完整许可文件，并和 `data/NOTICE.txt` 一起上传 Pages artifact；PWA 同时缓存这些文本。缺少运行时许可正文或出现尚未审查的许可时中止构建。维护方式见 [开源许可说明](licensing.md)。

## 本次故障依据

旧失败运行 [30698540909](https://github.com/Gliese-876/BNUZ-Feed-V2/actions/runs/30698540909) 在抓取快照步骤失败：珠海管委会、旧知行、迎新网未收敛，后续构建与部署全部跳过。旧轮次还会重新抓取已成功来源。来源适配与重试链路已经修复；发布流程现在能够独立使用有效数据发布代码。

本次云端实测 [38203953637](https://github.com/Gliese-876/BNUZ-Feed-V2/actions/runs/38203953637) 已恢复 45 个公网来源；保卫办、实设办的 Chromium 导航明确返回 `ERR_NAME_NOT_RESOLVED`，本机校内 DNS 则返回内网地址，据此加入上述网络范围策略。

工作流另被标记为 `disabled_inactivity`。[GitHub 的规则](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/disable-and-enable-workflows)会在公共仓库 60 天无活动时自动停用定时工作流。恢复命令：

```bash
gh workflow enable refresh-web.yml --repo Gliese-876/BNUZ-Feed-V2
gh workflow run refresh-web.yml --repo Gliese-876/BNUZ-Feed-V2 -F refresh_data=false
```

## 验证

快照选择具有回归测试，覆盖新旧数据选择、线上请求失败、目录不匹配、非健康状态、条目损坏及两个候选都无效。工作流通过 actionlint 检查；最终发布结果以对应提交的 Actions 运行和 Pages 线上响应为准。
