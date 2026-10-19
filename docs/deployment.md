# GitHub Pages 部署

## 触发方式

- 推送 main：运行类型检查与测试，选择健康快照，构建并发布。代码更新不依赖校园源站此刻是否可访问。
- 手动运行：默认刷新 45 个公网来源，全部健康后发布；取消 `refresh_data` 可只发布代码。

原 GitHub Actions 定时触发已移除，工作流保持启用，仅保留推送 main 与手动触发。没有新增 Actions 或 Codex/ChatGPT AI 定时任务。客户端每 15 分钟同步读取已发布数据，不会触发服务器抓取或 Pages 发布。

代码发布会比较仓库与已发布快照的更新时间，选取满足当前来源目录、健康状态与条目格式要求的较新数据。读取线上副本时使用本次运行编号作为查询参数，避开 Pages CDN 沿用上一版缓存。线上副本读取失败时使用仓库副本；两个候选都无效时中止发布。保留旧数据时不修改其更新时间，超过 24 小时会输出诊断提示。

## 稳定性约束

云端刷新要求 45 个公网来源全部为 `live`，不发布部分失败或空快照。Node/浏览器阶段各最多 3/2 次尝试，后续轮次只处理失败来源，总轮数 2；请求超时分别为 10/15 秒。抓取步骤最多 10 分钟、构建 job 最多 14 分钟，失败日志作为 artifact 保留 7 天。

保卫办、实设办的域名只在校内 DNS 解析，公开 GitHub runner 无法抓取。两站保留官方目录与上次有效内容，健康状态明确标为 `snapshot`，保持原来的 `checkedAt`、`lastSuccessAt` 和条目 `fetchedAt`。这一例外仅限 [networkPolicy.json](../packages/source-registry/src/networkPolicy.json) 列出的两个来源，缺少有效内容或成功时间仍中止发布，其他来源不得以旧数据替代失败。保留时间超过 24 小时会输出提示。

每次刷新先在仓库和线上数据中选择有效基线，避免将较新的校内数据回退到旧仓库副本。在校内运行 `npm run snapshot` 仍会抓取全部 47 个来源；提交生成的两个数据文件即可更新校内来源基线。

推送与手动触发共用工作流并发组，运行中的任务不被后续触发取消。新任务可以替换等待中的旧任务；部署前再次核对 main 最新 SHA，旧提交跳过发布。Pages 资源路径及公开数据 URL 使用 configure-pages 的元数据，支持项目路径和根域名。

推送与手动触发都会运行 `validate`。部署 job 显式使用 `!cancelled()` 和 `needs.build.result == 'success'`，阻止失败构建或已取消任务发布。

运行镜像固定为 Ubuntu 24.04，避免 `ubuntu-latest` 的系统迁移改变浏览器环境。Node 安装、Pages 与 artifact 操作使用已确认的 Node 24 原生 Actions 版本，避免依赖已弃用的 Node 20 强制兼容运行。

主站及珠海管委会会在补抓阶段使用 Chromium 导航，保留正常证书校验。网络诊断保留底层错误原因，区分 DNS、连接与页面解析失败。

推送和手动触发时，验证 job 先检查第三方许可声明是否与锁文件同步。Web 构建自动准备 `legal/` 下的完整许可文件，并和 `data/NOTICE.txt` 一起上传 Pages artifact；PWA 同时缓存这些文本。缺少运行时许可正文或出现尚未审查的许可时中止构建。维护方式见 [开源许可说明](licensing.md)。

## 实验性云内纯脚本调度

`scripts/cloud-feed-scheduler.py` 使用 Python 标准库在当前云实例内等待并执行普通命令，每轮不调用模型、Codex 或 ChatGPT。北京时间（`Asia/Shanghai`）每天 06:00—22:00 每 15 分钟执行，包含 22:00，共 65 个时点。运行中不叠加下一轮；错过的时点不补跑，恢复后只等下一个未来时点。调度延迟超过 60 秒也跳过该时点。

这是**实验性云内纯脚本调度，不保证任务结束后继续运行**。实例暂停、回收或平台终止进程时，脚本随之停止；没有保活、自动重启实例、外部唤醒或自动续话。VM 文件状态可恢复不代表计算持续运行。本次实例没有 root/sudo，系统 cron 安装受到权限限制，因此使用 Python，不安装或管理全局服务。

需要 Python 3.11+、Node 24、可用的 Chromium，以及正常 Git 授权。运行目录必须在源码仓库外；以下命令在本次云实例使用 `/workspace/work/bnuz-feed-scheduler`：

