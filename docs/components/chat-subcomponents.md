# 对话子组件

`EbChatbot` 之外的家族成员。**绝大多数场景不需要直接用它们**——`EbChatbot` 已经把这些组装好了。它们用于两种情形：只想要其中一块（比如独立渲染一段 Markdown），或要自己编排（`ChatList` + 自定义发送区）。

下表标题即导出名——`EbChatMessage`、`EbChatSender` 这样带 `Eb` 前缀整名导出。

## 结构类

### EbChatContent

面板外壳：固定尺寸、可选边框、头部/底部槽位。`EbChatbot` 用它包住消息区与输入区。

| Props | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `height` / `width` | string \| number | `100%` | 数字按 px 处理 |
| `bordered` | boolean | `false` | 加边框，并给头尾加分隔线 |

| Slots | 说明 |
| --- | --- |
| `header` | 面板顶部 |
| `footer` | 面板底部 |
| 默认 | 主体内容（不自动滚动，滚动由 `ChatList` 负责） |

### EbChatList

消息滚动容器。负责自动贴底、`role="log"` 流式播报、回到底部钮、空态；不负责发送。

| Props | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `messages` | array | `[]` | 消息数组 |
| `showThinking` / `renderMode` / `autoScroll` | — | `true` / `markdown` / `true` | 透传给每条消息 |
| `avatarUser` / `avatarAssistant` / `userName` / `assistantName` | — | — / 我 / AI助手 | 透传 |
| `actions` | array | `[]` | 动作条自定义动作 |
| `editable` / `editMaxLength` | boolean / number | `false` / `0` | 用户消息可编辑重发 |
| `feedback` / `feedbackReasons` | boolean / array | `false` / `[]` | 评审与原因词汇表 |
| `toolRetryable` | boolean | `true` | 失败的工具卡给不给重试钮 |

| Events | 载荷 |
| --- | --- |
| `copy` / `regenerate` / `edit` / `feedback` / `suggestion-click` / `citation-click` / `tool-retry` | 见 [Chatbot 对话窗口](/components/chatbot) 同名事件 |
| `action` | `(key, message)` |
| `scroll` | 原生滚动事件 |

| Slots | 说明 |
| --- | --- |
| `message` | 整条接管；作用域 `{ message, index, isLast, itemProps }`，用 `v-bind="p.itemProps"` 回落默认渲染 |
| `message-content` | 只换正文；作用域 `{ message, content, renderMode, streaming }` |
| `header` / `empty` | 消息区顶部 / 空态 |

默认槽产出为空时 Vue 会回落默认渲染——不能靠"某几行留空"隐藏消息。

### EbChatMessage

单条消息。按 role 分流：`user` / `assistant` 是对话气泡，`system` / `notice` 是居中弱化的系统提示（无头像、昵称、动作条）。

Props 与 `ChatList` 的透传面一致，外加 `message` 本身。

| Events | 载荷 |
| --- | --- |
| `copy` / `regenerate` / `edit` / `feedback` / `suggestion-click` / `citation-click` / `tool-retry` | 见 [Chatbot](/components/chatbot) |

| Slots | 说明 |
| --- | --- |
| `content` | 只换气泡内正文；作用域 `{ message, content, renderMode, streaming }` |

消息项的字段：`{ id, role, content, status, thinking?, thinkContent?, attachments?, suggestions?, feedback?, feedbackReasons?, feedbackNote?, edited?, citations?, toolCalls?, duration?, error? }`，`status` 取 `pending / streaming / done / error / cancelled`。

### EbChatMarkdown

Markdown 渲染器：GFM 表格与任务列表、代码块工具条（语言标签 + 复制）、自定义协议引用芯片、`source:` 行内引用上标、流式拖尾。原文 HTML 一律转义为纯文本；图片 `src` 只放行 `http` / `https` / `data`。

| Props | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `content` | string | `''` | Markdown 原文 |
| `streaming` | boolean | `false` | 流式态：末尾补拖尾，重解析按帧合并 |

| Events | 载荷 |
| --- | --- |
| `citation-click` | `(id)` 行内引用上标被点击或回车 |

