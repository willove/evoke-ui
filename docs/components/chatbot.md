# Chatbot 对话窗口

开箱可用的 AI 对话窗口：消息流（Markdown 渲染、代码块复制、思考过程、附件、流式光标）、输入区（Enter 发送 / Shift+Enter 换行、输入法组字安全、字数与附件上限、停止生成）、动作条（复制 / 重新生成，键盘与触屏可达）。接口层完全由你承接——`send` 事件拿到输入，回写 `modelValue` 即完成闭环。

## 基础对话

发送后回写消息数组，异步回复用 `loading` 显示打字态：

<DemoBlock>
  <eb-chatbot v-model="messages" :loading="pending" height="360px" :show-tip="false" @send="onSend" />
</DemoBlock>

## 流式输出与思考过程

配合导出的 `useChatEngine` 组装流式会话：`appendContent` 逐段回写正文（状态自动进入 streaming，正文末尾出现流式光标，重解析按帧合并），`appendThinkContent` 写入思考内容（消息上方出现可折叠的思考块，流式期间自动展开、结束后可收起），`completeMessage` 收尾并自动记录回答用时。`regenerate` 事件里删掉旧回复后按上文重新流式输出即可：

<DemoBlock>
  <eb-chatbot v-model="streamMsgs" :loading="streamLoading" height="420px" :show-tip="false" @send="onStreamSend" @regenerate="onStreamRegen" />
</DemoBlock>

## 停止生成与中断态

`stoppable` 让发送钮在 `loading` 期间变成停止钮，点击抛 `stop`（AbortController 由你自持）。中断时把该条消息置为 `cancelled` 而不是 `error`：已流出的正文原地保留，下面挂一行「已停止生成」灰标，而不是整段被红色错误块替换。生成中输入框保持可打字，便于准备下一句；Enter 既不并发投递也不会误触中断。

<DemoBlock>
  <eb-chatbot
    v-model="cancelMsgs"
    :loading="cancelLoading"
    stoppable
    height="300px"
    :show-tip="false"
    @send="onCancelSend"
    @stop="onCancelStop"
  />
</DemoBlock>

<script setup>
import { ref } from 'vue'
import { useChatEngine } from '@wil-works/evoke-business-ui'

const messages = ref([
  { id: 1, role: 'assistant', content: '**你好**，我是接入示例。发送一条消息试试。', status: 'done' },
])
const pending = ref(false)
let seq = 2

const onSend = (text) => {
  messages.value.push({ id: seq++, role: 'user', content: text, status: 'done' })
  pending.value = true
  setTimeout(() => {
    messages.value.push({
      id: seq++,
      role: 'assistant',
      content: `已收到：「${text}」。真实场景在这里请求你的接口。`,
      status: 'done',
    })
    pending.value = false
  }, 800)
}

// ─── 流式输出与思考过程 ───
const {
  messages: streamMsgs,
  createAssistantMessage,
  appendContent,
  appendThinkContent,
  stopThinking,
  completeMessage,
} = useChatEngine()
const streamLoading = ref(false)

streamMsgs.value.push({
  id: 'stream-hello',
  role: 'assistant',
  content: '**发送一条消息**：回复会逐段输出，展开「已深度思考」可查看思考内容。',
  status: 'done',
})

function streamReply(prompt) {
  const msg = createAssistantMessage()
  appendThinkContent(msg.id, `收到「${prompt}」，先拆解问题，再组织语言作答。`)
  streamLoading.value = true
  const reply = `关于「${prompt}」：这是一段模拟流式回复。真实场景中，把服务端返回的增量片段依次传给 appendContent，全部结束后调用 completeMessage，消息会自动带上回答用时。
代码块自带语言标签与复制按钮：

\`\`\`js
function greet(name) {
  return \`hello \${name}\`
}
\`\`\``
  let i = 0
  const timer = setInterval(() => {
    appendContent(msg.id, reply.slice(i, i + 2))
    i += 2
    if (i >= reply.length) {
      clearInterval(timer)
      stopThinking(msg.id)
      completeMessage(msg.id)
      streamLoading.value = false
    }
  }, 30)
}

