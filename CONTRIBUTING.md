# 参与贡献

> [!IMPORTANT]
> **本仓库是 [Derpyu520/qq-bridge](https://github.com/Derpyu520/qq-bridge) 的维护 fork。** 官方项目已停止维护。下方第 4、5 节里「改动直接提交到 `dev`、PR 指向 `dev`」是上游原来的做法，**在本 fork 中不再适用**。请先读「本 fork 的协作方式」。

## 本 fork 的协作方式

1. **不要直接在 `main` 上改。** `main` 是对外稳定分支。新工作请开功能分支（例如 `docs/fork-conventions`、`fix/...`），用 Pull Request 合入 `main`，即使只有维护者自己改也这样，方便对照和回看。
2. **不要改写已经推送的 `main` 历史**（不强制推送、不 rebase 已发布提交）。
3. 官方仓库可添加只读远程：`git remote add upstream https://github.com/Derpyu520/qq-bridge.git`。官方归档后通常不会再有新提交，不必频繁跟；**不要向 `upstream` 或 Derpyu520/qq-bridge 推送**。
4. 版本号沿用官方版本并加 `-local` 后缀，例如 `0.2.2-rc1-local`。发布时打对应 tag，并写 [GitHub Release](https://github.com/buzuosheng/qq-bridge/releases)。
5. 行为或补丁有变化时，同时更新 [CHANGELOG.md](CHANGELOG.md) 和 [本地维护补丁](docs/guides/LOCAL_PATCHES.md)（后者是相对官方的功能总览，前者按版本记录）。必要时同步 README 里的「这个 fork 改了什么」。
6. **不要提交**：`config.json`、`state/`、备份文件、语音文件、密钥，以及真实 QQ 号 / 群号 / 令牌 / 本机绝对路径。不要用 `git add .`：类似 `config.json.bak.*`、`src/bridge.js.bak.*` 的备份不一定被忽略规则挡住。
7. 外部贡献者的 PR 请指向 `main`。一个 PR 只做一件事；提交前运行 `npm run test:audit`。

克隆本 fork：

```bat
git clone https://github.com/buzuosheng/qq-bridge.git
cd qq-bridge
```

## 1. 环境

| 需要 | 版本 | 说明 |
| --- | --- | --- |
| Windows | 10 / 11 | 大量依赖 Windows 的 ACL、控制台编码与进程行为；Linux / macOS 不在支持范围 |
| Node.js | **>= 22.13** | 见 `package.json` 的 `engines`；与 DSH 0.2.2 同机部署需 >= 24.9 |
| npm | 随 Node | 仓库带 `package-lock.json`，请用它锁定版本 |

## 2. 本地跑起来

```bat
git clone https://github.com/buzuosheng/qq-bridge.git
cd qq-bridge
npm install
npm run test:audit
```

⚠️ **不要用 `npm ci --ignore-scripts`**。`postinstall` 会跑 `scripts/patch-snowluma-sdk.mjs`，
给 `@snowluma/sdk` 的相对导入补 `.js` 扩展名（这两个上游包自己的 ESM 打包有问题）。
跳过它，`test-snowluma-upstream-health.mjs` 会稳定失败——那是预期行为，不是你的改动坏了。

## 3. 测试

| 命令 | 环境要求 | 说明 |
| --- | --- | --- |
| `npm run test:audit` | 离线，无需 QQ / DSH | **提 PR 前必须跑**。fixtures + mock，不碰真实账号 |
| `npm run privacy-scan` | 无需额外环境 | 扫入库文件里的 token、本机路径、真实 QQ 号/群号（CI 会跑） |
| `npm run privacy-scan:history` | 需要完整 clone | 追加扫描全部 git 历史（发布前必跑，历史未清理时会报出已知泄漏） |
| `npm run verify:adaptation` | **需要活的 DSH** | DSH 协议适配对账（含活体回合），CI 里跑不了 |
| `npm run test:mcp-servers` | 离线 | 三个 MCP server 的工具清单 |
| `node src/self-test.js` | 仅需 DSH 在线 | DSH 会话、prompt 与事件流；不验证 QQ / SnowLuma 收发 |

`privacy-scan` 的规则文件 `scripts/privacy-rules.json` **不进仓库**（它本身会记录敏感判断依据）。
没有它时扫描只走内置默认规则；干净 clone 上应当**直接通过**（内置规则已把测试夹具与文档占位符排除）。
如果本机补了 `privacy-rules.json`（含你自己的真实 QQ 号/路径），扫描会在内置默认规则之上追加你的本地规则。

## 4. 提交 PR

**一个 PR 只做一件事。** 把 12 个不相关的修复塞进一个 PR，评审成本会高到没人看得完。
**对本 fork 而言，PR 的目标分支是 `main`**（见上方「本 fork 的协作方式」）。上游原先以 `dev` 为目标分支的说明仅作历史参考。

PR 里请写清楚：

1. **改了什么、为什么**（贴 issue 号更好）；
2. **怎么验证的**——贴 `npm run test:audit` 最后那行 `Audit suite: N/N scripts passed.`；
3. 有没有**行为变更**（配置项、工具名、端点、默认值）；有的话同步改 README / `docs/`。

新增行为请带回归脚本，并把它加进 `scripts/test-audit.mjs` 的清单——**不加进去的测试等于不存在**，
因为没人会记得手动跑它。

**不要提交**：真实 QQ 号 / 群号 / 昵称、任何 token 或密钥、本机绝对路径、`state/`、`node_modules/`。
`privacy-scan` 会拦一部分，但它不是万能网。

## 5. 维护者的合并方式

**本 fork 以 `main` 为对外稳定分支。** 维护者和外部贡献者都不要直接在 `main` 上提交，请走功能分支和 Pull Request。上游原先「维护者直接提交到 `dev`、PR 指向 `dev`」的做法不再使用。

- 你的 PR 合并进 `main` 前应有更新日志（如有行为变化）和 `npm run test:audit` 结果；
- PR 可能直接合并，也可能被讨论后调整再合；
- 想用当前发布内容，克隆后默认停留在 `main` 即可。

## 6. 许可

提交 PR 即表示你同意你的贡献按本仓库的
[PolyForm Noncommercial 1.0.0](LICENSE) 发布（许可范围与第三方组件声明见 [NOTICE.md](NOTICE.md)）。

如果你不能接受这一点（例如你的雇主对该代码有 CLA 或再许可要求），**请先开 issue 讨论**，
不要直接提 PR。

## 7. 安全

**不要用公开 issue 报漏洞。** 走 [SECURITY.md](SECURITY.md) 里的私密上报渠道。
