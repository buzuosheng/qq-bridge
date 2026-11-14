# 更新日志

本文件记录 [buzuosheng/qq-bridge](https://github.com/buzuosheng/qq-bridge) 相对官方仓库的版本变化。与官方的功能差异总览见 [本地维护补丁](docs/guides/LOCAL_PATCHES.md)。

对照官方 `v0.2.2-rc1` 的代码差异：<https://github.com/Derpyu520/qq-bridge/compare/v0.2.2-rc1...buzuosheng:qq-bridge:main>。

## [0.2.2-rc2-local] - 2026-11-14

在 `0.2.2-rc1-local` 上补回现网 0.2.1-r7 的 1301 敏感内容退役会话逻辑，并与官方 `reportTurnFailure` 并存。

### 新增

- 遇到 z.ai 1301 / 敏感内容类错误时，清空该会话未读与近期窗口，退役本地 DSH 会话映射，下次唤醒重建干净上下文，并且不往 QQ 刷提示。其他回合出错或中止仍走官方 `reportTurnFailure`：reserved2 不刷屏，其他模式 5 分钟内最多提醒一次。

### 文档

- 更新 [本地维护补丁](docs/guides/LOCAL_PATCHES.md) 与 README 短列表，说明 1301 退役逻辑已纳入并与官方失败上报并存。

## [0.2.2-rc1-local] - 2026-11-13

基于官方 `v0.2.2-rc1`（`781e02f`）合入本地维护补丁。许可仍为 PolyForm Noncommercial 1.0.0。

### 新增

- 卡片消息解析：新到的 OneBot `json` / `xml` / `share` / `music` / `location` / `contact` 段会解析成「[卡片] 来源：标题 摘要 链接」短摘要；失败时回退为 `[卡片消息]`。历史里已经存成 `[卡片消息]` 的记录不会自动回填。
- 看图提醒：reserved2 唤醒快照在本轮未读含图片或动画表情时，要求先调用 `qq_get_message_images`（动画表情也可 `qq_get_sticker_image`），不能只凭占位文字判断。
- DSH 会话标题：侧栏显示「群 · {群名} · 日期」「私聊 · {备注或昵称} · 日期」「黑话学习 · 日期」（Asia/Shanghai）。
- 将【当前时间】移到投递文本末尾，减少前缀缓存被打穿。
- 收藏表情压缩（`maxCollectBytes`，默认 2621440），以及工具白名单中的 `compress`、`tts_speak` / `tts_voices` / `tts_status` / `tts_play_builtin`。
- 二代预设补充约 5 步软限制，以及「指定文案走 TTS」与「未指定时用语音库固定条目」的分流。

### 修复

- 合入时一度被本地旧预设盖掉的官方 0.2.2「会话隔离与不可信输入」「旧式发送工具禁令」已补回。

### 文档

- 增加 [本地维护补丁](docs/guides/LOCAL_PATCHES.md) 说明。
- 2026-11-14：增加本更新日志、README 中的改动短列表，以及本 fork 的分支 / PR 协作约定。

### 有意未纳入

- 未移植本地 0.2.1-r7 里针对 1301 敏感内容退役会话的逻辑；回合出错仍走官方 `reportTurnFailure`。
- `config.json`、`state/`、备份、语音文件和密钥不进入本仓库。