const onStreamSend = (text) => streamReply(text)

const onStreamRegen = (message) => {
  const list = streamMsgs.value
  const idx = list.findIndex((m) => m.id === message.id)
  if (idx <= 0) return
  let userIdx = idx - 1
  while (userIdx >= 0 && list[userIdx].role !== 'user') userIdx--
  if (userIdx < 0) return
  const prompt = list[userIdx].content
  list.splice(userIdx + 1)
  streamReply(prompt)
}

// ─── 停止生成与中断态 ───
const cancelMsgs = ref([])
const cancelLoading = ref(false)
let cancelTimer = null
let cancelId = ''

function onCancelSend(text) {
  cancelLoading.value = true
  cancelId = `cancel-${Date.now()}`
  const reply = `关于「${text}」的模拟回答会一段一段输出，持续数秒，方便你点右侧的停止钮中断。中断后已流出的正文会原地保留，下方补一行「已停止生成」灰标，而不是整段被红色错误块替换；同时输入框仍可继续打字，Enter 不会误触中断。`
  let i = 0
  const patch = (idx, extra) => {
    const next = [...cancelMsgs.value]
    next[idx] = { ...next[idx], ...extra }
    cancelMsgs.value = next
  }
  cancelMsgs.value = [
    ...cancelMsgs.value,
    { id: cancelId, role: 'assistant', content: '', status: 'pending' },
  ]
  cancelTimer = setInterval(() => {
    const idx = cancelMsgs.value.findIndex((m) => m.id === cancelId)
    if (idx < 0) return clearInterval(cancelTimer)
    i += 5
    patch(idx, { content: reply.slice(0, i), status: 'streaming' })
    if (i >= reply.length) {
      clearInterval(cancelTimer)
      cancelTimer = null
      patch(idx, { status: 'done' })
      cancelLoading.value = false
    }
  }, 120)
}

function onCancelStop() {
  if (cancelTimer) {
    clearInterval(cancelTimer)
    cancelTimer = null
  }
  cancelLoading.value = false
  cancelMsgs.value = cancelMsgs.value.map((m) =>
    m.id === cancelId && m.status === 'streaming' ? { ...m, status: 'cancelled' } : m,
  )
}

// ─── 头像、名称与纯文本 ───
const fancyMsgs = ref([
  {
    id: 'fancy-1',
    role: 'assistant',
    content: '这是**纯文本模式**：Markdown 标记原样展示，例如 `code` 和 **bold**。',
    status: 'done',
  },
])
let fancySeq = 2
const onFancySend = (text) => {
  fancyMsgs.value.push({ id: `fancy-u-${fancySeq}`, role: 'user', content: text, status: 'done' })
  setTimeout(() => {
    fancyMsgs.value.push({
      id: `fancy-a-${fancySeq}`,
      role: 'assistant',
      content: `已收到「${text}」。切换 render-mode 为 markdown 即可恢复解析。`,
      status: 'done',
    })
    fancySeq++
  }, 500)
}

