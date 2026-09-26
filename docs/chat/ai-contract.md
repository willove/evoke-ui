# @wil-works/evoke-chat AI 使用说明（v0.2.0）

> 本页由 `packages/evoke-chat/scripts/gen-ai-docs.mjs` 自动生成，勿手改（改了会被构建门拦下）。

> 给 AI 读：先看「硬规则」，再按「任务配方」找 API，最后用逐组件表核对字段名。
> 完整散文文档见 [对话窗口](/chat/chatbot)；同内容的结构化契约见 [evoke-chat.components.json](/ai/evoke-chat.components.json)。

## 硬规则

1. 组件只做呈现，**任何请求都由宿主注入**（transport / fetch / SDK），包内不发网络请求。
2. 流式回写一律用 `appendContent` / `appendThinkContent`（自动转 streaming），不要自己拼字符串。
3. 用户主动停止是 `cancelled`（`cancelMessage`），不是 `error`；中断后迟到的事件会被拒绝。
4. 工具调用按 id 操作（`startToolCall` 返回 id），子调用同样按 id，写操作自动递归。
5. 文案随包走（`/locale`），中英键位同构；宿主只覆盖，不改组件。
6. 字段名以本文档的组件表为准；不确定就先查 JSON 契约，不要猜 prop 名。

## 任务配方

### 流式回写模型输出

API：`useChatEngine.createAssistantMessage`、`appendContent`、`appendThinkContent`、`completeMessage`

```js
const engine = useChatEngine()
const msg = engine.createAssistantMessage()
// 逐片回写：appendContent 自动把消息转成 streaming 态（卡片露出光标）
engine.appendContent(msg.id, chunk)
engine.appendThinkContent(msg.id, reasoningChunk)   // 思维链与正文分开
engine.completeMessage(msg.id)                      // 收尾：settle 耗时、转 done
```

注意：
- 不要自己拼字符串后 setMessageContent——那样没有 streaming 光标与贴底
- 正文与思维链必须分开两个 API，混写会串行渲染

### 停止生成（用户点停止 / 双击 Esc）

API：`cancelMessage`

```js
// 组件侧：EbAiPromptBox / EbChatSender 的 stop 事件
function onStop() {
  engine.cancelMessage(msg.id)
  transport.cancel()      // 后端协作式中断
}
```

注意：
- 取消是 cancelled，不是 error：不要用 setMessageError 表达用户主动停止
- cancelMessage 会把思考态标记为「思考已中断」，并把在跑/等待的工具调用落 cancelled
- 中断后迟到的增量与收尾会被拒绝（appendContent / completeToolCall 返回空）

### 渲染工具调用（含流式输出）

API：`startToolCall`、`appendToolCallResult`、`completeToolCall`、`failToolCall`

```js
const callId = engine.startToolCall(msg.id, { name: 'web_search', label: '联网检索', args: { query } })
engine.appendToolCallResult(msg.id, callId, '命中 3 条…')   // 边跑边出，卡片自动展开并贴底
engine.completeToolCall(msg.id, callId)                     // 省略 result：保留已流出的输出
```

注意：
- completeToolCall 第三参省略时保留流式输出，传空串才会清空
- 失败用 failToolCall（错误首行会摘要显示），不要走 completeToolCall

### 工具调用里挂子步骤（并行派发 / PTC）

API：`addSubToolCall`、`findToolCall`

```js
const parent = engine.startToolCall(msg.id, { name: 'fetch_page' })
const child = engine.addSubToolCall(msg.id, parent, { name: 'parse_html' })  // 返回子调用 id
engine.completeToolCall(msg.id, child, '解析出 3 个小节')
```

注意：
- append/complete/fail 都按 id 递归作用到子层，无需手动找父节点
- 嵌套上限 16 层，超深返回 null

### 审批接管（危险操作前问一句）

API：`EbChatApproval`、`useChatSession.respondApproval`

```js
<eb-chatbot :approval="approval" @approval-respond="onApprovalRespond" />

// 宿主侧
const answer = await askApproval({ id, toolName: 'web_search', reason: '需要联网' })
// answer: 'allowed-once' | 'rejected'
session.respondApproval('allowed-once')
```

注意：
- 只有两种结论：allowed-once / rejected（没有「总是允许」——那属于会话级权限模式）
- 审批非空时输入台让位给审批面板，优先级高于提问

### 提问接管（干活前澄清口径）

API：`EbChatQuestion`、`useChatSession.respondQuestion`

```js
<eb-chatbot :question="question" @question-respond="onQuestionRespond" />

const answer = await askQuestion({
  id, items: [{ id: 'scope', question: '按哪个口径对比？', options: [{ key: 'mom', label: '环比', recommended: true }] }],
})
// answer: { status: 'answered' | 'cancelled', answers: [{ selected: ['mom'], custom, skipped }] }
```

注意：
- 跳过算「已回答」（skipped: true），取消是整批作废（status: cancelled）
- 单选互斥、多选累加、自定义输入同题互斥

### 显示上下文占用

API：`EbChatContextMeter`、`useChatSession.setContext`

```js
<eb-ai-console :context="{ used, capacity: 32000, breakdown: { system, tools, messages } }" />

// 或由事件驱动
session.setContext({ used: 12800, capacity: 32000 })
```

注意：
- used 与 capacity 缺一不渲染——拿不到窗口容量时画环只会误导
- 百分比封顶 100%，75% 警告 / 90% 危险

### 展示本轮改了哪些文件

API：`EbChatChanges`、`useChatEngine.setChanges`

```js
engine.setChanges(msg.id, {
  total: 3, added: 96, deleted: 18,
  files: [{ path: 'src/a.vue', display: 'a.vue', added: 88, deleted: 12 }, { path: 'assets/logo.png', binary: true }],
})
```

注意：
- 单文件时标题直接给文件名；二进制/过大不给行数只给标记
- 列表默认露 4 行，超出收在「全部 N 个文件」

### 接真实后端（会话日志层：断线可恢复）

API：`useChatSession`、`createSessionLog`、`applySessionEvent`

```js
const transport = {
  open: ({ cursor, onEvent, onGap }) => subscribe({ cursor, onEvent, onGap }),  // 长连/轮询均可
  page: ({ from, limit }) => fetchRecords({ from, limit }),                    // 补页
  send: (payload) => post(payload), cancel: () => abort(),                     // 发送与中断
  approve: (outcome, request) => postApproval(outcome, request),
  answerQuestion: (answer, request) => postAnswer(answer, request),
}
const session = useChatSession({ transport })
session.open({ cursor: 0, records: [] })
```