管线配置（协议白名单、主题色、追加高亮语言）见 [Chatbot 的正文渲染配置](/components/chatbot#正文渲染配置)。

## 过程类

### EbChatThinking

思考过程折叠块。流式期间强制展开，结束后回到用户可控的折叠态。`{ content, thinking, duration }`，无事件。

### EbChatLoading

三点起伏的打字指示。可选 `text` 文案。

### EbChatToolCall

工具调用卡：状态标记（等待/执行/失败/完成）、耗时、参数与结果的折叠展开，失败态给重试钮。

| Props | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `toolCall` | object | `{}` | `{ id, name, label?, args?, result?, status, duration?, error? }` |
| `expanded` | boolean | 自动 | 未指定时有参数或结果才可展开 |
| `retryable` | boolean | `true` | 失败态是否给重试钮 |

| Events | 载荷 |
| --- | --- |
| `toggle` | `(toolCall, open)` |
| `retry` | `(toolCall)` |

| Slots | 作用域 |
| --- | --- |
| `args` / `result` | `{ toolCall }`，可换成 `EbJsonViewer` 等 |

参数与结果默认走带环检测的 JSON `<pre>`（宿主传入的对象常带循环引用）。

### EbChatSources

来源引用卡列表：序号 / favicon / 标题 / 域名 / 摘要，可折叠。点击上标会自动展开并高亮对应卡片——该联动由 `ChatMessage` 内部接好，单独用时可调 `highlight(id)`（经 `defineExpose`）。

| Props | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `items` | array | `[]` | `{ id?, index?, title, url?, source?, snippet?, favicon? }` |
| `collapsible` | boolean | `true` | 关掉就是常驻列表 |
| `defaultOpen` | boolean | `true` | 初始展开 |

| Events | 载荷 |
| --- | --- |
| `item-click` | `(item, index)` |

## 代码 agent 三卡

`EbChatDiff` · `EbChatTerminal` · `EbChatFileTree`

三者都**零额外依赖**：diff 是纯解析 + CSS，终端自己解最小 ANSI（8/16 色 + 加粗），文件树是嵌套列表。

<DemoBlock>
  <div style="display: flex; flex-direction: column; gap: 12px;">
    <eb-chat-diff :diff="DEMO_DIFF" :max-height="200" />
    <eb-chat-terminal
      command="npm run test -- --reporter=dot"
      :output="DEMO_TERMINAL"
      :exit-code="0"
      :max-height="160"
    />
    <eb-chat-file-tree :files="DEMO_FILES" style="max-width: 420px" />
  </div>
</DemoBlock>

### EbChatDiff

吃标准统一 diff 文本（`git diff` 与各家 agent 输出的那种），按文件分组，头部给路径与 `+N −M`，行按增/删/上下文着色，带 old/new 双行号栅格。

`{ diff, showLineNumbers, collapsible, defaultOpen, maxHeight }`，抛 `toggle(index, open)` / `copy(rawDiff)`。**复制出去的是原始 diff 文本**，不是渲染结果（行号在 `aria-hidden` 的独立栅格里，不会被选进复制内容）。

认不出的行按上下文处理——宁可少染一点色，也不猜错语义。

### EbChatTerminal

命令输出卡：头部给命令与退出码，正文等宽渲染，`status: 'running'` 时末尾有光标。**长输出只渲染尾部**（默认 40 行），给省略数与展开入口——命令输出动辄上千行，全渲染会拖垮消息列。

ANSI 只认 8/16 色前景与加粗，其余码忽略（不认识的样式宁可不染）。安全性上先把文本转义、再只把解析器自己构造的 `span` 拼进去，原文里的任何字符都不会被当标记透传。

`{ command, output, status, exitCode, collapsible, defaultOpen, maxHeight, tailLines }`，抛 `toggle(open)` / `copy(纯文本)`。

### EbChatFileTree

扁平路径列表 → 嵌套树。目录在前、名称升序；文件带类型图标、状态徽标（新增/修改/删除/重命名）与增删行数。目录默认展开，折叠状态 `aria-expanded` 完整。

`{ files: [{ path, status?, additions?, deletions? }], defaultExpandAll }`，抛 `select(file, path)` / `toggle(path, open)`。

### 怎么接到消息上

**diff 与终端不加消息字段**——`EbChatToolCall` 的 `#result` 插槽就是为它们留的扩展点：

```vue
<eb-chatbot v-model="messages">
  <template #message="p">
    <eb-chat-message v-bind="p.itemProps">
      <template #content>
        <component :is="renderBody(p.message)" />
      </template>
    </eb-chat-message>
  </template>
</eb-chatbot>
```

更直接的写法是逐条接管工具卡的结果区：

```vue
<eb-chat-message :message="msg">
  <template #tool-result="{ toolCall }">
    <eb-chat-terminal
      v-if="toolCall.name === 'run_tests'"
      :command="toolCall.label"
      :output="toolCall.result"
      :exit-code="toolCall.exitCode"
    />
    <eb-chat-diff v-else-if="toolCall.resultType === 'diff'" :diff="toolCall.result" />
  </template>
</eb-chat-message>
```

**文件树**是改动集汇总、不属于单个工具，所以给了消息级字段 `message.fileTree`，渲染在产物之后，抛 `file-select(file, path, message)`。

## EbChatShare 会话分享弹层

收集「可见范围 + 有效期」，链接的生成与权限校验由你的服务端负责——组件**不发请求**；`link` 为空是配置态、非空是已创建态。

```vue
<eb-chat-share
  v-model="shareOpen"
  v-model:scope="scope"
  v-model:expiry="expiry"
  :title="activeThread?.title"
  :link="shareLink"
  :creating="creating"
  @create="createLink"
  @revoke="revokeLink"
/>
```

`create` 触发时按当前 `scope` / `expiry` 去你的服务端换链接，把结果回灌给 `link`，弹层即切到已创建态。`scopes` / `expiries` 可整组替换，默认给「任何人可查看 / 仅本组织 / 仅受邀成员」与「7 天 / 30 天 / 永久」。

<DemoBlock>
  <eb-button @click="shareOpen = true">打开分享弹层</eb-button>
  <eb-chat-share
    v-model="shareOpen"
    v-model:scope="shareScope"
    v-model:expiry="shareExpiry"
    :title="'季度报表口径对齐'"
    :link="shareLink"
    :creating="shareCreating"
    @create="createShare"
    @revoke="revokeShare"
  />
  <div style="margin-top: 8px; font-size: 12px; color: var(--eb-text-color-secondary);">{{ shareHint }}</div>
</DemoBlock>

## 语音：朗读与口述

两个 composable 提供能力，两个按钮组件提供入口。**都按 Web Speech API 的能力检测决定给不给入口**——Firefox 目前没有 `SpeechRecognition`，Safari 部分版本只认 `webkit` 前缀；不支持时 `supported` 为 `false`、按钮整个不渲染，调用 `speak` / `start` 也是安全空操作。

### 朗读（`useSpeech` · `EbChatSpeak`）

```js
const { supported, speaking, speak, stop } = useSpeech({ lang: 'zh-CN', rate: 1 })
speak('念这段')   // 空文本返回 false；再点会先 cancel 上一条
```

`EbChatSpeak` 是动作条上的那颗按钮（图标 `volume`，朗读中转 `pause` 并脉动）。**开箱用法**是开 `speech` 开关，它会自动出现在助手消息上、用户消息上没有：

```vue
<eb-chatbot v-model="messages" speech />
```

单实例单次朗读：同一条里再次点击会先停掉上一条，避免多条消息同时念。

### 口述（`useSpeechInput` · `EbChatVoiceInput`）

```js
const { supported, listening, error, start, stop, toggle } = useSpeechInput({
  lang: 'zh-CN',
  onInterim: (text) => { /* 临时结果：覆盖填充输入框 */ },
  onFinal: (text) => { /* 定稿片段：追加，光标不跳 */ },
  onError: (code) => { /* not-allowed / no-speech / network ... */ },
})
```

结果分两路是刻意的：临时结果随时在变，直接覆盖填充；定稿才追加，这样光标不会往回跳。一次定稿多句时逐段交出，不拼成一坨。

`EbChatVoiceInput` 是独立按钮，丢进输入区**已有的插槽**即可，不需要改 composer：

```vue
<eb-chatbot v-model="messages" v-model:input-value="draft">
  <template #sender-toolbar>
    <eb-chat-voice-input lang="zh-CN" @interim="draft = $event" @result="draft += $event" />
  </template>
</eb-chatbot>
```

`EbAiPromptBox` 侧同理走 `#toolbar-extra`。

<DemoBlock>
  <eb-chatbot v-model="speechMsgs" speech height="280px" :show-tip="false" />
  <div style="margin-top: 8px; font-size: 12px; color: var(--eb-text-color-secondary);">
    {{ speechHint }}
  </div>
</DemoBlock>

## 生成中的输入：排队与转向

此前生成期间发出的消息会被**静默丢弃**（`sendMessage` 在 loading 时直接 return）。现在默认改为**排队**，并在每轮结束后自动带出下一条。

```js
const engine = useChatEngine({ transport })

engine.sendMessage('第一个问题')
engine.sendMessage('第二个问题')   // 返回 'queued'，不丢
engine.pending.value              // [{ id, content, attachments, context }]
engine.dequeue(id) / engine.clearQueue() / engine.flushQueue()
```

`flushQueue()` 生成中不动作、空闲时手动带出一条——自动带出已经接在每轮结束，这个入口留给宿主做「立即发送」。

## 转向（steer）

有的产品希望生成中发出的消息**注入到当前这一轮**（「顺便也看下另一个指标」），而不是等下一轮。这需要宿主能往进行中的请求里塞内容，所以交给宿主：

```js
const engine = useChatEngine({
  transport,
  steerable: true,
  onSteer: (text) => myStream.appendToCurrentRun(text),   // 由你决定怎么注入
})
engine.sendMessage('补充一句')     // 返回 'steered'
```

`steerable` 为真但没给 `onSteer` 时**退回排队**——宁可晚一轮，也不丢。

## 输入区的配合

`EbChatbot` 加 `queueable` 后，生成中 Enter 与发送钮都会照常发出（宿主交给引擎即自动入队）；不开则维持原样「生成中拦下」。与 `stoppable` 互不干扰：停止钮仍是停止钮，点了不会变成发送。

`EbChatQueue` 是待发送队列那条窄带，宿主放在输入区上方即可（`#sender-prepend` 或自己排布）：

```vue
<eb-chatbot v-model="messages" queueable @send="onSend">
  <template #sender-prepend>
    <eb-chat-queue
      :items="engine.pending.value"
      @remove="engine.dequeue"
      @clear="engine.clearQueue"
    />
  </template>
</eb-chatbot>
```

## 输入类

### EbChatSender

输入区：自增高、Enter 发送、IME 组字安全、附件（点选 / 拖拽 / 粘贴）、字数限制、发送↔停止变形。`EbChatbot` 内部用它。

| Props | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `modelValue` | string | `''` | v-model |
| `placeholder` / `disabled` / `loading` | — | — / false / false | — |
| `allowAttachments` / `maxAttachments` | boolean / number | `true` / `5` | — |
| `maxLength` / `showWordCount` | number / boolean | `2000` / `false` | 真正约束 textarea，传 `0` 不限 |
| `minRows` / `maxRows` | number | `1` / `6` | 自增高范围 |
| `sendOnEnter` | boolean | `true` | 关掉后 Enter 只换行 |
| `stoppable` | boolean | `false` | loading 时发送钮变停止钮 |
| `accept` / `maxFileSize` | string / number | — / `0` | 附件类型与体积；拖拽粘贴同样校验 |
| `allowDrop` | boolean | `true` | 允许拖拽与粘贴投递 |

| Events | 载荷 |
| --- | --- |
| `send` | `(text, attachments)` |
| `stop` | — |
| `attachment-add` | `(file, item)`，`item` 是列表内的响应式对象，回写 `status` / `progress` 即驱动状态显示 |
| `attachment-reject` | `(file, reason)`，`reason` 取 `type / size / limit / empty` |

| Slots | 说明 |
| --- | --- |
| `toolbar` | 工具栏（附件按钮右侧） |

### EbChatMessageEdit

用户消息的原地编辑器。Esc 取消、Enter 保存、IME 安全、maxlength 生效。`{ modelValue, placeholder, maxLength, sendOnEnter }`，抛 `save(text)` / `cancel`。

### EbChatSuggestion

追问 chips。`items` 接受 string 或 `{ text, prompt? }`；`layout` 取 `row`（消息尾部）或 `column`（欢迎区）；`icon` 传图标名则每枚前置。抛 `pick({ text, prompt })`。

### EbChatFeedback

点赞点踩。点赞立即提交；点踩展开结构化原因面板与备注。取消评价也会交出 `{ value: null }`——否则宿主存下来的评价清不掉。

| Props | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `value` | `'up' \| 'down' \| null` | `null` | v-model:value |
| `reasons` | array | 内置六项 | 点踩原因词汇表 |
| `showNote` | boolean | `true` | 是否显示备注框 |
| `disabled` | boolean | `false` | — |

| Events | 载荷 |
| --- | --- |
| `submit` | `({ value, reasons, note })`，取消时 `value` 为 `null` |

### EbChatActionbar

消息动作条：复制（内置，含已复制回执）、重新生成（仅 assistant）、编辑（仅 user）、自定义动作。默认悬停显示，`:focus-within` 与触屏常显。

`{ message, actions, showCopy, showRegenerate, showEdit }`，抛 `copy` / `regenerate` / `edit` / `action`。

### EbChatAttachments

附件卡片列表：图片预览或类型图标、文件名、体积、移除钮；宿主回写 `status` 时显示进度条（`uploading` + `progress`）、失败原因（`error`）或已上传（`done`）。`{ attachments, removable }`，抛 `remove(file)`。

<script setup>
import { ref } from 'vue'

// ─── 语音演示 ───
const speechSupported = typeof window !== 'undefined'
  && typeof window.speechSynthesis !== 'undefined'
const speechHint = ref(
  speechSupported
    ? '悬停助手消息，动作条里多了一颗喇叭——点它会用系统语音念出这条回复'
    : '当前浏览器没有 speechSynthesis，朗读钮不会渲染（能力检测生效）'
)
const speechMsgs = ref([
  { id: 'v-1', role: 'user', content: '用一句话介绍这个组件库', status: 'done' },
  {
    id: 'v-2',
    role: 'assistant',
    status: 'done',
    content: 'Evoke Business UI 是一套面向中后台的 Vue 3 组件库，**内置了完整的 AI 对话家族**——从消息流、工具卡到多会话与浮动挂件。',
  },
])

// ─── 分享弹层演示 ───
const shareOpen = ref(false)
const shareScope = ref('anyone')
const shareExpiry = ref('7d')
const shareLink = ref('')
const shareCreating = ref(false)
const shareHint = ref('点「创建链接」看组件如何把意图抛给宿主')
function createShare() {
  // 真实场景：拿 scope/expiry 去服务端换链接
  shareCreating.value = true
  setTimeout(() => {
    shareLink.value = `https://example.com/s/${Math.random().toString(36).slice(2, 8)}`
    shareCreating.value = false
    shareHint.value = '链接已回灌，弹层切到已创建态'
  }, 600)
}
function revokeShare() {
  shareLink.value = ''
  shareHint.value = '已撤销，回到配置态'
}

// ─── 代码 agent 三卡演示数据 ───
const DEMO_DIFF = [
  'diff --git a/src/utils/parse.ts b/src/utils/parse.ts',
  'index a1b2c3d..d4e5f6a 100644',
  '--- a/src/utils/parse.ts',
  '+++ b/src/utils/parse.ts',
  '@@ -12,6 +12,7 @@ export function parse(input: string) {',
  '   const lines = input.split("\\n")',
  '-  return lines.map((l) => l.trim())',
  '+  // 保留缩进：下游靠它判断层级',
  '+  return lines.map((l) => l.replace(/\\s+$/, ""))',
  ' }',
  '',
  'diff --git a/README.md b/README.md',
  '--- a/README.md',
  '+++ b/README.md',
  '@@ -1,2 +1,3 @@',
  ' # 项目说明',
  '+新增了代码 agent 三卡的用法章节。',
  ' 见 docs。',
].join('\n')

const DEMO_TERMINAL = [
  '\u001b[32m✓\u001b[0m parseDiff 单文件单 hunk\n',
  '\u001b[32m✓\u001b[0m parseDiff 多文件各自归组\n',
  '\u001b[31m✗\u001b[0m ansi 换行内序列\n',
  '\u001b[1mTests \u001b[0m 2130 passed\n',
  'Time: 18.2s',
].join('')

const DEMO_FILES = [
  { path: 'docs/components/chat-subcomponents.md', status: 'modified', additions: 42, deletions: 3 },
  { path: 'src/utils/parse.ts', status: 'modified', additions: 2, deletions: 1 },
  { path: 'src/components/ChatDiff.vue', status: 'added', additions: 186 },
  { path: 'src/legacy/old-diff.vue', status: 'deleted', deletions: 88 },
  { path: 'src/ansi.js', status: 'renamed' },
]
</script>