// ─── 追问建议、评价与编辑重发 ───
const baLog = ref(['试试：点回答下方的追问 chips / 点赞或点踩 / 悬停你的提问点「编辑」'])
let baSeq = 0
const baMsgs = ref([
  { id: 'ba-u1', role: 'user', content: '帮我对比一下批 A 的三个组件', status: 'done' },
  {
    id: 'ba-a1',
    role: 'assistant',
    status: 'done',
    content: '**ChatSuggestion** 在回答尾部给可点的追问 chips；**ChatFeedback** 收点赞点踩与结构化原因；**ChatMessageEdit** 让你改自己的提问后就地重发。',
    suggestions: ['三个组件分别怎么用？', '点踩的理由能自定义吗？'],
  },
])
function pushBaLog(text) {
  baLog.value = [`${++baSeq}. ${text}`, ...baLog.value].slice(0, 4)
}
function baReply(prompt) {
  return {
    id: `ba-a-${Date.now()}`,
    role: 'assistant',
    status: 'done',
    content: `已收到「${prompt}」。真实场景在这里请求你的接口。`,
    suggestions: ['再说说批 B 的来源引用'],
  }
}
function onBaSend(text) {
  baMsgs.value = [...baMsgs.value, { id: `ba-u-${Date.now()}`, role: 'user', content: text, status: 'done' }, baReply(text)]
}
function onBaSuggest(text) {
  pushBaLog(`suggestion-click：${text}`)
  onBaSend(text)
}
function onBaEdit(message, content) {
  const idx = baMsgs.value.findIndex((m) => m.id === message.id)
  if (idx < 0) return
  // 截断该提问之后的消息、换成新文再重出回答；引擎侧 editAndResend 是同语义的现成实现
  baMsgs.value = [...baMsgs.value.slice(0, idx), { ...baMsgs.value[idx], content, edited: true }, baReply(content)]
  pushBaLog(`edit：「${message.content}」→「${content}」`)
}
function onBaFeedback(message, payload) {
  const idx = baMsgs.value.findIndex((m) => m.id === message.id)
  if (idx < 0) return
  baMsgs.value = [
    ...baMsgs.value.slice(0, idx),
    { ...baMsgs.value[idx], feedback: payload.value, feedbackReasons: payload.reasons, feedbackNote: payload.note },
    ...baMsgs.value.slice(idx + 1),
  ]
  pushBaLog(`feedback：${payload.value ?? '已取消'}${payload.reasons.length ? `（${payload.reasons.join('、')}）` : ''}`)
}

// ─── 自定义动作与事件埋点 ───
const chatActions = [
  { key: 'collect', label: '收藏', icon: 'star' },
  { key: 'share', label: '分享', icon: 'share' },
]
const actionMsgs = ref([
  { id: 'act-1', role: 'assistant', content: '悬停本条消息可见动作条：内置复制 / 重新生成，右侧为 actions 自定义动作。', status: 'done' },
])
const actionLog = ref(['试试复制、收藏或重新生成这条消息'])
let actionLogSeq = 1
function pushActionLog(text) {
  actionLog.value = [`${actionLogSeq++}. ${text}`, ...actionLog.value].slice(0, 4)
}
const onActionSend = (text) => {
  actionMsgs.value.push({ id: `act-u-${Date.now()}`, role: 'user', content: text, status: 'done' })
  setTimeout(() => {
    actionMsgs.value.push({
      id: `act-a-${Date.now()}`,
      role: 'assistant',
      content: `已收到「${text}」。悬停本条消息试试动作条。`,
      status: 'done',
    })
  }, 500)
}
const onActionCopy = (message) => pushActionLog(`copy：已复制「${String(message.content).slice(0, 10)}…」`)
const onActionRegen = (message) => {
  const idx = actionMsgs.value.findIndex((m) => m.id === message.id)
  if (idx > -1) actionMsgs.value.splice(idx, 1)
  pushActionLog('regenerate：删除旧回复并重新请求')
  setTimeout(() => {
    actionMsgs.value.push({ id: `act-a-${Date.now()}`, role: 'assistant', content: '这是重新生成的新回复，埋点由页面自行上报。', status: 'done' })
  }, 500)
}
const onActionKey = (key, message) => {
  const hit = chatActions.find((a) => a.key === key)
  pushActionLog(`action：${key}${hit ? `（${hit.label}）` : ''}，消息 id ${message.id}`)
}

// ─── 附件与输入控制 ───
const limitMsgs = ref([
  { id: 'limit-1', role: 'assistant', content: '输入上限 30 字并显示字数；可添加最多 2 个附件；Enter 换行，点发送按钮提交。', status: 'done' },
])
const limitLog = ref([])
const onLimitSend = (text, attachments) => {
  limitMsgs.value.push({ id: `limit-u-${Date.now()}`, role: 'user', content: text, attachments: attachments.length ? attachments : undefined, status: 'done' })
  setTimeout(() => {
    limitMsgs.value.push({
      id: `limit-a-${Date.now()}`,
      role: 'assistant',
      content: `已收到「${text}」${attachments.length ? `（含 ${attachments.length} 个附件）` : ''}。`,
      status: 'done',
    })
  }, 500)
}
const onAttachmentAdd = (file) => {
  limitLog.value = [`attachment-add：${file.name}`, ...limitLog.value].slice(0, 3)
}