注意：
- 事件信封 { type, seq, time, data, ignorable?, surfaceOp? }；seq 必须连续，缺口会缓冲并回调 onGap
- 游标只被持久事件推进；瞬时事件（审批/提问/占用）不会推进也不会造成缺口
- 不可忽略的未知事件会标记 degraded，宿主应重拉整窗

### 直接接 OpenAI / Anthropic

API：`createChatTransport`

```js
const transport = createChatTransport({
  provider: 'anthropic',            // 'openai' | 'anthropic'
  apiKey, model: 'claude-sonnet-4-5', system: '你是运营助手',
  tools: [{ name: 'web_search', description: '联网检索', parameters: {…} }],
  contextWindow: 32000,
  getMessages: () => session.messages.value,
})
```

注意：
- 浏览器直连会暴露 key：生产走自己的后端代理（url 指到代理）
- 这两家没有 follow/补页协议，历史要宿主自己存
- 工具参数是分片 JSON，适配层已按 index 拼完再 parse

### 自定义工具卡的参数/结果渲染

API：`EbChatToolCall 的 #args / #result 插槽`

```js
<eb-chat-tool-call :tool-call="call">
  <template #result="{ toolCall }"><eb-json-viewer :data="toolCall.result" /></template>
</eb-chat-tool-call>
```

注意：
- 默认是带环检测的 JSON &lt;pre&gt;；只要换成插槽就不会丢默认的折叠/状态语义

### 多语言

API：`chatLabels`、`useChatLabels`、`@wil-works/evoke-chat/locale`

```js
import zhCN from '@wil-works/evoke-chat/locale/zh-CN'
app.use(EvokeChat, { locale: zhCN })
```

注意：
- 文案随包走，中英键位必须同构（有测试守）
- 宿主自定义文案用 chatLabels 覆盖，不要 fork 组件

## 组件契约

| 组件 | 子路径入口 | 文档 |
| --- | --- | --- |
| `EbChatbot` | `@wil-works/evoke-chat/chatbot` | https://evoke-business-ui.wil-works.com/chat/chatbot |
| `EbChatList` | `@wil-works/evoke-chat/chat-list` | https://evoke-business-ui.wil-works.com/chat/chat-subcomponents |
| `EbChatMessage` | `@wil-works/evoke-chat/chat-message` | https://evoke-business-ui.wil-works.com/chat/chat-subcomponents |
| `EbChatSender` | `@wil-works/evoke-chat/chat-sender` | https://evoke-business-ui.wil-works.com/chat/chat-subcomponents |
| `EbChatContent` | `@wil-works/evoke-chat/chat-content` | https://evoke-business-ui.wil-works.com/chat/chat-subcomponents |
| `EbChatMarkdown` | `@wil-works/evoke-chat/chat-markdown` | https://evoke-business-ui.wil-works.com/chat/chat-subcomponents |
| `EbChatThinking` | `@wil-works/evoke-chat/chat-thinking` | https://evoke-business-ui.wil-works.com/chat/chat-subcomponents |
| `EbChatLoading` | `@wil-works/evoke-chat/chat-loading` | https://evoke-business-ui.wil-works.com/chat/chat-subcomponents |
| `EbChatActionbar` | `@wil-works/evoke-chat/chat-actionbar` | https://evoke-business-ui.wil-works.com/chat/chat-subcomponents |
| `EbChatAttachments` | `@wil-works/evoke-chat/chat-attachments` | https://evoke-business-ui.wil-works.com/chat/chat-subcomponents |
| `EbChatSuggestion` | `@wil-works/evoke-chat/chat-suggestion` | https://evoke-business-ui.wil-works.com/chat/chat-subcomponents |
| `EbChatFeedback` | `@wil-works/evoke-chat/chat-feedback` | https://evoke-business-ui.wil-works.com/chat/chat-subcomponents |
| `EbChatMessageEdit` | `@wil-works/evoke-chat/chat-message-edit` | https://evoke-business-ui.wil-works.com/chat/chat-subcomponents |
| `EbChatSources` | `@wil-works/evoke-chat/chat-sources` | https://evoke-business-ui.wil-works.com/chat/chat-subcomponents |
| `EbChatToolCall` | `@wil-works/evoke-chat/chat-tool-call` | https://evoke-business-ui.wil-works.com/chat/chat-subcomponents |
| `EbChatThreads` | `@wil-works/evoke-chat/chat-threads` | https://evoke-business-ui.wil-works.com/chat/chat-threads |
| `EbChatWidget` | `@wil-works/evoke-chat/chat-widget` | https://evoke-business-ui.wil-works.com/chat/chat-widget |
| `EbChatPlan` | `@wil-works/evoke-chat/chat-plan` | https://evoke-business-ui.wil-works.com/chat/chat-subcomponents |
| `EbChatConfirmation` | `@wil-works/evoke-chat/chat-confirmation` | https://evoke-business-ui.wil-works.com/chat/chat-subcomponents |
| `EbChatApproval` | `@wil-works/evoke-chat/chat-approval` | https://evoke-business-ui.wil-works.com/chat/chat-subcomponents |
| `EbChatQuestion` | `@wil-works/evoke-chat/chat-question` | https://evoke-business-ui.wil-works.com/chat/chat-subcomponents |
| `EbChatContextMeter` | `@wil-works/evoke-chat/chat-context-meter` | https://evoke-business-ui.wil-works.com/chat/chat-subcomponents |
| `EbChatChanges` | `@wil-works/evoke-chat/chat-changes` | https://evoke-business-ui.wil-works.com/chat/chat-subcomponents |
| `EbChatArtifact` | `@wil-works/evoke-chat/chat-artifact` | https://evoke-business-ui.wil-works.com/chat/chat-subcomponents |
| `EbChatDiff` | `@wil-works/evoke-chat/chat-diff` | https://evoke-business-ui.wil-works.com/chat/chat-subcomponents |
| `EbChatTerminal` | `@wil-works/evoke-chat/chat-terminal` | https://evoke-business-ui.wil-works.com/chat/chat-subcomponents |
| `EbChatFileTree` | `@wil-works/evoke-chat/chat-file-tree` | https://evoke-business-ui.wil-works.com/chat/chat-subcomponents |
| `EbChatTestResults` | `@wil-works/evoke-chat/chat-test-results` | https://evoke-business-ui.wil-works.com/chat/chat-subcomponents |
| `EbChatStackTrace` | `@wil-works/evoke-chat/chat-stack-trace` | https://evoke-business-ui.wil-works.com/chat/chat-subcomponents |
| `EbChatShare` | `@wil-works/evoke-chat/chat-share` | https://evoke-business-ui.wil-works.com/chat/chat-subcomponents |
| `EbChatSpeak` | `@wil-works/evoke-chat/chat-speak` | https://evoke-business-ui.wil-works.com/chat/chat-subcomponents |
| `EbChatVoiceInput` | `@wil-works/evoke-chat/chat-voice-input` | https://evoke-business-ui.wil-works.com/chat/chat-subcomponents |
| `EbChatQueue` | `@wil-works/evoke-chat/chat-queue` | https://evoke-business-ui.wil-works.com/chat/chat-subcomponents |
| `EbChatCommandMenu` | `@wil-works/evoke-chat/chat-command-menu` | https://evoke-business-ui.wil-works.com/chat/chat-subcomponents |
| `EbChatUsage` | `@wil-works/evoke-chat/chat-usage` | https://evoke-business-ui.wil-works.com/chat/chat-subcomponents |
| `EbChatSandbox` | `@wil-works/evoke-chat/chat-sandbox` | https://evoke-business-ui.wil-works.com/chat/chat-subcomponents |
| `EbChatWebPreview` | `@wil-works/evoke-chat/chat-web-preview` | https://evoke-business-ui.wil-works.com/chat/chat-subcomponents |
| `EbAiPromptBox` | `@wil-works/evoke-chat/ai-prompt-box` | https://evoke-business-ui.wil-works.com/chat/ai-prompt-box |
| `EbAiConsole` | `@wil-works/evoke-chat/ai-console` | https://evoke-business-ui.wil-works.com/chat/ai-console |

