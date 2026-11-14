# qq-bridge

> [!IMPORTANT]
> **本项目已停止维护，并预计于 2026-11-18 归档。**
>
> 上游 SnowLuma 已停止公开服务，相关运行时不再提供；本项目无法继续维护。现有部署可能继续运行至不兼容为止，但不再提供新安装支持、兼容性适配或安全更新。详见 [SUNSET.md](SUNSET.md) 与 [归档公告](https://github.com/Derpyu520/qq-bridge/issues/180)。


> [!NOTE]
> **本仓库是 [Derpyu520/qq-bridge](https://github.com/Derpyu520/qq-bridge) 的公开 fork**，在官方 `v0.2.2-rc1` 上合入了本地维护补丁，版本为 `0.2.2-rc1-local`。上方官方停更说明仍然适用。本地改动见 [本地维护补丁](docs/guides/LOCAL_PATCHES.md)。

[English](README.en.md) · [安装指南](docs/guides/DSH_SETUP.md) · [本地维护补丁](docs/guides/LOCAL_PATCHES.md) · [更新日志](CHANGELOG.md) · [问题反馈](https://github.com/buzuosheng/qq-bridge/issues)

qq-bridge 是一个本地消息桥接工具，在 SnowLuma 提供的 **OneBot v11 接口**与 [DeepSeek Harness（DSH）](https://github.com/deepseek-ai/deepseek-harness) 之间转发消息事件和 AI 回复。

当前版本：`v0.2.2-rc1-local`（基于官方 `v0.2.2-rc1`），适配目标为 DSH `0.2.2-rc.1`。本地改动见 [本地维护补丁](docs/guides/LOCAL_PATCHES.md)，按版本记录见 [更新日志](CHANGELOG.md)。

## 这个 fork 改了什么

在官方 `v0.2.2-rc1` 上，本 fork 主要增加了：

- **卡片消息解析**：新到的 json / xml / share 等卡片段会变成短摘要
- **看图提醒**：未读里有图或动画表情时，必须先调用看图工具
- **会话标题**：DSH 侧栏显示「群 / 私聊 · 名称 · 日期」
- **时间后缀**：当前时间放到提示词末尾，减少缓存失效
- **压缩与白名单**：收藏图压缩，并放行 compress / TTS 相关工具
- **预设补强**：约 5 步软限制，以及指定文案与固定语音的分流

完整差异见 [本地维护补丁](docs/guides/LOCAL_PATCHES.md)，按版本的记录见 [更新日志](CHANGELOG.md)。与官方代码对照见 [compare](https://github.com/Derpyu520/qq-bridge/compare/v0.2.2-rc1...buzuosheng:qq-bridge:main)。协作方式见 [贡献指南](CONTRIBUTING.md#本-fork-的协作方式)。

> [!IMPORTANT]
> **qq-bridge 是独立维护的第三方工具，不是 SnowLuma 的子项目，也不隶属于 SnowLuma、DeepSeek 或腾讯 / QQ。**
> 本项目通过 SnowLuma 提供的 **OneBot v11 接口**互通；桥接与 SnowLuma 后端分别部署、独立维护，无隶属、合作或背书关系。OneBot v11 是公开协议，并非 SnowLuma 专有协议。
>
> **术语与边界**：本项目不向 QQ 客户端或 SnowLuma 进程注入、挂钩，不修改 SnowLuma 本体或其原生组件；但会读取本机 OneBot 配置与接入令牌、连接 OneBot 接口，并在 `npm install` 时修补本机 `@snowluma/sdk` 的 ESM 导入。文档中的“人格注入”指提示词写入，“提示注入”指不可信内容攻击；上游 `[Hook]` 仅指 SnowLuma 的接入机制，不是本项目的行为。

```text
QQ ↔ SnowLuma ↔ qq-bridge ↔ DeepSeek Harness ↔ 模型服务
             OneBot v11
```

## 能做什么

| 场景 | 功能 |
| --- | --- |
| 消息桥接 | 按群聊 / 私聊维护独立会话，支持文本、图片、表情与引用回复 |
| 聊天与仿真 | 普通聊天（`chat`）、两代群友仿真（`reserved` / `reserved2`）、自定义角色 |
| 个人助手 | `closed-agent` 仅限管理员私聊，可使用完整 DSH 工具；请谨慎开启 |
| 本地管理 | 控制台切换模式、管理白名单与审批、查看日志和模型用量 |

## 快速开始

准备好 **Windows 10 / 11、Node.js ≥ 22.13**（与 DSH 0.2.2 同机部署需 ≥24.9），以及以下两个独立运行的服务：

- **DSH Web**：当前有 `0.2.2-rc.1` 的验证记录（上一版为 `0.2.1-rc.2`），其他版本见[兼容范围](docs/guides/DSH_SETUP.md#兼容范围)。
- **SnowLuma**：请自行按[上游文档](https://github.com/SnowLuma/SnowLuma)安装、启动并登录，开启 OneBot **WebSocket 服务端**和 **HTTP API**。

### 1. 获取项目

在 PowerShell 中运行：

```powershell
git clone https://github.com/buzuosheng/qq-bridge.git
cd qq-bridge
npm install
Copy-Item config.example.json config.json
```

默认分支 `main` 是对外稳定分支，请不要直接在上面改；新改动请开功能分支，用 Pull Request 合入 `main`。协作约定见[贡献指南](CONTRIBUTING.md#本-fork-的协作方式)。

### 2. 填写配置

编辑 `config.json`，至少核对这些字段：

| 字段 | 填写内容 |
| --- | --- |
| `dsh.baseUrl` | DSH Web 地址，默认 `http://127.0.0.1:3080`；模型选择需与 DSH 中可用的配置一致 |
| `dsh.provider` / `model` / `reasoningEffort` | 模型提供方、模型名与思考强度；强度可使用 DSH 模型目录公布的档位，设为 `none` 表示不下发该字段、跟随模型默认 |
| `snowluma.wsUrl` / `httpUrl` | OneBot WebSocket / HTTP 地址，示例分别为 `ws://127.0.0.1:3001` / `http://127.0.0.1:3000`，不要混用端口 |
| `snowluma.accessToken` / `homeDir` | 按实际配置填写令牌与 SnowLuma 安装目录；HTTP、WS 令牌不同时，需能从该目录发现各自令牌 |
| `ownerQQ` | 你的管理员 QQ 号 |
| `allow.private` / `allow.groups` | 允许接入的 QQ 号 / 群号；默认空白名单不响应任何会话 |

同机运行时，`dsh.authToken` 通常留空，由桥接使用本机 DSH 凭据完成鉴权。完整配置与连接排查见[安装指南](docs/guides/DSH_SETUP.md)。

### 3. 安装 DSH 插件

```powershell
node scripts/setup-dsh.mjs
```

这一步会把聊天预设和 MCP 工具接入 DSH，**首次安装也必须执行**。完成后重启 DSH；使用非 `web` profile 时见[安装指南](docs/guides/DSH_SETUP.md#安装步骤)。

### 4. 启动并测试

```powershell
npm start
```

打开 [本地控制台](http://127.0.0.1:3100) 并输入控制台令牌。自动生成的令牌保存在 `state/console-token`；如果已在 `config.json` 配置 `consoleToken`，则使用该值。启动日志不会打印令牌。新装默认使用二代仿真模式（`reserved2`），会选择性发言；测试收发时可先切到 `chat`，再从白名单会话发送消息。

Windows 也可双击 `start.bat` 以守护模式运行，关闭窗口即停止。

## 文档与开发

| 我想…… | 入口 |
| --- | --- |
| 安装、升级或排查连接 | [DSH 安装指南](docs/guides/DSH_SETUP.md) |
| 了解模式、权限与管理命令 | [使用规则](RULES.md) |
| 查看模型用量与费用口径 | [用量看板](docs/guides/TOKEN_USAGE_CONSOLE.md) |
| 查看本 fork 的改动 | [本地维护补丁](docs/guides/LOCAL_PATCHES.md) · [更新日志](CHANGELOG.md) |
| 参与开发 | [贡献指南](CONTRIBUTING.md) · [安全基线](docs/guides/SECURITY_BASELINE.md) |
| 报告安全漏洞 | [安全报告](SECURITY.md) |
| 查找其他说明 | [文档索引](docs/README.md) |

在功能分支上开发，PR 请指向 `main`，提交前运行离线回归：

```powershell
npm run test:audit
```

## 使用边界与许可

- 仅在知情并获准的会话中使用，遵守平台规则；使用非官方 QQ 后端可能导致账号受限。
- 聊天内容会经 DSH 发送给所配置的模型服务；黑话自动研究默认开启，可能将提取的关键词发送给搜索服务。数据流与关闭方式见 [NOTICE](NOTICE.md#四数据传输)。
- 保护 `config.json`、`state/` 与控制台令牌，保持服务仅在本机可访问。
- DSH 离线期间的消息队列仅保存在内存中，每个会话最多 50 条；桥接进程退出后队列丢失，不保证送达。
- 本工具不实现 QQ 登录或底层协议，不安装、打包或启停 SnowLuma 后端；当前客户端仍依赖 `@snowluma/sdk` 等包，第三方组件适用各自条款。

当前代码按 [PolyForm Noncommercial 1.0.0](LICENSE) 提供，限非商业用途；`v0.2.1-r1` 及更早已发布版本沿用其发布时的 MIT 许可。第三方组件、独立关系与使用风险见 [NOTICE](NOTICE.md)。
