# 云电脑单次刷新与构建

`scripts/cloud-feed-refresh-once.py` 是供外部已授权调度调用的一次性命令。它**不创建定时器、不驻留后台、不推送 Git、不修改 Pages 配置**。当前 Pages 仍由既有 push 工作流发布；仅看本脚本成功不能视作 Pages 已更新。

```bash
BNUZ_FEED_RUNTIME_DIR=/workspace/scratch/25c5eeba4bb1/bnuz-runtime \
  python3 /workspace/scratch/25c5eeba4bb1/bnuz-feed-v2/scripts/cloud-feed-refresh-once.py
```

仓库路径由脚本位置解析；默认运行目录为仓库同级的 `bnuz-runtime`。运行目录必须位于源码外。需要仓库支持的 Node 版本、Python 3.11+、`/usr/bin/chromium` 和正常公网访问。依赖来自锁文件，npm 缓存位于运行目录，不要求写入用户主目录。脚本通过 `node --import tsx` 运行 TypeScript，避免 tsx CLI 使用额外 IPC socket。

## 每轮行为与产物

1. 取得排他 `refresh.lock`，重叠触发返回 `skipped_busy`；最多运行 840 秒。
2. 只清理本任务专用 checkout 上两份生成数据的改动；任何其他已追踪/未追踪改动会停止，不清理用户文件。通过 `fetch` 和 `merge --ff-only` 更新 main，不强推、不重置历史。
3. 锁文件或 Node 版本改变时重新 `npm ci`；代码提交或依赖改变时重新运行许可、类型与全部测试。
4. 选取线上/仓库较新的有效快照，保存基线，刷新 45 个公网来源。两个校内来源仅保留已经公开发布的原内容和成功时间；不尝试登录或访问校内网络。除下述明确等待授权并保留基线的来源外，任何公网来源不健康则不生成可发布结果。
5. 运行原健康检查及校内内容保留断言，以 `/BNUZ-Feed-V2/` 构建。构建完成再次核对远端 main 未变化。
6. 结果保存在 `runs/<UTC时间-随机标识>/`：脱敏 `refresh.log`、基线、两份生成 JSON、完整 `dist/`、每个文件大小与 SHA-256 的 `result.json`。`status.json` 是最近一轮结果；`latest-ready.json` 仅指向最后一个成功候选。

`ready_refreshed` 代表完成本轮新抓取和构建，`ready_existing_snapshot` 仅代表 `--build-only` 构建了既有数据。**`published` 始终为 `false`**；发布操作由调用方另行执行。

普通失败保留上一份可发布结果；明确访问、权限、策略或额度拒绝写入 `HALTED.json`，之后不会自动重试，必须先人工审阅原因。日志不保存完整环境、令牌或认证头。

## 连接器发布约束

只有 `ready_refreshed` 且基线、所有未跳过的公网 live 来源及全部保留来源断言通过的候选可按刷新任务发布。发布前必须重新确认远端 main 仍等于 `sourceCommit`，并检查线上 `updatedAt`，避免旧候选覆盖新数据。使用连接器原子提交两份生成 JSON（必要时与本脚本/说明的首次安装一并提交），更新 ref 时使用 `expected_sha`；遇到竞争先重读，禁止强推。

提交后须核对精确提交 SHA 对应的 Pages 部署，以及公开 `data/feed-snapshot.json` 的时间和 SHA-256，再报告成功。当前配置仍依赖 GitHub 的 Pages 发布设施；即便改用分支发布，也不能声称完全不经过 GitHub 内置部署。

## 持续运行限制

本脚本本身没有调度、保活、实例唤醒或自动恢复功能。运行目录留存不等于云实例连续运行；实例暂停、回收或授权过期会阻止执行。每 15 分钟调度须由可持续唤醒此任务的外部平台负责，且不能承诺严格整点或服务器级 SLA。未确认调度实际触发并完成线上验证前，不能把它称为稳定运行的服务器。

## 单个来源等待授权时继续运行

用户允许当前来源列表的公开通知抓取；这不授权登录或绕过校园网、安全限制。
若某个来源收到明确权限拒绝，调用方应停止该次受拒绝操作、保留拒绝证据，并确认没有仍在运行的刷新进程。
只对能准确归属到现有公网来源的授权问题，在运行目录的 `source-authorization-blocks.json` 写入该来源 ID 的 JSON 数组，例如：

```json
["70981c669ee748c4ba5dcd4022a42f58"]
```

此文件由调用方根据授权状态维护；不得从网页内容、普通超时或未知错误自动生成。没有文件等同空数组。
未知 ID、校内 ID、重复 ID、非数组及跳过所有公网来源均失败关闭。
必须持有覆盖整轮的发布锁修改此策略，不能在运行中修改。

被列出的来源在任何抓取/浏览器重试阶段之前排除，保留基线公开内容、原 checkedAt/lastSuccessAt，状态为 `snapshot`，并明确标记 `retentionReason: authorization_required`。
其余公网来源仍必须全部 live；两个校内源保留断言不变，新增的授权保留源也执行严格基线内容及时间证明。缺少可靠旧数据不会伪造可发布候选。
仅在确有至少一个公网来源完成刷新且所有检查通过时返回 `ready_refreshed`；结果中的 `authorizationSkippedSourceIds` 与 `snapshot.live` 明示本轮范围。
现有 Pages 工作流无需修改，健康检查接受显式标记且有有效旧数据的授权保留来源，不接受任意公共源降级。

来源级授权阻塞不应写入全局 `HALTED.json`，也不应暂停调度。已有来源级 HALTED 只能在核对证据并迁移到上述明确 ID 策略后归档，不能无条件删除。
GitHub 发布权限、无法定位到单个来源的拒绝、代码/文件安全问题等仍保持全局停止语义。
收到明确恢复授权后，调用方在锁内移除相应 ID；下一轮重新抓取成功即恢复 live。不要发布上轮旧候选。