// ─── 来源引用与行内上标 ───
const citeHint = ref('点正文里的上标试试')
const citeMsgs = ref([
  {
    id: 'cite-a1',
    role: 'assistant',
    status: 'done',
    content:
      '深海热泉口化能合成生态系统的能量来源不依赖阳光[1](source:c1 "Nature Reviews Microbiology")，' +
      '初级生产者主要是硫氧化菌[2](source:c2 "维基百科：热泉口")。',
    citations: [
      {
        id: 'c1',
        title: 'Chemolithotrophy at deep-sea hydrothermal vents',
        url: 'https://journal.example.org/nrm/chemolithotrophy',
        source: 'Nature Reviews Microbiology',
        snippet: '综述热泉口化能合成群落的能量通量与微生物组成。',
      },
      {
        id: 'c2',
        title: '热泉口 - 维基百科',
        url: 'https://example.org/wiki/hydrothermal-vent',
        source: '维基百科',
        snippet: '初级生产者以硫化氢氧化获取能量。',
      },
    ],
  },
])
function onCiteClick(id) {
  citeHint.value = `citation-click：已定位到来源 ${id}`
}

// ─── 工具调用卡 ───
const toolHint = ref('展开某一步看参数与结果；失败那步有重试钮')
const toolMsgs = ref([
  { id: 'tool-u1', role: 'user', content: '查一下热泉口化能合成的最新进展并算一下能量通量', status: 'done' },
  {
    id: 'tool-a1',
    role: 'assistant',
    status: 'done',
    content: '已完成检索与计算，结论见上。',
    toolCalls: [
      {
        id: 'tc1',
        name: 'web_search',
        label: '搜索网页',
        status: 'done',
        duration: 820,
        args: { query: 'hydrothermal vent chemolithotrophy 2026', topK: 5 },
        result: { hits: 5, first: 'Nature Reviews Microbiology' },
      },
      {
        id: 'tc2',
        name: 'read_page',
        status: 'error',
        error: '目标站点 403，已跳过该来源',
        args: { url: 'https://journal.example.org/nrm/chemolithotrophy' },
      },
      {
        id: 'tc3',
        name: 'calc',
        label: '能量通量估算',
        status: 'done',
        duration: 40,
        args: { sulfide_flux: 12.5, efficiency: 0.32 },
        result: '≈ 4.0 mol·m⁻²·d⁻¹',
      },
    ],
  },
])
function onToolRetry(toolCall, message) {
  toolHint.value = `tool-retry：准备重放 ${toolCall.name}（消息 ${message.id}）`
}

// ─── 消息级插槽 ───
const msgSlotMsgs = ref([
  { id: 'sl-u1', role: 'user', content: '这句走自定义', status: 'done' },
  { id: 'sl-a1', role: 'assistant', content: '这条走**默认渲染**', status: 'done' },
])

// ─── 自定义区域与实例方法 ───
const slotChatRef = ref(null)
const slotMsgs = ref([])
const slotInput = ref('')
const onSlotSend = (text) => {
  slotMsgs.value.push({ id: `slot-u-${Date.now()}`, role: 'user', content: text, status: 'done' })
  setTimeout(() => {
    slotMsgs.value.push({
      id: `slot-a-${Date.now()}`,
      role: 'assistant',
      content: `这是「${text}」的回复。标题栏、空态与底部提示均来自页面插槽。`,
      status: 'done',
    })
  }, 500)
}
const onSlotFocus = () => slotChatRef.value?.focus()
const onSlotScroll = () => slotChatRef.value?.scrollToBottom(true)
const onSlotClear = () => {
  slotChatRef.value?.reset()
  slotMsgs.value = []
}
</script>

## 头像、名称与纯文本

`user-name` / `assistant-name` 决定双方昵称与头像首字，`avatar-user` / `avatar-assistant` 传图片地址可替换为图片头像；`render-mode` 切换为 `text` 后消息不再解析 Markdown，适合展示日志、代码原文等纯文本：

