# GitHub Pages 部署

## 触发方式

- 推送 main：运行类型检查与测试，选择健康快照，构建并发布。代码更新不依赖校园源站此刻是否可访问。
- 定时运行：北京时间 06:00—22:00 每 15 分钟抓取并生成快照，全健康后发布。
- 手动运行：默认与定时刷新相同；取消 `refresh_data` 可只发布代码。

代码发布会比较仓库与已发布快照的更新时间，选取满足当前来源目录、健康状态与条目格式要求的较新数据。线上副本读取失败时使用仓库副本；两个候选都无效时中止发布。保留旧数据时不修改其更新时间，超过 24 小时会输出诊断提示。

## 稳定性约束

全量刷新保留严格健康检查，不发布部分失败或空快照。Node/浏览器阶段各最多 3/2 次尝试，后续轮次只处理失败来源，总轮数 2；请求超时分别为 10/15 秒。抓取步骤最多 10 分钟、构建 job 最多 14 分钟，失败日志作为 artifact 保留 7 天。

所有触发共用工作流并发组，运行中的任务不被下一次定时器取消。新任务可以替换等待中的旧任务；部署前再次核对 main 最新 SHA，旧提交跳过发布。Pages 资源路径及公开数据 URL 使用 configure-pages 的元数据，支持项目路径和根域名。

## 本次故障依据

最近失败运行 [30698540909](https://github.com/Gliese-876/BNUZ-Feed-V2/actions/runs/30698540909) 在抓取快照步骤失败：珠海管委会、旧知行、迎新网未收敛，后续构建与部署全部跳过。旧轮次还会重新抓取已成功来源。来源适配与重试链路已经修复；发布流程现在能够独立使用有效数据发布代码。

工作流另被标记为 `disabled_inactivity`。[GitHub 的规则](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/disable-and-enable-workflows)会在公共仓库 60 天无活动时自动停用定时工作流。恢复命令：

```bash
gh workflow enable refresh-web.yml --repo Gliese-876/BNUZ-Feed-V2
gh workflow run refresh-web.yml --repo Gliese-876/BNUZ-Feed-V2 -F refresh_data=false
```

## 验证

快照选择具有回归测试，覆盖新旧数据选择、线上请求失败、目录不匹配、非健康状态、条目损坏及两个候选都无效。工作流通过 actionlint 检查；最终发布结果以对应提交的 Actions 运行和 Pages 线上响应为准。
