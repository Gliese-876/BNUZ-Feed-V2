# 开源许可维护

原创代码、文档、WebUI 图形和应用图标采用根目录 [MIT 许可证](../LICENSE)。版权署名使用仓库维护者 Gliese-876 和项目贡献者。八个项目包的 `license` 字段及锁文件中的对应条目均为 `MIT`；`private: true` 只防止意外发布 npm 包，不限制 MIT 许可授予的权利。

[NOTICE.md](../NOTICE.md) 说明第三方软件、抓取内容、名称与标识的许可边界。第三方内容仍保留来源 URL，并在 [data/NOTICE.txt](../apps/web/public/data/NOTICE.txt) 中单独说明。这些说明不替代原内容所需的使用授权，也不对依法不受著作权保护的事实增加限制。

## 第三方许可的生成

```bash
npm ci
npm run licenses:generate
npm run licenses:check
```

生成脚本从 `package-lock.json` 追踪 Web 工作区的外部依赖、必需的 peer 依赖，以及 Workbox 运行时模块的依赖。Workbox 由构建工具安装，虽在锁文件中标为开发依赖，其代码仍随 PWA 发布，因此单独纳入。Workbox 的一些可选功能未用于当前网站，其运行时许可也一并保留。

Vite 的模块预加载辅助代码、vite-plugin-pwa 的注册代码和 workbox-build 的生成模板也会进入客户端，因此保留这三个包的完整许可文件。仅收集这些构建工具的许可，不把它们的整棵 Node 开发依赖树误当作浏览器运行时。上游许可文件已经包含的依赖声明原样保留。

脚本读取安装包中的完整 LICENSE、COPYING、NOTICE 或第三方声明文件，保留原始版权与许可正文，仅规范化换行和行末空白；相同正文合并列出对应的包和版本。声明生成顺序固定，不写入本机路径或生成时间。

安装版本与锁文件不一致、缺少完整许可正文，或出现尚未审查的运行时许可证时，生成失败并中止构建。许可证白名单只表示已审查的许可标识，不能替代对新依赖来源、版权声明及其用途的审查。新的特殊许可需要检查后调整生成流程，不能用 MIT 文本代替缺失的第三方授权。

根目录 `THIRD_PARTY_NOTICES.txt` 随源码提交。更新依赖后应重新生成并提交其变化；CI 在构建之前运行 `licenses:check`，防止锁文件升级而声明仍是旧版本。

## 网站发布

Web 包的 `predev` 和 `prebuild` 自动生成以下公开文件：

- `legal/LICENSE.txt`：本项目 MIT 许可证；
- `legal/THIRD_PARTY_NOTICES.txt`：随附第三方软件的完整许可；
- `legal/NOTICE.txt`：项目许可范围。

`apps/web/public/legal/` 是忽略的生成目录，Vite 将其复制进 `dist/legal/`。网站页脚链接到这些文件，PWA 同时缓存这些许可文件以供离线访问。`data/NOTICE.txt` 随快照目录发布。复制或重新部署构建产物时，应一并保留这些文件，而非只保留压缩后的 JavaScript。

开发、测试和快照工具本体未随网站或本仓库完整分发，它们保持各自许可。例如 TypeScript 和 Playwright 使用 Apache-2.0，构建工具的 `caniuse-lite` 数据使用 CC-BY-4.0。若另行打包分发这些工具或数据，应审查并履行对应许可和署名要求。

## 参考文本

- [MIT 标准文本](https://opensource.org/license/mit)
- [GitHub 仓库许可说明](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository)
- [中华人民共和国著作权法](https://www.ncac.gov.cn/xxfb/flfg/flfg_532/202103/t20210309_50530.html)