<DemoBlock>
  <eb-chatbot
    v-model="fancyMsgs"
    user-name="王工"
    assistant-name="小 Ev"
    render-mode="text"
    height="340px"
    :show-tip="false"
    @send="onFancySend"
  />
</DemoBlock>

## 自定义动作与事件埋点

`actions` 在助手消息的动作条上追加自定义动作（`{ key, label, icon? }`，icon 使用组件库图标名）；`copy` / `regenerate` / `action` 事件把消息对象透传给页面，在此上报埋点或执行业务逻辑。动作条悬停消息时显示：

<DemoBlock>
  <eb-chatbot
    v-model="actionMsgs"
    :actions="chatActions"
    height="320px"
    :show-tip="false"
    @send="onActionSend"
    @copy="onActionCopy"
    @regenerate="onActionRegen"
    @action="onActionKey"
  />
  <div style="margin-top: 8px; font-size: 12px; color: var(--eb-text-color-secondary);">
    <p v-for="(line, idx) in actionLog" :key="idx" style="margin: 2px 0;">{{ line }}</p>
  </div>
</DemoBlock>

## 追问建议、评价与编辑重发

`editable` 给你的消息加「编辑」，点开后原地变输入框，保存抛 `edit`（原文与新文两参）；`feedback` 在助手回答下加点赞点踩，点踩会展开结构化原因与备注面板，提交抛 `feedback`（消息 + `{ value, reasons, note }`）；回答尾部的追问 chips 来自消息的 `suggestions` 字段，点击抛 `suggestion-click`。三者都由 `modelValue` 承载状态，宿主负责回写：

<DemoBlock>
  <eb-chatbot
    v-model="baMsgs"
    editable
    feedback
    height="400px"
    :show-tip="false"
    @send="onBaSend"
    @edit="onBaEdit"
    @feedback="onBaFeedback"
    @suggestion-click="onBaSuggest"
  />
  <div style="margin-top: 8px; font-size: 12px; color: var(--eb-text-color-secondary);">
    <p v-for="(line, idx) in baLog" :key="idx" style="margin: 2px 0;">{{ line }}</p>
  </div>
</DemoBlock>

## 来源引用与行内上标

消息带 `citations` 数组即渲染来源卡列表（序号 / favicon / 标题 / 域名 / 摘要，可折叠）。正文里的行内引用用 **`source:` 协议**书写——`[1](source:c1)` 渲染成可点击上标，点击会展开来源列表并高亮对应卡片，同时抛 `citation-click`：

<DemoBlock>
  <eb-chatbot v-model="citeMsgs" height="320px" :show-tip="false" @citation-click="onCiteClick" />
  <div style="margin-top: 8px; font-size: 12px; color: var(--eb-text-color-secondary);">
    {{ citeHint }}
  </div>
</DemoBlock>

链接文字是纯数字就直接用作序号；不是数字则按本次渲染递增分配。刻意不做裸 `[1]` 自动识别——那会和有序列表、脚注、代码里的方括号打架；宿主若拿到的是 Perplexity 风格的裸数字，在自己的 transport 里改写成 `[n](source:id)` 即可。

## 工具调用卡

消息带 `toolCalls` 数组即在正文之前渲染执行轨迹（先执行再作答）：每步一行，带状态标记、状态文案与耗时，有参数或结果时可展开。多个步骤自动归到「执行了 N 个步骤」组标题下。失败态给重试钮，点击抛 `tool-retry`（工具调用 + 消息两参）。

配合 `useChatEngine` 的状态机驱动：`startToolCall(msgId, { name, args })` 新建并转执行中（传已存在的 `id` 则复用），`completeToolCall(msgId, callId, result)` 收尾并自动记耗时，`failToolCall(msgId, callId, error)` 转失败。参数与结果默认走带环检测的 JSON `<pre>`，宿主可用 `#args` / `#result` 插槽换成 `EbJsonViewer` 等。

<DemoBlock>
  <eb-chatbot v-model="toolMsgs" height="420px" :show-tip="false" @tool-retry="onToolRetry" />
  <div style="margin-top: 8px; font-size: 12px; color: var(--eb-text-color-secondary);">
    {{ toolHint }}
  </div>
