# 本地维护补丁（0.2.2-rc1-local）

本仓库是 [Derpyu520/qq-bridge](https://github.com/Derpyu520/qq-bridge) 的公开 fork，在官方 `v0.2.2-rc1` 上合入个人维护补丁。官方项目已停止维护，见根目录 [SUNSET.md](../../SUNSET.md)。本 fork 仅供非商业个人使用，许可仍为 PolyForm Noncommercial 1.0.0，须保留官方 `LICENSE` 与 Required Notice。

当前版本：`0.2.2-rc1-local`（2026-11-13 合入官方 `781e02f`，并补记本文档）。

## 相对官方 0.2.2-rc1 新增或保留的改动

### 卡片消息解析

新到的 OneBot `json` / `xml` / `share` / `music` / `location` / `contact` 段会解析成短摘要，格式为「[卡片] 来源：标题 摘要 链接」；解析失败时回退为 `[卡片消息]`。实现见 `src/card-message.js`，群聊/私聊与转发记录都会用到。历史里已经存成 `[卡片消息]` 的记录不会自动回填。测试：`npm run test-card`。

### 看图提醒

reserved2 组装唤醒包时，若本轮未读带 `hasMedia`、`[图片]` 或动画表情，会在【本次消息快照】之后插入看图提醒，要求先调用 `qq_get_message_images`（动画表情也可 `qq_get_sticker_image`），不能只凭占位文字或旧的「看不见」判断，也不能把占位说成工具结果。提醒在 JSON 之外，不占 `wakeMaxChars`。`qq_wait_for_messages` 本轮新消息和 `qq_get_unread_messages` 也会带上同样提醒。

### DSH 会话标题

桥接会把 DSH 侧栏标题改成「群 · {群名} · MM-DD」「私聊 · {备注或昵称} · MM-DD」「黑话学习 · MM-DD」（跨年用 YYYY-MM-DD，Asia/Shanghai）。优先好友备注；名称改名失败不会影响建会话。会话 follow 仍按官方 0.2.2 的顺序，等当前模式/preset 校验后再进行。

### 当前时间放到提示词末尾

`withSlangContext` 把【当前时间】放在投递文本最后，避免每轮变化的时间打穿前缀缓存。官方 0.2.2 里管理员私聊的媒体工具提示仍会保留，只是不再把时间放到开头。

### 收藏图压缩与工具白名单

收藏表情时可用 `compressImageForCollect` 压缩体积（`config.example.json` 增加 `maxCollectBytes`，默认 2621440）。DSH 工具限制白名单增加了上下文压缩工具 `compress`，以及 `tts_speak` / `tts_voices` / `tts_status` / `tts_play_builtin`。

### 预设提示词

二代预设补充了约 5 步的软限制（看图、搜索、斗图等必要多步时可以超过），以及语音路径：用户指定了要说的内容时，先 `tts_speak` 再 `qq_send_voice`；只说「发语音」但没指定文案时，使用语音库里的固定条目（以语音库和 `voices.presetAllowlist` 为准）。TTS 失败时直接用文字说明走不通，不用旧文件凑数。

合入时一度被本地旧预设盖掉的官方 0.2.2「会话隔离与不可信输入」「旧式发送工具禁令」已补回。

## 有意跟官方 0.2.2 的部分

回合出错或中止走官方的 `reportTurnFailure`：reserved2 不往 QQ 刷屏，其他模式 5 分钟内最多提醒一次。没有把本地 0.2.1-r7 里针对 1301 敏感内容退役会话的逻辑一并带过来。

## 未纳入本仓库的内容

`config.json`、`state/`、备份、语音文件和密钥都不会出现在这个仓库里，请只在本地工作副本中保留。