### EbChatbot

EbChatbot 之外的家族成员。绝大多数场景不需要直接用它们——EbChatbot 已经把这些组装好了。它们用于两种情形：只想要其中一块（比如独立渲染一段 Markdown），或要自己编排（ChatList + 自定义发送区）。

- 入口：`@wil-works/evoke-chat/chatbot`　源码：`src/components/chatbot/Chatbot.vue`　文档：https://evoke-business-ui.wil-works.com/chat/chatbot
- 插槽：`header`、`empty`、`message-header`、`message`、`message-content`、`tool-result`、`tool-args`、`sender-menu`、`sender-prepend`、`sender-toolbar`、`sender-append`、`tip`

| prop | 类型 | 默认 |
| --- | --- | --- |
| `modelValue` | Array | () => [] |
| `placeholder` | String | void 0 |
| `loading` | Boolean | false |
| `disabled` | Boolean | false |
| `showThinking` | Boolean | true |
| `allowAttachments` | Boolean | true |
| `maxAttachments` | Number | 5 |
| `maxLength` | Number | 2e3 |
| `showWordCount` | Boolean | false |
| `sendOnEnter` | Boolean | true |
| `actions` | Array | () => [] |
| `editable` | Boolean | false |
| `editMaxLength` | Number | 0 |
| `feedback` | Boolean | false |
| `feedbackReasons` | Array | () => [] |
| `toolRetryable` | Boolean | true |
| `speech` | Boolean | false |
| `traceUrl` | String | "" |
| `virtual` | Boolean | false |
| `virtualThreshold` | Number | 60 |
| `estimatedItemSize` | Number | 120 |
| `accept` | String | "" |
| `maxFileSize` | Number | 0 |
| `allowDrop` | Boolean | true |
| `queueable` | Boolean | false |
| `menuOpen` | Boolean | false |
| `height` | [String | "600px" |
| `width` | [String | "100%" |
| `avatarUser` | String | "" |
| `avatarAssistant` | String | "" |
| `userName` | String | void 0 |
| `assistantName` | String | void 0 |
| `showAvatar` | [Boolean | true |
| `showName` | [Boolean | true |
| `showTime` | Boolean | true |
| `renderMode` | String | "markdown" |
| `autoScroll` | Boolean | true |
| `showTip` | Boolean | true |
| `stoppable` | Boolean | false |
| `approval` | Object | null |
| `question` | Object | null |
| `context` | Object | null |
| `inputValue` | String | "" |

事件：`send`、`stop`、`copy`、`regenerate`、`action`、`edit`、`feedback`

### EbChatList

消息滚动容器。负责自动贴底、role="log" 流式播报、回到底部钮、空态；不负责发送。

- 入口：`@wil-works/evoke-chat/chat-list`　源码：`src/components/chatbot/ChatList.vue`　文档：https://evoke-business-ui.wil-works.com/chat/chat-subcomponents
- 插槽：`empty`、`message`、`message-content`、`tool-result`、`tool-args`、`header`

| prop | 类型 | 默认 |
| --- | --- | --- |
| `messages` | Array | () => [] |
| `showThinking` | Boolean | true |
| `avatarUser` | String | "" |
| `avatarAssistant` | String | "" |
| `userName` | String | void 0 |
| `assistantName` | String | void 0 |
| `showAvatar` | [Boolean | true |
| `showName` | [Boolean | true |
| `showTime` | Boolean | true |
| `renderMode` | String | "markdown" |
| `actions` | Array | () => [] |
| `autoScroll` | Boolean | true |
| `editable` | Boolean | false |
| `editMaxLength` | Number | 0 |
| `feedback` | Boolean | false |
| `feedbackReasons` | Array | () => [] |
| `toolRetryable` | Boolean | true |
| `speech` | Boolean | false |
| `traceUrl` | String | "" |
| `virtual` | Boolean | false |
| `virtualThreshold` | Number | 60 |
| `estimatedItemSize` | Number | 120 |

事件：`copy`、`regenerate`、`action`、`edit`、`feedback`、`scroll`

### EbChatMessage

单条消息。按 role 分流：user / assistant 是对话气泡，system / notice 是居中弱化的系统提示（无头像、昵称、动作条）。

- 入口：`@wil-works/evoke-chat/chat-message`　源码：`src/components/chatbot/ChatMessage.vue`　文档：https://evoke-business-ui.wil-works.com/chat/chat-subcomponents
- 插槽：`tool-result`、`tool-args`、`content`

| prop | 类型 | 默认 |
| --- | --- | --- |
| `message` | null | — |
| `showThinking` | Boolean | true |
| `avatarUser` | String | "" |
| `avatarAssistant` | String | "" |
| `userName` | String | void 0 |
| `assistantName` | String | void 0 |
| `renderMode` | String | "markdown" |
| `showAvatar` | [Boolean | true |
| `showName` | [Boolean | true |
| `showTime` | Boolean | true |
| `actions` | Array | () => [] |
| `editable` | Boolean | false |
| `editMaxLength` | Number | 0 |
| `feedback` | Boolean | false |
| `feedbackReasons` | Array | () => [] |
| `toolRetryable` | Boolean | true |
| `speech` | Boolean | false |
| `traceUrl` | String | "" |

事件：`copy`、`regenerate`、`action`、`edit`、`feedback`

### EbChatSender

输入区：自增高、Enter 发送、IME 组字安全、附件（点选 / 拖拽 / 粘贴）、字数限制、发送↔停止变形。EbChatbot 内部用它。

- 入口：`@wil-works/evoke-chat/chat-sender`　源码：`src/components/chatbot/ChatSender.vue`　文档：https://evoke-business-ui.wil-works.com/chat/chat-subcomponents
- 插槽：`toolbar`
- 实例方法（ref 调用）：`focus`、`setCaret`、`blur`、`reset`

| prop | 类型 | 默认 |
| --- | --- | --- |
| `modelValue` | String | "" |
| `placeholder` | String | void 0 |
| `disabled` | Boolean | false |
| `loading` | Boolean | false |
| `allowAttachments` | Boolean | true |
| `maxAttachments` | Number | 5 |
| `maxLength` | Number | 2e3 |
| `showWordCount` | Boolean | false |
| `minRows` | Number | 1 |
| `maxRows` | Number | 6 |
| `sendOnEnter` | Boolean | true |
| `stoppable` | Boolean | false |
| `accept` | String | "" |
| `maxFileSize` | Number | 0 |
| `allowDrop` | Boolean | true |
| `queueable` | Boolean | false |
| `menuOpen` | Boolean | false |

事件：`send`、`stop`

### EbChatContent

面板外壳：固定尺寸、可选边框、头部/底部槽位。EbChatbot 用它包住消息区与输入区。

- 入口：`@wil-works/evoke-chat/chat-content`　源码：`src/components/chatbot/ChatContent.vue`　文档：https://evoke-business-ui.wil-works.com/chat/chat-subcomponents
- 插槽：`header`、`默认`、`footer`

| prop | 类型 | 默认 |
| --- | --- | --- |
| `height` | [String | "100%" |
| `width` | [String | "100%" |
| `bordered` | Boolean | false |

### EbChatMarkdown

Markdown 渲染器：GFM 表格与任务列表、代码块工具条（语言标签 + 复制）、自定义协议引用芯片、source: 行内引用上标、流式拖尾。原文 HTML 一律转义为纯文本；图片 src 只放行 http / https / data。

- 入口：`@wil-works/evoke-chat/chat-markdown`　源码：`src/components/chatbot/ChatMarkdown.vue`　文档：https://evoke-business-ui.wil-works.com/chat/chat-subcomponents

| prop | 类型 | 默认 |
| --- | --- | --- |
| `content` | String | "" |
| `streaming` | Boolean | false |

### EbChatThinking

思考过程折叠块。流式期间强制展开，结束后回到用户可控的折叠态。{ content, thinking, duration, interrupted }（duration 为思考耗时，显示成「（用时 X）」；消息上下文里取 message.thinkDuration；interrupted 为真时标题说「思考已中断」，用

- 入口：`@wil-works/evoke-chat/chat-thinking`　源码：`src/components/chatbot/ChatThinking.vue`　文档：https://evoke-business-ui.wil-works.com/chat/chat-subcomponents

| prop | 类型 | 默认 |
| --- | --- | --- |
| `content` | String | "" |
| `thinking` | Boolean | false |
| `duration` | Number | 0 |
| `interrupted` | Boolean | false |

### EbChatLoading

三点起伏的打字指示。可选 text 文案。

- 入口：`@wil-works/evoke-chat/chat-loading`　源码：`src/components/chatbot/ChatLoading.vue`　文档：https://evoke-business-ui.wil-works.com/chat/chat-subcomponents

| prop | 类型 | 默认 |
| --- | --- | --- |
| `text` | String | "" |

### EbChatActionbar

消息动作条：复制（内置，含已复制回执）、重新生成（仅 assistant）、编辑（仅 user）、自定义动作。默认悬停显示，:focus-within 与触屏常显。自定义动作给了 icon 就是图标按钮，没给则回落成文字按钮；每颗按钮悬浮都出库内 Tooltip（Teleport 到 body，消息列表滚动时不会被裁切

- 入口：`@wil-works/evoke-chat/chat-actionbar`　源码：`src/components/chatbot/ChatActionbar.vue`　文档：https://evoke-business-ui.wil-works.com/chat/chat-subcomponents

| prop | 类型 | 默认 |
| --- | --- | --- |
| `message` | null | — |
| `actions` | Array | () => [] |
| `showCopy` | Boolean | true |
| `showRegenerate` | Boolean | true |
| `showEdit` | Boolean | false |
| `showSpeech` | Boolean | false |
| `traceUrl` | String | "" |

事件：`copy`、`regenerate`、`edit`、`action`

### EbChatAttachments

附件卡片列表：图片预览或按后缀匹配的专用图标（pdf / word / excel / ppt / zip / image / music / video / code / text，认不出退 MIME 大类、再退通用文档图标）、文件名、体积、移除钮；图标默认按类型染色（pdf 红 / word 蓝 / excel 绿

- 入口：`@wil-works/evoke-chat/chat-attachments`　源码：`src/components/chatbot/ChatAttachments.vue`　文档：https://evoke-business-ui.wil-works.com/chat/chat-subcomponents

| prop | 类型 | 默认 |
| --- | --- | --- |
| `attachments` | Array | () => [] |
| `removable` | Boolean | false |
| `colored` | Boolean | true |

事件：`remove`

### EbChatSuggestion

追问 chips。items 接受 string 或 { text, prompt? }；layout 取 row（消息尾部）或 column（欢迎区）；icon 传图标名则每枚前置。抛 pick({ text, prompt })。

- 入口：`@wil-works/evoke-chat/chat-suggestion`　源码：`src/components/chatbot/ChatSuggestion.vue`　文档：https://evoke-business-ui.wil-works.com/chat/chat-subcomponents

| prop | 类型 | 默认 |
| --- | --- | --- |
| `items` | Array | () => [] |
| `layout` | String | "row" |
| `icon` | String | "" |
| `disabled` | Boolean | false |

事件：`pick`

### EbChatFeedback

点赞点踩。点赞立即提交；点踩展开结构化原因面板与备注。取消评价也会交出 { value: null }——否则宿主存下来的评价清不掉。

- 入口：`@wil-works/evoke-chat/chat-feedback`　源码：`src/components/chatbot/ChatFeedback.vue`　文档：https://evoke-business-ui.wil-works.com/chat/chat-subcomponents

| prop | 类型 | 默认 |
| --- | --- | --- |
| `value` | String | null |
| `reasons` | Array | () => [] |
| `showNote` | Boolean | true |
| `disabled` | Boolean | false |

事件：`submit`

### EbChatMessageEdit

用户消息的原地编辑器。Esc 取消、Enter 保存、IME 安全、maxlength 生效。{ modelValue, placeholder, maxLength, sendOnEnter }，抛 save(text) / cancel。

- 入口：`@wil-works/evoke-chat/chat-message-edit`　源码：`src/components/chatbot/ChatMessageEdit.vue`　文档：https://evoke-business-ui.wil-works.com/chat/chat-subcomponents

| prop | 类型 | 默认 |
| --- | --- | --- |
| `modelValue` | String | "" |
| `placeholder` | String | void 0 |
| `maxLength` | Number | 0 |
| `sendOnEnter` | Boolean | true |

事件：`save`、`cancel`

### EbChatSources

EbChatSources

- 入口：`@wil-works/evoke-chat/chat-sources`　源码：`src/components/chatbot/ChatSources.vue`　文档：https://evoke-business-ui.wil-works.com/chat/chat-subcomponents

| prop | 类型 | 默认 |
| --- | --- | --- |
| `items` | Array | () => [] |
| `collapsible` | Boolean | true |
| `defaultOpen` | Boolean | true |

### EbChatToolCall

工具调用卡：状态标记（等待/执行/失败/完成/已停止）、耗时、参数与结果的折叠展开，失败态给重试钮。支持子调用：toolCall.subCalls 是同一形状的数组（并行派发 / PTC 子步），展开后按层级递归渲染、左侧细轨标出从属关系，折叠时头部给子调用计数；嵌套上限 16 层（引擎与组件两侧都设了，异常自引用数据

- 入口：`@wil-works/evoke-chat/chat-tool-call`　源码：`src/components/chatbot/ChatToolCall.vue`　文档：https://evoke-business-ui.wil-works.com/chat/chat-subcomponents
- 插槽：`args`、`result`

| prop | 类型 | 默认 |
| --- | --- | --- |
| `toolCall` | Object | () => ({}) |
| `expanded` | Boolean | undefined |
| `retryable` | Boolean | true |
| `depth` | Number | 0 |

事件：`toggle`、`retry`

### EbChatThreads

不想要 Console 那套编排时，EbChatThreads 可以单独用；#item 插槽整条接管，itemProps 用于回落默认渲染（与 ChatList#message 同款约定）：

- 入口：`@wil-works/evoke-chat/chat-threads`　源码：`src/components/chatbot/ChatThreads.vue`　文档：https://evoke-business-ui.wil-works.com/chat/chat-threads
- 插槽：`header`、`empty`、`item`、`footer`

| prop | 类型 | 默认 |
| --- | --- | --- |
| `threads` | Array | () => [] |
| `active` | String | "" |
| `streaming` | Array | () => [] |
| `searchable` | Boolean | true |
| `showCreate` | Boolean | true |
| `groupByDate` | Boolean | true |
| `renamable` | Boolean | true |
| `removable` | Boolean | true |

事件：`select`、`create`、`rename`、`remove`、`pin`、`archive`、`search`

### EbChatWidget

导出名为 EbChatWidget。v-model 管开合；内容完全由你放——常见就是一颗 EbChatbot 或 EbAiConsole：

- 入口：`@wil-works/evoke-chat/chat-widget`　源码：`src/components/chatbot/ChatWidget.vue`　文档：https://evoke-business-ui.wil-works.com/chat/chat-widget
- 插槽：`默认`、`disclaimer-actions`、`title`、`launcher`

| prop | 类型 | 默认 |
| --- | --- | --- |
| `modelValue` | Boolean | false |
| `title` | String | "" |
| `icon` | String | "customer-service" |
| `launcherTooltip` | String | "" |
| `badge` | Number | null |
| `placement` | String | "bottom-right" |
| `width` | [String | 380 |
| `height` | [String | 560 |
| `mobileMode` | String | "drawer" |
| `drawerSize` | [String | "80%" |
| `disclaimer` | String | "" |
| `defaultConsented` | Boolean | false |
| `appendToBody` | Boolean | true |

事件：`open`、`close`、`consent`

### EbChatPlan

EbChatPlan · EbChatConfirmation · EbChatArtifact

- 入口：`@wil-works/evoke-chat/chat-plan`　源码：`src/components/chatbot/ChatPlan.vue`　文档：https://evoke-business-ui.wil-works.com/chat/chat-subcomponents
- 插槽：`step`

| prop | 类型 | 默认 |
| --- | --- | --- |
| `plan` | Object | () => ({ steps: [] }) |
| `expanded` | Boolean | undefined |

事件：`toggle`

### EbChatConfirmation

EbChatPlan · EbChatConfirmation · EbChatArtifact

- 入口：`@wil-works/evoke-chat/chat-confirmation`　源码：`src/components/chatbot/ChatConfirmation.vue`　文档：https://evoke-business-ui.wil-works.com/chat/chat-subcomponents

| prop | 类型 | 默认 |
| --- | --- | --- |
| `confirmation` | Object | () => ({}) |

事件：`respond`

### EbChatApproval

审批面板：agent 要执行越权动作（跑命令、联网、改文件）时接管输入区——待审批期间发送台让位，用户只需做一个决定。{ id, toolName, reason?, detail?, status? }：给了 reason 就用它当标题，否则显示「工具 X 请求越权执行」；detail 常放被拦命令原文（等宽、限高可

- 入口：`@wil-works/evoke-chat/chat-approval`　源码：`src/components/chatbot/ChatApproval.vue`　文档：https://evoke-business-ui.wil-works.com/chat/chat-subcomponents
- 插槽：`默认`

| prop | 类型 | 默认 |
| --- | --- | --- |
| `request` | Object | () => ({}) |
| `answered` | Boolean | undefined |

事件：`respond`

### EbChatQuestion

提问面板：agent 需要澄清时接管输入区（审批优先——越权动作必须先答）。{ id, items: [{ id, question, header?, multiSelect?, allowCustom?, options: [{ key, label, recommended?, description? }] }

- 入口：`@wil-works/evoke-chat/chat-question`　源码：`src/components/chatbot/ChatQuestion.vue`　文档：https://evoke-business-ui.wil-works.com/chat/chat-subcomponents

| prop | 类型 | 默认 |
| --- | --- | --- |
| `request` | Object | () => ({}) |
| `answered` | Boolean | undefined |

事件：`respond`

### EbChatContextMeter

输入区上方的占用环：{ used, capacity, breakdown? }，环 + 百分比，点开给「已用 / 窗口」与三段构成（系统提示词 / 工具定义 / 对话消息）。两侧缺一就不显示——拿不到窗口容量时画个环只会误导；百分比封顶 100%，到 75% 转警告色、90% 转危险色，动画在 prefers-red

- 入口：`@wil-works/evoke-chat/chat-context-meter`　源码：`src/components/chatbot/ChatContextMeter.vue`　文档：https://evoke-business-ui.wil-works.com/chat/chat-subcomponents

| prop | 类型 | 默认 |
| --- | --- | --- |
| `used` | Number | 0 |
| `capacity` | Number | 0 |
| `breakdown` | Object | null |

### EbChatChanges

本轮改动汇总卡：标题给「已编辑 N 个文件」（单文件时直接给文件名），右侧 +A -R；展开后逐行列文件，每行带自己的增删数，二进制 / 过大不给行数只给标记。超出 collapsedRows（默认 4）折叠，给「全部 N 个文件」。路径等宽、不折行（保住目录层级），过长省略并留 title；点行抛 select（宿主

- 入口：`@wil-works/evoke-chat/chat-changes`　源码：`src/components/chatbot/ChatChanges.vue`　文档：https://evoke-business-ui.wil-works.com/chat/chat-subcomponents

| prop | 类型 | 默认 |
| --- | --- | --- |
| `files` | Array | () => [] |
| `summary` | Object | null |
| `collapsedRows` | Number | 4 |
| `defaultOpen` | Boolean | false |

事件：`select`

### EbChatArtifact

EbChatPlan · EbChatConfirmation · EbChatArtifact

- 入口：`@wil-works/evoke-chat/chat-artifact`　源码：`src/components/chatbot/ChatArtifact.vue`　文档：https://evoke-business-ui.wil-works.com/chat/chat-subcomponents
- 插槽：`artifact`

| prop | 类型 | 默认 |
| --- | --- | --- |
| `artifacts` | Array | () => [] |
| `copyable` | Boolean | true |

事件：`open`、`copy`

### EbChatDiff

吃标准统一 diff 文本（git diff 与各家 agent 输出的那种），按文件分组，头部给路径与 +N −M，行按增/删/上下文着色，带 old/new 双行号栅格。

- 入口：`@wil-works/evoke-chat/chat-diff`　源码：`src/components/chatbot/ChatDiff.vue`　文档：https://evoke-business-ui.wil-works.com/chat/chat-subcomponents

| prop | 类型 | 默认 |
| --- | --- | --- |
| `diff` | String | "" |
| `showLineNumbers` | Boolean | true |
| `collapsible` | Boolean | true |
| `defaultOpen` | Boolean | true |
| `maxHeight` | [String | "360px" |

事件：`toggle`、`copy`

### EbChatTerminal

命令输出卡：头部给命令与退出码，正文等宽渲染且不折行（保住终端列结构，横向滚动交给容器），status: 'running' 时末尾有光标。长输出只渲染尾部（默认 40 行），给省略数与展开入口——命令输出动辄上千行，全渲染会拖垮消息列。

- 入口：`@wil-works/evoke-chat/chat-terminal`　源码：`src/components/chatbot/ChatTerminal.vue`　文档：https://evoke-business-ui.wil-works.com/chat/chat-subcomponents

| prop | 类型 | 默认 |
| --- | --- | --- |
| `command` | String | "" |
| `output` | String | "" |
| `status` | String | "done" |
| `exitCode` | [Number | null |
| `collapsible` | Boolean | true |
| `defaultOpen` | Boolean | true |
| `maxHeight` | [String | "320px" |
| `tailLines` | Number | 40 |

事件：`toggle`、`copy`

### EbChatFileTree

扁平路径列表 → 嵌套树。目录在前、名称升序；文件带类型图标、状态徽标（新增/修改/删除/重命名）与增删行数。目录默认展开，折叠状态 aria-expanded 完整。

- 入口：`@wil-works/evoke-chat/chat-file-tree`　源码：`src/components/chatbot/ChatFileTree.vue`　文档：https://evoke-business-ui.wil-works.com/chat/chat-subcomponents

| prop | 类型 | 默认 |
| --- | --- | --- |
| `files` | Array | () => [] |
| `defaultExpandAll` | Boolean | true |

事件：`select`、`toggle`

### EbChatTestResults

EbChatTestResults · EbChatStackTrace。两张都是纯数据渲染，无额外依赖。

- 入口：`@wil-works/evoke-chat/chat-test-results`　源码：`src/components/chatbot/ChatTestResults.vue`　文档：https://evoke-business-ui.wil-works.com/chat/chat-subcomponents

| prop | 类型 | 默认 |
| --- | --- | --- |
| `results` | Object | () => ({}) |
| `cases` | Array | null |
| `expandStacks` | Boolean | false |

### EbChatStackTrace

吃 stack 字符串或已解析的 frames，认三种常见形态：

- 入口：`@wil-works/evoke-chat/chat-stack-trace`　源码：`src/components/chatbot/ChatStackTrace.vue`　文档：https://evoke-business-ui.wil-works.com/chat/chat-subcomponents

| prop | 类型 | 默认 |
| --- | --- | --- |
| `stack` | [String | "" |
| `collapseDependencies` | Boolean | true |
| `maxAppFrames` | Number | 0 |

### EbChatShare

收集「可见范围 + 有效期」，链接的生成与权限校验由你的服务端负责——组件不发请求；link 为空是配置态、非空是已创建态。

- 入口：`@wil-works/evoke-chat/chat-share`　源码：`src/components/chatbot/ChatShare.vue`　文档：https://evoke-business-ui.wil-works.com/chat/chat-subcomponents

| prop | 类型 | 默认 |
| --- | --- | --- |
| `modelValue` | Boolean | false |
| `title` | String | "" |
| `link` | String | "" |
| `creating` | Boolean | false |
| `scopes` | Array | () => [] |
| `scope` | String | "anyone" |
| `expiries` | Array | () => [] |
| `expiry` | String | "7d" |
| `appendToBody` | Boolean | true |

事件：`create`、`revoke`、`copy`

### EbChatSpeak

### 朗读（useSpeech · EbChatSpeak）

- 入口：`@wil-works/evoke-chat/chat-speak`　源码：`src/components/chatbot/ChatSpeak.vue`　文档：https://evoke-business-ui.wil-works.com/chat/chat-subcomponents

| prop | 类型 | 默认 |
| --- | --- | --- |
| `text` | String | "" |
| `lang` | String | "" |
| `rate` | Number | 1 |

事件：`start`、`stop`、`end`

### EbChatVoiceInput

### 口述（useSpeechInput · EbChatVoiceInput）

- 入口：`@wil-works/evoke-chat/chat-voice-input`　源码：`src/components/chatbot/ChatVoiceInput.vue`　文档：https://evoke-business-ui.wil-works.com/chat/chat-subcomponents

| prop | 类型 | 默认 |
| --- | --- | --- |
| `lang` | String | "" |
| `continuous` | Boolean | false |
| `emitInterim` | Boolean | true |

事件：`interim`、`result`、`error`、`start`、`end`

### EbChatQueue

EbChatQueue 是待发送队列那条窄带，宿主放在输入区上方即可（#sender-prepend 或自己排布）：

- 入口：`@wil-works/evoke-chat/chat-queue`　源码：`src/components/chatbot/ChatQueue.vue`　文档：https://evoke-business-ui.wil-works.com/chat/chat-subcomponents

| prop | 类型 | 默认 |
| --- | --- | --- |
| `items` | Array | () => [] |

事件：`remove`、`clear`

### EbChatCommandMenu

useTriggerMenu（判定）+ EbChatCommandMenu（渲染）+ 输入区让出键盘，三件拼起来。键盘不放在弹层里是刻意的——焦点始终在输入框，弹层不该抢走输入。

- 入口：`@wil-works/evoke-chat/chat-command-menu`　源码：`src/components/chatbot/ChatCommandMenu.vue`　文档：https://evoke-business-ui.wil-works.com/chat/chat-subcomponents

| prop | 类型 | 默认 |
| --- | --- | --- |
| `items` | Array | () => [] |
| `highlight` | Number | 0 |
| `visible` | Boolean | false |
| `title` | String | "" |

事件：`select`、`hover`

### EbChatUsage

EbChatUsage 只展示宿主给的用量——成本要价目表，那是宿主的业务数据，组件与引擎都不猜。

- 入口：`@wil-works/evoke-chat/chat-usage`　源码：`src/components/chatbot/ChatUsage.vue`　文档：https://evoke-business-ui.wil-works.com/chat/chat-subcomponents

| prop | 类型 | 默认 |
| --- | --- | --- |
| `usage` | Object | null |
| `items` | Array | null |
| `size` | String | "compact" |
| `bare` | Boolean | true |

### EbChatSandbox

组件不执行代码，只把一个隔离 iframe 管起来：宿主给 HTML → 组件拼 bootstrap → srcdoc + sandbox 属性 → iframe；console 与错误经 postMessage 上来，组件只转发不解析。

- 入口：`@wil-works/evoke-chat/chat-sandbox`　源码：`src/components/chatbot/ChatSandbox.vue`　文档：https://evoke-business-ui.wil-works.com/chat/chat-subcomponents

| prop | 类型 | 默认 |
| --- | --- | --- |
| `html` | String | "" |
| `src` | String | "" |
| `title` | String | "" |
| `height` | [String | 260 |
| `autoHeight` | Boolean | false |
| `extraSandbox` | Array | () => [] |
| `allow` | String | "" |
| `bootConsole` | Boolean | true |

事件：`console`、`error`、`ready`、`resize`

### EbChatWebPreview

iframe + 截图双模式。有一个绕不过去的硬限制：目标站返回 X-Frame-Options: DENY 或 frame-ancestors 时浏览器显示空白错误页，而跨域下脚本无法可靠区分「禁嵌的空白页」与「真的空白内容」——load 两种情况都触发。

- 入口：`@wil-works/evoke-chat/chat-web-preview`　源码：`src/components/chatbot/ChatWebPreview.vue`　文档：https://evoke-business-ui.wil-works.com/chat/chat-subcomponents

| prop | 类型 | 默认 |
| --- | --- | --- |
| `src` | String | "" |
| `screenshot` | String | "" |
| `embeddable` | Boolean | null |
| `title` | String | "" |
| `screenshotAlt` | String | "" |
| `height` | [String | 320 |
| `extraSandbox` | Array | () => [] |
| `allow` | String | "" |

### EbAiPromptBox

EbAiPromptBox 侧同理走 #toolbar-extra。

- 入口：`@wil-works/evoke-chat/ai-prompt-box`　源码：`src/components/ai-prompt-box/index.vue`　文档：https://evoke-business-ui.wil-works.com/chat/ai-prompt-box
- 插槽：`toolbar-extra`、`scenes-append`
- 实例方法（ref 调用）：`focus`、`clear`

| prop | 类型 | 默认 |
| --- | --- | --- |
| `modelValue` | String | '' |
| `placeholder` | String | void 0 |
| `disabled` | Boolean | false |
| `loading` | Boolean | false |
| `scenes` | Array | () => [] |
| `scene` | String | '' |
| `capabilities` | Array | () => [] |
| `activeCapabilities` | Array | () => [] |
| `models` | Array | () => [] |
| `model` | String | '' |
| `quota` | [String | null |
| `showSettings` | Boolean | false |
| `allowAttachments` | Boolean | true |
| `maxAttachments` | Number | 5 |
| `accept` | String | '' |
| `maxFileSize` | Number | 0 |
| `allowDrop` | Boolean | true |
| `maxLength` | Number | undefined |
| `showWordCount` | Boolean | false |
| `maxRows` | Number | 8 |
| `sendOnEnter` | Boolean | true |
| `stoppable` | Boolean | false |

事件：`send`、`stop`

### EbAiConsole

EbChatbot / EbAiConsole 的 question prop 传了就接管输入区，响应经 question-respond(answer, request) 抛出；useChatSession 的 question + respondQuestion(answer) 已把链路接好（question/re

- 入口：`@wil-works/evoke-chat/ai-console`　源码：`src/components/ai-console/index.vue`　文档：https://evoke-business-ui.wil-works.com/chat/ai-console
- 插槽：`threads`、`empty`、`toolbar-extra`、`tip`
- 实例方法（ref 调用）：`engine`、`clear`

| prop | 类型 | 默认 |
| --- | --- | --- |
| `engine` | Object | null |
| `sessions` | Object | null |
| `transport` | Function | null |
| `welcome` | Object | null |
| `examples` | Array | () => [] |
| `exampleAction` | String | 'send' |
| `placeholder` | String | void 0 |
| `disabled` | Boolean | false |
| `loading` | Boolean | false |
| `scenes` | Array | () => [] |
| `capabilities` | Array | () => [] |
| `models` | Array | () => [] |
| `quota` | [String | null |
| `showSettings` | Boolean | false |
| `allowAttachments` | Boolean | true |
| `maxAttachments` | Number | 5 |
| `maxLength` | Number | 2000 |
| `sendOnEnter` | Boolean | true |
| `stoppable` | Boolean | false |
| `approval` | Object | null |
| `question` | Object | null |
| `context` | Object | null |
| `showThinking` | Boolean | true |
| `renderMode` | String | 'markdown' |
| `autoScroll` | Boolean | true |
| `userName` | String | void 0 |
| `assistantName` | String | void 0 |
| `showAvatar` | [Boolean | true |
| `showName` | [Boolean | true |
| `showTime` | Boolean | true |
| `avatarUser` | String | '' |
| `avatarAssistant` | String | '' |
| `actions` | Array | () => [] |
| `editable` | Boolean | false |
| `editMaxLength` | Number | 0 |
| `feedback` | Boolean | false |
| `feedbackReasons` | Array | () => [] |
| `toolRetryable` | Boolean | true |
| `speech` | Boolean | false |
| `traceUrl` | String | "" |
| `chatHeight` | [Number | 420 |
| `showTip` | Boolean | true |

事件：`send`、`stop`、`copy`、`regenerate`、`action`、`edit`、`feedback`

## 组合式 API

| 名称 | 入口 | 文档 |
| --- | --- | --- |
| `useChatEngine` | `@wil-works/evoke-chat` | https://evoke-business-ui.wil-works.com/chat/chat-subcomponents#usechatengine |
| `useChatSessions` | `@wil-works/evoke-chat` | https://evoke-business-ui.wil-works.com/chat/chat-subcomponents#usechatsessions |
| `createSessionLog` | `@wil-works/evoke-chat` | https://evoke-business-ui.wil-works.com/chat/chat-subcomponents#createsessionlog |
| `isEnvelope` | `@wil-works/evoke-chat` | https://evoke-business-ui.wil-works.com/chat/chat-subcomponents#isenvelope |
| `isTransient` | `@wil-works/evoke-chat` | https://evoke-business-ui.wil-works.com/chat/chat-subcomponents#istransient |
| `useChatSession` | `@wil-works/evoke-chat` | https://evoke-business-ui.wil-works.com/chat/chat-subcomponents#usechatsession |
| `applySessionEvent` | `@wil-works/evoke-chat` | https://evoke-business-ui.wil-works.com/chat/chat-subcomponents#applysessionevent |
| `useTriggerMenu` | `@wil-works/evoke-chat` | https://evoke-business-ui.wil-works.com/chat/chat-subcomponents#usetriggermenu |
| `useSpeech` | `@wil-works/evoke-chat` | https://evoke-business-ui.wil-works.com/chat/chat-subcomponents#usespeech |
| `useSpeechInput` | `@wil-works/evoke-chat` | https://evoke-business-ui.wil-works.com/chat/chat-subcomponents#usespeechinput |
| `chatLabels` | `@wil-works/evoke-chat` | https://evoke-business-ui.wil-works.com/chat/chat-subcomponents#chatlabels |
| `useChatLabels` | `@wil-works/evoke-chat` | https://evoke-business-ui.wil-works.com/chat/chat-subcomponents#usechatlabels |
| `createChatTransport` | `@wil-works/evoke-chat` | https://evoke-business-ui.wil-works.com/chat/chat-subcomponents#createchattransport |
| `openai` | `@wil-works/evoke-chat` | https://evoke-business-ui.wil-works.com/chat/chat-subcomponents#openai |
| `anthropic` | `@wil-works/evoke-chat` | https://evoke-business-ui.wil-works.com/chat/chat-subcomponents#anthropic |
| `readSseFrames` | `@wil-works/evoke-chat` | https://evoke-business-ui.wil-works.com/chat/chat-subcomponents#readsseframes |
| `sseFramesOf` | `@wil-works/evoke-chat` | https://evoke-business-ui.wil-works.com/chat/chat-subcomponents#sseframesof |
| `parseSseText` | `@wil-works/evoke-chat` | https://evoke-business-ui.wil-works.com/chat/chat-subcomponents#parsessetext |
| `parseSseFrame` | `@wil-works/evoke-chat` | https://evoke-business-ui.wil-works.com/chat/chat-subcomponents#parsesseframe |
| `streamChunks` | `@wil-works/evoke-chat` | https://evoke-business-ui.wil-works.com/chat/chat-subcomponents#streamchunks |