</DemoBlock>

## 消息级插槽

`message` 插槽接管整条消息的渲染，作用域参数给 `message` / `index` / `isLast` / `itemProps`（`itemProps` 就是 `ChatList` 本来要传给内部 `ChatMessage` 的全量 props）。只想让某几类消息长得不一样、其余照旧，用 `itemProps` 显式回落即可，不必自己重接头像与动作条：

<DemoBlock>
  <eb-chatbot v-model="msgSlotMsgs" height="300px" :show-tip="false">
    <template #message="p">
      <div v-if="p.message.role === 'user'" class="mine-user">
        我自己说的：{{ p.message.content }}
      </div>
      <eb-chat-message v-else v-bind="p.itemProps" />
    </template>
  </eb-chatbot>
</DemoBlock>

只换正文、保留消息外壳（头像 / 思考块 / 工具卡 / 来源卡 / 动作条）用 `message-content`，作用域参数给 `message` / `content` / `renderMode` / `streaming`。两者同时给以 `message` 为准。`EbChatMessage` 单独使用时对应插槽名为 `content`。

一点要注意：插槽**产出为空时 Vue 会回落默认渲染**（空模板、仅注释、`v-if` 为假都算空）。所以不能靠「把不想显示的行留空」来隐藏消息——那样得到的是默认渲染，不是空白。

## 附件与输入控制

`max-length` 限制输入长度，`show-word-count` 显示字数；`max-attachments` 限制附件数量（图片自动生成预览）；`send-on-enter` 关闭后 Enter 只换行，需点击发送按钮提交。选中的附件经 `attachment-add` 事件通知页面，可在此做类型或大小校验：

<DemoBlock>
  <eb-chatbot
    v-model="limitMsgs"
    :max-length="30"
    show-word-count
    :max-attachments="2"
    :send-on-enter="false"
    placeholder="输入内容，Enter 换行，点右侧按钮发送"
    height="300px"
    :show-tip="false"
    @send="onLimitSend"
    @attachment-add="onAttachmentAdd"
  />
  <div style="margin-top: 8px; font-size: 12px; color: var(--eb-text-color-secondary);">
    <p v-for="(line, idx) in limitLog" :key="idx" style="margin: 2px 0;">{{ line }}</p>
  </div>
</DemoBlock>

## 自定义区域与实例方法

`header` 定制面板标题栏，`empty` 定制空会话占位，`tip` 替换底部提示，`sender-toolbar` 在输入框工具栏追加按钮（示例配合 `v-model:input-value` 受控输入）；实例方法 `focus()` / `scrollToBottom(smooth)` / `reset()` 支持外部操控，注意 `reset()` 不会回写 `v-model`，受控使用时需同步清空绑定数组：

<DemoBlock>
  <div style="margin-bottom: 8px; display: flex; gap: 8px;">
    <eb-button @click="onSlotFocus">聚焦输入框</eb-button>
    <eb-button @click="onSlotScroll">滚动到底部</eb-button>
    <eb-button @click="onSlotClear">清空会话</eb-button>
  </div>
  <eb-chatbot
    ref="slotChatRef"
    v-model="slotMsgs"
    v-model:input-value="slotInput"
    height="360px"
    @send="onSlotSend"
  >
    <template #header>
      <div style="padding: 12px 16px; font-size: 14px; font-weight: 600; border-bottom: 1px solid var(--eb-border-color-lighter); display: flex; align-items: center; gap: 8px;">
        工单智能助手
        <span style="font-size: 12px; font-weight: 400; color: var(--eb-color-primary); background: var(--eb-color-primary-light-9); border-radius: 4px; padding: 1px 8px;">Beta</span>
      </div>
    </template>
    <template #empty>
      <div style="text-align: center; color: var(--eb-text-color-placeholder);">
        <eb-icon name="message" :size="28" />
        <p style="margin-top: 8px; font-size: 13px;">还没有消息，输入问题开始对话</p>
      </div>
    </template>
    <template #sender-toolbar>
      <eb-button text @click="slotInput = '请介绍一下你能处理哪些工单类型'">
        <eb-icon name="lightbulb" />
        插入常用语
      </eb-button>
    </template>
    <template #tip>内容由演示服务生成，仅用于组件体验</template>
  </eb-chatbot>