```bash
# 新启动时立即完整刷新一次，然后等待标准时间表；重复 start 不会重复立即刷新。
python3 /workspace/BNUZ-Feed-V2/scripts/cloud-feed-scheduler.py start \
  --runtime-dir /workspace/work/bnuz-feed-scheduler \
  --repo /workspace/BNUZ-Feed-V2 --browser-executable /usr/bin/chromium --immediate

python3 /workspace/BNUZ-Feed-V2/scripts/cloud-feed-scheduler.py status \
  --runtime-dir /workspace/work/bnuz-feed-scheduler

# 幂等停止，只验证并终止本任务进程，不停止其他用户进程或全局服务。
python3 /workspace/BNUZ-Feed-V2/scripts/cloud-feed-scheduler.py stop \
  --runtime-dir /workspace/work/bnuz-feed-scheduler
```

状态保存在运行目录的 `status.json`，包含 PID、进程启动标识、启动时间、下一轮北京时间、最近一轮起止/结果/提交 SHA 和日志位置。`status` 同时核对 PID、UID、进程启动时间、脚本路径、运行目录和实例标识，避免把复用的 PID 误认为本任务。停止使用 Linux pidfd 发送 SIGTERM，运行中的子命令按其专属进程组清理；停止后再次启动需要显式执行 `start`。

运行目录还保存 `scheduler.log`、`runs/<轮次>/refresh.log`、`result.json` 和用于核对的基线/生成数据；这些均在 Git 仓库外。配置和日志不写凭据或代理认证头，不保存完整进程环境；后台仅继承现有受控代理、CA 信任及正常 Git 凭据。不得在配置中另放令牌或关闭证书校验。

每轮在独立 `checkout/` 中获取远端 main，依次运行 `snapshot:publish`、`snapshot`、原健康检查及校内内容保留断言。参数沿用上述 3/2 次尝试、2 轮、3/2 并发和 10/15 秒超时。依赖首次通过官方 npm registry 正常安装，只有本运行目录安装过且锁文件摘要与 Node 版本一致时才复用；锁文件变化则重新 `npm ci`，保留完整性校验。整个轮次默认最多 840 秒，可用 `--round-timeout` 缩短。

只有 45 个公网来源全为 `live`、两个校内来源内容及原成功时间保留时，才允许仅提交两个数据 JSON 并正常推送 main，由现有 Pages push 工作流发布。推送前复查远端提交和线上数据，发现更新则放弃本轮候选；不强推、不清理用户主工作区，也不在每轮重复运行完整测试套件。失败日志留存，普通网络/健康失败等待下一标准时点；明确权限、策略、额度拒绝会将状态置为 `halted` 并退出，不自动循环获取授权或重启。需要人工处理原因后审阅再配置新的运行目录。

实现校验：`python3 -m unittest discover -s scripts -p 'test_cloud_feed_scheduler.py'` 覆盖时间边界、跨日、漏点跳过、进程锁、超时、拒绝停止、健康失败禁止提交、远端竞争、依赖锁变化以及真实后台进程的启动/状态/停止幂等。首次上线还须观察后台脚本自行完成刷新推送，并核对该 SHA 对应的 Pages 实际部署和线上 JSON 摘要；单独看到 PID 不代表首轮验证成功。

## 历史故障记录

[定时运行 38246651911](https://github.com/Gliese-876/BNUZ-Feed-V2/actions/runs/38246651911) 于 2026-10-12 北京时间 20:03 启动，生成了更新时间为 20:05:53 的健康快照并上传 artifact，但 `deploy` 被跳过，整个运行仍显示成功。修正部署条件后，应同时核对部署 job、线上快照更新时间，不能只依据运行的绿色状态判断自动刷新完成。

旧失败运行 [30698540909](https://github.com/Gliese-876/BNUZ-Feed-V2/actions/runs/30698540909) 在抓取快照步骤失败：珠海管委会、旧知行、迎新网未收敛，后续构建与部署全部跳过。旧轮次还会重新抓取已成功来源。来源适配与重试链路已经修复；发布流程现在能够独立使用有效数据发布代码。

本次云端实测 [38203953637](https://github.com/Gliese-876/BNUZ-Feed-V2/actions/runs/38203953637) 已恢复 45 个公网来源；保卫办、实设办的 Chromium 导航明确返回 `ERR_NAME_NOT_RESOLVED`，本机校内 DNS 则返回内网地址，据此加入上述网络范围策略。

当时工作流还曾被标记为 `disabled_inactivity`。[GitHub 的规则](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/disable-and-enable-workflows)会在公共仓库 60 天无活动时自动停用定时工作流。当时使用以下命令恢复并发布；这段记录不表示当前仍有定时触发，现有工作流已移除 `on.schedule`：

```bash
gh workflow enable refresh-web.yml --repo Gliese-876/BNUZ-Feed-V2
gh workflow run refresh-web.yml --repo Gliese-876/BNUZ-Feed-V2 -F refresh_data=false
```

## 验证

快照选择具有回归测试，覆盖新旧数据选择、线上请求失败、目录不匹配、非健康状态、条目损坏及两个候选都无效。工作流通过 actionlint 检查；最终发布结果以对应提交的 Actions 运行和 Pages 线上响应为准。