</DemoBlock>

## 正文渲染配置

对话正文的 Markdown 管线从包入口导出四个函数，宿主可在挂载前统一调配置：

```js
import {
  configureChatMarkdown,
  getChatMarkdownConfig,
  renderChatMarkdown,
  registerHighlightLanguage,
} from '@wil-works/evoke-business-ui'

// 自定义协议链接的主题色（默认 entity→primary、doc→info、action→danger …）
configureChatMarkdown({ protocolThemes: { ticket: 'warning' } })

// 放行宿主自己的协议；data: 默认不在链接白名单内（聊天内容不可信）
configureChatMarkdown({ standardProtocols: { add: ['https'] } })

// 默认高亮只带 highlight.js/lib/common 的 36 种语言，冷门语言自行注册
import cobol from 'highlight.js/lib/languages/cobol'
registerHighlightLanguage('cobol', cobol)
```

安全边界（都是刻意选择，不是漏做）：正文里的 raw HTML 一律转义为纯文本展示，`<script>` / `<iframe>` / 注释都进不来；链接协议走白名单，非白名单协议降级成可配置的引用芯片；**图片 `src` 只放行 `http` / `https` / `data`**，其余协议退回可读纯文本，并统一补 `loading="lazy"` 与 `referrerpolicy="no-referrer"`。

已知未接：**脚注**。marked v18 不带脚注扩展，`[^1]` 此前会被误解析成一个指向定义文本的假链接，现在退回原样文本（不再产错，但也还没有上标 + 尾注列表）。完整支持需要接一个脚注扩展，另列一项。

## API

<ApiTable title="Chatbot Props" :rows="[
  { name: 'modelValue', desc: '消息数组，配合 v-model 使用；项为 { id, role, content, status, thinking?, attachments?, suggestions?, feedback?, feedbackReasons?, feedbackNote?, edited?, citations?, toolCalls? }，status 取 pending / streaming / done / error / cancelled', type: 'array', default: '[]' },
  { name: 'input-value', desc: '受控输入框内容，配合 v-model:input-value 使用', type: 'string', default: '—' },
  { name: 'loading', desc: '回复生成中（ assistant 打字态）', type: 'boolean', default: 'false' },
  { name: 'render-mode', desc: '消息渲染方式：markdown / 纯文本', type: 'markdown | text', default: 'markdown' },
  { name: 'placeholder', desc: '输入框占位文案', type: 'string', default: '输入消息，按 Enter 发送，Shift+Enter 换行' },
  { name: 'height / width', desc: '容器尺寸', type: 'string | number', default: '600px / 100%' },
  { name: 'send-on-enter', desc: 'Enter 发送、Shift+Enter 换行；关闭后 Enter 换行。输入法组字中的 Enter 始终交还输入法，不会误发', type: 'boolean', default: 'true' },
  { name: 'max-length / show-word-count', desc: '输入上限（真正约束 textarea，传 0 不限长）与字数统计', type: 'number / boolean', default: '2000 / false' },
  { name: 'stoppable', desc: '生成中发送钮切换为停止钮，点击抛 stop', type: 'boolean', default: 'false' },
  { name: 'allow-attachments / max-attachments', desc: '附件开关与上限', type: 'boolean / number', default: 'true / 5' },
  { name: 'show-thinking', desc: '是否展示消息的思考过程折叠块', type: 'boolean', default: 'true' },
  { name: 'actions', desc: '消息动作条自定义动作 { key, label, icon? }', type: 'array', default: '[]' },
  { name: 'editable', desc: '用户消息可原地编辑并重发（动作条加「编辑」）', type: 'boolean', default: 'false' },
  { name: 'edit-max-length', desc: '编辑框输入上限，传 0 不限长', type: 'number', default: '0' },
  { name: 'feedback', desc: '助手消息显示点赞点踩；点踩展开结构化原因面板', type: 'boolean', default: 'false' },
  { name: 'feedback-reasons', desc: '点踩原因词汇表；不传用内置六项', type: 'array', default: '[]' },
  { name: 'tool-retryable', desc: '失败的工具调用卡是否给重试钮', type: 'boolean', default: 'true' },
  { name: 'user-name / assistant-name', desc: '双方显示名（同时决定默认头像首字）', type: 'string', default: '我 / AI助手' },
  { name: 'avatar-user / avatar-assistant', desc: '双方头像图片地址', type: 'string', default: '' },
  { name: 'auto-scroll', desc: '新消息自动滚动到底部', type: 'boolean', default: 'true' },
  { name: 'show-tip', desc: '是否展示底部提示，可用 #tip 插槽替换', type: 'boolean', default: 'true' },
  { name: 'disabled', desc: '整体禁用', type: 'boolean', default: 'false' },
]" />

<ApiTable title="Chatbot Events" :rows="[
  { name: 'send', desc: '发送消息（文本 + 附件），回写 modelValue 完成闭环', type: '(text: string, attachments: array) => void', default: '—' },
  { name: 'stop', desc: '点击停止钮（stoppable 且生成中），在此中断请求并把该条消息置为 cancelled', type: '() => void', default: '—' },
  { name: 'copy', desc: '消息复制（动作条透传）', type: '(message) => void', default: '—' },
  { name: 'regenerate', desc: '重新生成（动作条透传，由页面删旧回复并重新请求）', type: '(message) => void', default: '—' },
  { name: 'action', desc: 'actions 自定义动作点击', type: '(key: string, message) => void', default: '—' },
  { name: 'edit', desc: '用户消息编辑后保存（组件只交出文本，重发由你驱动引擎 editAndResend 或自行截断）', type: '(message, content: string) => void', default: '—' },
  { name: 'feedback', desc: '评价提交；取消时 payload.value 为 null', type: '(message, { value, reasons, note }) => void', default: '—' },
  { name: 'suggestion-click', desc: '点击回答尾部的追问 chip', type: '(text: string, suggestion, message) => void', default: '—' },
  { name: 'citation-click', desc: '点击正文里的引用上标（来源卡会自动展开并高亮，此处供埋点或自定义跳转）', type: '(id: string, message) => void', default: '—' },
  { name: 'tool-retry', desc: '点击失败工具调用卡的重试钮', type: '(toolCall, message) => void', default: '—' },
  { name: 'attachment-add', desc: '选择附件文件后触发，可在此做类型或大小校验', type: '(file: File) => void', default: '—' },
]" />

<ApiTable title="Chatbot Slots" :rows="[
  { name: 'header', desc: '面板顶部标题栏', type: '—', default: '—' },
  { name: 'empty', desc: '空消息占位内容', type: '—', default: '—' },
  { name: 'message-header', desc: '消息区顶部（仅有消息时渲染）', type: '—', default: '—' },
  { name: 'sender-prepend / sender-append', desc: '输入区左右扩展位', type: '—', default: '—' },
  { name: 'sender-toolbar', desc: '输入框工具栏（附件按钮右侧）', type: '—', default: '—' },
  { name: 'message', desc: '接管整条消息渲染；作用域参数 { message, index, isLast, itemProps }，用 itemProps 可回落默认 ChatMessage。产出为空时 Vue 回落默认渲染', type: '—', default: '—' },
  { name: 'message-content', desc: '只替换气泡内正文，保留消息外壳；作用域参数 { message, content, renderMode, streaming }。与 message 同时给以 message 为准', type: '—', default: '—' },
  { name: 'tip', desc: '底部提示内容', type: '—', default: '内容由 AI 生成，仅供参考' },
]" />

<ApiTable title="Chatbot Methods（defineExpose）" :rows="[
  { name: 'reset', desc: '清空消息与输入区（含附件）；不回写 v-model，受控使用需同步清空绑定数组', type: '() => void', default: '—' },
  { name: 'focus', desc: '聚焦输入框', type: '() => void', default: '—' },
  { name: 'scrollToBottom', desc: '滚动到消息底部，传 true 平滑滚动', type: '(smooth?: boolean) => void', default: '—' },
]" />
