# Chatbot 对话窗口

开箱可用的 AI 对话窗口：消息流（Markdown 渲染、代码块复制、思考过程、附件、流式光标）、输入区（Enter 发送 / Shift+Enter 换行、输入法组字安全、字数与附件上限、停止生成）、动作条（复制 / 重新生成，键盘与触屏可达）。接口层完全由你承接——`send` 事件拿到输入，回写 `modelValue` 即完成闭环。

::: tip 这个家族住在独立包里
本页组件属于 `@wil-works/evoke-chat`（2026-09 从 `@wil-works/evoke-business-ui` 拆出，`marked` / `highlight.js` 只在用得上时才进依赖树）。装两个包并各自注册一次即可：

```js
import EvokeBusinessUI from '@wil-works/evoke-business-ui'   // 底座：基础组件 + 设计令牌
import '@wil-works/evoke-business-ui/styles'
import EvokeChat from '@wil-works/evoke-chat'
import '@wil-works/evoke-chat/styles'

app.use(EvokeBusinessUI)
app.use(EvokeChat)
```
:::

## 基础对话

发送后回写消息数组，异步回复用 `loading` 显示打字态：

<DemoBlock>
  <eb-chatbot v-model="messages" :loading="pending" height="520px" :show-tip="false" @send="onSend" />
</DemoBlock>

## 流式输出与思考过程

> 示例统一用 460~520px 的窗口高度：输入区固定约占 96px，正文区吃掉其余空间——高度给太小会只露出半条消息。

配合导出的 `useChatEngine` 组装流式会话：`appendContent` 逐段回写正文（状态自动进入 streaming，正文末尾出现流式光标，重解析按帧合并），`appendThinkContent` 写入思考内容（消息上方出现可折叠的思考块，流式期间自动展开、结束后可收起），`completeMessage` 收尾并自动记录回答用时。`regenerate` 事件里删掉旧回复后按上文重新流式输出即可：

<DemoBlock>
  <eb-chatbot v-model="streamMsgs" :loading="streamLoading" height="520px" :show-tip="false" @send="onStreamSend" @regenerate="onStreamRegen" />
</DemoBlock>

不想等流式也能看清思考块的三种形态——**思考中**（自动展开、内容实时追加）、**已深度思考**（结束后收起、可点开）、**带用时**（结束时间点折成 `thinkDuration`，标题右侧给「（用时 X）」）：

<DemoBlock>
  <eb-chatbot v-model="thinkMsgs" height="520px" :show-tip="false" :show-time="false" />
</DemoBlock>

消息项上的思考字段：`thinking: true` 表示正在思考（流式期间强制展开），`thinkContent` 是思考正文，`thinkDuration`（毫秒）是思考耗时——由引擎的 `appendThinkContent` / `stopThinking` / `completeMessage` / `cancelMessage` 自动结算，宿主手写静态数据时也可直接给；`thinkInterrupted: true` 表示思考阶段就被停止，思考块标题据此改说「思考已中断」。

## 停止生成与中断态

`stoppable` 让发送钮在 `loading` 期间变成停止钮，点击抛 `stop`（AbortController 由你自持）。中断时用 `cancelMessage` 把该条消息置为 `cancelled` 而不是 `error`：已流出的正文原地保留，下面挂一行「已停止生成」灰标，而不是整段被红色错误块替换；若停的时候还在思考，思考块标题改说「思考已中断」并补上思考用时，不会谎报「已深度思考」。生成中输入框保持可打字，便于准备下一句；Enter 既不并发投递也不会误触中断。

<DemoBlock>
  <eb-chatbot
    v-model="cancelMsgs"
    :loading="cancelLoading"
    stoppable
    height="460px"
    :show-tip="false"
    @send="onCancelSend"
    @stop="onCancelStop"
  />
</DemoBlock>

<script setup>
import { ref } from 'vue'
import { useChatEngine } from '@wil-works/evoke-chat'

const messages = ref([
  { id: 1, role: 'assistant', content: '**你好**，我是接入示例。发送一条消息试试。', status: 'done' },
])
const pending = ref(false)
let seq = 2

// 用户消息由 EbChatbot 自己追加并回写 v-model（见「发送流」测试），这里只负责产出回复
const onSend = (text) => {
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

// 思考块三态（静态数据：不依赖流式等待）
const thinkMsgs = ref([
  {
    id: 'think-a',
    role: 'assistant',
    status: 'streaming',
    thinking: true,
    thinkContent: '先确认「化能合成」的能量来源不是光照，而是硫化氢氧化；再按热泉口面积估年通量；最后与光合作用比量级。',
    content: '结论：热泉口生态系统的初级生产靠化学能，量级约为同面积光合作用的 0.1%。',
  },
  {
    id: 'think-b',
    role: 'assistant',
    status: 'done',
    thinking: false,
    thinkContent: '拆解问题 → 查资料 → 交叉验证 → 给出结论。',
    content: '查到的三条资料互相印证，结论稳定。',
  },
  {
    id: 'think-c',
    role: 'assistant',
    status: 'done',
    thinking: false,
    thinkContent: '先看口径差异（含税/不含税），再看时间窗口是否一致，最后给差异清单。',
    thinkDuration: 2600,
    duration: 3400,
    content: '差异主要来自口径：一方含退货，另一方不含。',
  },
])


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
\`\`\`

脚注[^1]与行内引用[2](source:doc-1)也走同一套上标样式。

[^1]: 这是一种**少见的**写法，尾注只列出被引用过的条目。`
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
const plainMsgs = ref([
  { id: 'plain-1', role: 'user', content: '隐藏头像与昵称后是什么样？', status: 'done' },
  { id: 'plain-2', role: 'assistant', content: '就这样：只剩气泡。悬浮消息可以看到时间与动作条。', status: 'done' },
])
const sideMsgs = ref([
  { id: 'side-1', role: 'user', content: '我这侧不显示头像与昵称。', status: 'done' },
  { id: 'side-2', role: 'assistant', content: '我这侧照常显示——分侧开关用对象传：`{ user: false }`。', status: 'done' },
])
const onSideSend = (text) => {
  setTimeout(() => {
    sideMsgs.value.push({ id: `side-${Date.now()}`, role: 'assistant', content: `已收到「${text}」。`, status: 'done' })
  }, 400)
}

const onPlainSend = (text) => {
  setTimeout(() => {
    plainMsgs.value.push({ id: `plain-${Date.now()}`, role: 'assistant', content: `已收到「${text}」。`, status: 'done' })
  }, 400)
}

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
  // 用户消息已由组件追加，这里只补回复
  baMsgs.value = [...baMsgs.value, baReply(text)]
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

// ─── 系统提示消息 ───
const sysMsgs = ref([
  { id: 'sy-1', role: 'system', content: '**以上为历史对话**，已自动摘要', status: 'done' },
  { id: 'sy-2', role: 'user', content: '继续吧', status: 'done' },
  { id: 'sy-3', role: 'assistant', content: '好的，接着上面的话题。', status: 'done' },
  { id: 'sy-4', role: 'notice', content: '回答由演示服务生成，仅用于组件体验', status: 'done' },
])

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

`user-name` / `assistant-name` 决定双方昵称与头像首字，`avatar-user` / `avatar-assistant` 传图片地址可替换为图片头像；`render-mode` 切换为 `text` 后消息不再解析 Markdown，适合展示日志、代码原文等纯文本。

`show-avatar` / `show-name` 把头像与昵称整块隐去（适合头像已由外层提供、或消息密集的窄栏），传 `{ user: false }` / `{ assistant: false }` 可分侧关闭；**时间戳默认就在消息下方**，与动作条同排、悬浮消息（或键盘聚焦）时一起出现，`show-time` 可整块关掉：

<DemoBlock>
  <eb-chatbot
    v-model="fancyMsgs"
    user-name="王工"
    assistant-name="小 Ev"
    render-mode="text"
    height="460px"
    :show-tip="false"
    @send="onFancySend"
  />
</DemoBlock>

<DemoBlock>
  <eb-chatbot
    v-model="plainMsgs"
    :show-avatar="false"
    :show-name="false"
    height="460px"
    :show-tip="false"
    @send="onPlainSend"
  />
</DemoBlock>

也想分侧控制时传对象——只隐去自己那侧（对方仍带头像昵称）：

<DemoBlock>
  <eb-chatbot
    v-model="sideMsgs"
    :show-avatar="{ user: false }"
    :show-name="{ user: false }"
    height="460px"
    :show-tip="false"
    @send="onSideSend"
  />
</DemoBlock>

## 自定义动作与事件埋点

`actions` 在助手消息的动作条上追加自定义动作（`{ key, label, icon? }`，icon 使用组件库图标名）；`copy` / `regenerate` / `action` 事件把消息对象透传给页面，在此上报埋点或执行业务逻辑。动作条悬停消息时显示：

<DemoBlock>
  <eb-chatbot
    v-model="actionMsgs"
    :actions="chatActions"
    height="460px"
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

`editable` 给你的消息加「编辑」，点开后原地变输入框，保存抛 `edit`（原文与新文两参）；`feedback` 在助手回答下加点赞点踩，点踩会展开结构化原因与备注面板，提交抛 `feedback`（消息 + `{ value, reasons, note }`）；回答尾部的追问 chips 来自消息的 `suggestions` 字段，点击抛 `suggestion-click`。三者都由 `modelValue` 承载状态，宿主负责回写。**版面约定：追问 chips、评价、动作条落在消息下方同一行**（chips 吃掉剩余宽度、可换行；评价与动作条靠右，动作条仍随悬浮出现）；点踩展开原因面板时，评价块整行铺开——面板太窄读不了：

<DemoBlock>
  <eb-chatbot
    v-model="baMsgs"
    editable
    feedback
    height="480px"
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
  <eb-chatbot v-model="citeMsgs" height="460px" :show-tip="false" @citation-click="onCiteClick" />
  <div style="margin-top: 8px; font-size: 12px; color: var(--eb-text-color-secondary);">
    {{ citeHint }}
  </div>
</DemoBlock>

链接文字是纯数字就直接用作序号；不是数字则按本次渲染递增分配。刻意不做裸 `[1]` 自动识别——那会和有序列表、脚注、代码里的方括号打架；宿主若拿到的是 Perplexity 风格的裸数字，在自己的 transport 里改写成 `[n](source:id)` 即可。

## 工具调用卡

消息带 `toolCalls` 数组即在正文之前渲染执行轨迹（先执行再作答）：每步一行，带状态标记、状态文案与耗时，有参数或结果时可展开。多个步骤自动归到组标题下——跑着说「正在执行 N 个步骤」（带流光），跑完结算成「执行了 N 个步骤（用时 X）」。失败态给重试钮并在折叠行露出错误首行，点击抛 `tool-retry`（工具调用 + 消息两参）。

配合 `useChatEngine` 的状态机驱动：`startToolCall(msgId, { name, args })` 新建并转执行中（传已存在的 `id` 则复用），`addSubToolCall(msgId, parentCallId, { name, args })` 给某个调用挂子调用（返回子调用 id，与 `startToolCall` 一致；父不存在或超过 16 层返回 null），这三个写操作都按 id **递归**作用到子调用上；`appendToolCallResult(msgId, callId, chunk)` 逐片回写工具输出（状态自动转执行中并打上 `streaming`，卡片露出光标、自动展开并贴底），`completeToolCall(msgId, callId, result)` 收尾并自动记耗时（**省略 `result` 时保留已流出的输出**），`failToolCall(msgId, callId, error)` 转失败。整轮被 `cancelMessage` 中断时，还在跑/等待的调用会落 `cancelled`（「已停止」），且不再接收迟到的增量或收尾。参数与结果默认走带环检测的 JSON `<pre>`，宿主可用 `#args` / `#result` 插槽换成 `EbJsonViewer` 等。

<DemoBlock>
  <eb-chatbot v-model="toolMsgs" height="520px" :show-tip="false" @tool-retry="onToolRetry" />
  <div style="margin-top: 8px; font-size: 12px; color: var(--eb-text-color-secondary);">
    {{ toolHint }}
  </div>
</DemoBlock>

## 系统提示消息

`role` 为 `system` 或 `notice` 的消息按系统提示呈现：居中一行、弱化底色，不带头像 / 昵称 / 动作条，也不参与复制、评价与编辑。适合「以上为历史对话」「已切换到某模型」这类分隔性说明。正文仍走 Markdown，`render-mode="text"` 时原样显示。

<DemoBlock>
  <eb-chatbot v-model="sysMsgs" height="520px" :show-tip="false" />
</DemoBlock>

`message` 插槽接管整条消息的渲染，作用域参数给 `message` / `index` / `isLast` / `itemProps`（`itemProps` 就是 `ChatList` 本来要传给内部 `ChatMessage` 的全量 props）。只想让某几类消息长得不一样、其余照旧，用 `itemProps` 显式回落即可，不必自己重接头像与动作条：

<DemoBlock>
  <eb-chatbot v-model="msgSlotMsgs" height="460px" :show-tip="false">
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

`max-length` 限制输入长度，`show-word-count` 显示字数；`max-attachments` 限制附件数量。附件投递支持点 `+` 选文件、**拖拽进输入区**、**直接粘贴剪贴板里的图片**三种方式（`allow-drop` 可关）。

类型与体积由 `accept` / `max-file-size` 约束——浏览器对 `input[accept]` 只是建议，拖拽和粘贴路径组件会自己按同一套规则校验；不合格的文件经 `attachment-reject(file, reason)` 交回，`reason` 取 `type` / `size` / `limit` / `empty`，提示文案由你决定。

上传状态由你回写附件对象驱动（组件不自己发请求）：`status: 'uploading'` + `progress` 显示进度条，`'error'` + `error` 显示失败原因，`'done'` 显示已上传；不写 `status` 的历史附件不出现任何状态位。

<DemoBlock>
  <eb-chatbot
    v-model="limitMsgs"
    :max-length="30"
    show-word-count
    :max-attachments="2"
    :send-on-enter="false"
    placeholder="输入内容，Enter 换行，点右侧按钮发送"
    height="460px"
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
    height="520px"
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
} from '@wil-works/evoke-chat'

// 自定义协议链接的主题色（默认 entity→primary、doc→info、action→danger …）
configureChatMarkdown({ protocolThemes: { ticket: 'warning' } })

// 放行宿主自己的协议；data: 默认不在链接白名单内（聊天内容不可信）
configureChatMarkdown({ standardProtocols: { add: ['https'] } })

// 默认高亮只带 highlight.js/lib/common 的 36 种语言，冷门语言自行注册
import cobol from 'highlight.js/lib/languages/cobol'
registerHighlightLanguage('cobol', cobol)
```

数学公式与图表同理——**渲染器由你注入**，包内不引这两个依赖：

```js
import katex from 'katex'
import 'katex/dist/katex.min.css'   // 样式与字体要自己引

configureChatMarkdown({
  // (tex, displayMode) => html；返回的内容按原样插入，转义由你的渲染器负责
  math: (tex, display) => katex.renderToString(tex, { displayMode: display, throwOnError: false }),
})

// mermaid 是异步的，塞不进同步渲染管线：围栏保留为代码块，旁边多一个
// 「渲染图表」按钮，点击后调这个函数并把代码块换成返回的 SVG
configureChatMarkdown({
  mermaid: async (source) => {
    const { svg } = await mermaid.render(`m${Date.now()}`, source)
    return svg
  },
})
```

不注入就不出现：`$x$` 与 `$$…$$` 原样保留，mermaid 围栏就是普通代码块。数学的行内识别带两条保守规则——`$` 内侧不留空白，且纯数字内容（`$100 与 $200` 这类金额写法）直接放行不当公式。宿主渲染器抛错时退回转义原文，不影响整篇。

安全边界（都是刻意选择，不是漏做）：正文里的 raw HTML 一律转义为纯文本展示，`<script>` / `<iframe>` / 注释都进不来；链接协议走白名单，非白名单协议降级成可配置的引用芯片；**图片 `src` 只放行 `http` / `https` / `data`**，其余协议退回可读纯文本，并统一补 `loading="lazy"` 与 `referrerpolicy="no-referrer"`。

**脚注**：marked v18 不带脚注扩展，管线里自己接了一个。`结论[^1]` 配 `[^1]: 出处说明` 渲染成可点击上标 + 文末尾注列表——编号按定义出现顺序（与 GFM 一致），未被引用的定义不进尾注，没有对应定义的引用退回原样文本，代码块里的 `[^1]:` 不会被当成定义。上标与 `source:` 引用共用 `.eb-chat-citation` 类名，宿主可统一着色。

Mermaid 的图是点击后直接改 `v-html` 出来的 DOM——流式期间重渲染会覆盖它，所以按钮只在已经渲染完成的块上有意义。

## 接真实后端：会话日志层

默认接法（`onSend` 里自己回写引擎）在**断线、重连、补历史**时会丢状态——没有东西记得"读到哪了"。`useChatSession` 补的就是这一层：宿主只提供一个窄适配器，游标、缺口、幂等发送由它管。

```js
import { useChatSession } from '@wil-works/evoke-chat'

const session = useChatSession({
  sessionId: 's-1',
  transport: {
    open: ({ cursor, onEvent }) => subscribeMyStream({ from: cursor + 1 }, onEvent), // 返回 unsubscribe
    page: ({ from, to }) => fetchEvents({ from, to }),                              // 补页：返回持久事件数组
    send: ({ requestId, content, mode }) => rpc('session/prompt', { requestId, content, mode }),
    cancel: ({ sessionId }) => rpc('session/cancel', { sessionId }),                 // 协作式中止
  },
})

session.open({ cursor, records })            // 打开/重开：装快照并订阅
session.submit('帮我看下这个报错')            // 幂等：requestId 关联乐观气泡，失败可 retrySend 同 id 重发
session.stop()                               // 停止（本层不持 AbortController）
session.messages                             // 折叠后的消息数组，直接喂 <eb-chatbot v-model>
```

事件契约（宿主把自家 wire 数据映射成这几类，其余类型按 `ignorable` 处理）：

| 事件 | 数据 | 折叠成 |
| --- | --- | --- |
| `user/message` | `{ requestId?, message: { content, attachments? } }` | 用户消息（同 `requestId` 的乐观气泡自动摘除） |
| `assistant/delta`（瞬时） | `{ messageId, text?, think? }` | `appendContent` / `appendThinkContent` |
| `assistant/message` | `{ messageId, message: { content, thinkContent?, usage? }, interrupted? }` | 落定；`interrupted` 走中断态 |
| `tool/call` | `{ messageId, callId, name, args? }` | 工具卡转执行中 |
| `tool/result` | `{ messageId, callId, result?, error?, duration? }` | 完成 / 失败；`error.code === 'interrupted'` 落「已停止」 |
| `turn/end` | `{ messageId, reason: { kind } }` | `completed` 收尾、`max-tokens` 截断保留、`aborted`/`blocked` 中断、`error` 红块 |

三条不变量（违反即上报 `onViolation`，绝不静默硬接）：

- **连续性**：`seq` 必须等于上一条 +1；跳号就挂起后到事件并请宿主补页（`transport.page`），补平才继续——事件顺序永不倒置。
- **游标只被持久事件推进**：瞬时通知要显式标 `transient: true`，不碰游标、不进窗口；没有 `seq` 又没这个标记的按坏信封上报。
- **恢复不倒退**：`open()` 之后服务端若从更早的 `seq` 重放，判 `stale-replay` 违规——静默接受会让窗口出现重影。

不认识的类型：`ignorable: true` 可安全跳过；否则标记 `state.degraded` 并回调 `onDegraded`，由宿主决定是否重拉整窗（不认识的事件可能携带视图状态，跳过会画错）。

> 纯逻辑内核 `createSessionLog()` 与折叠函数 `applySessionEvent(engine, event)` 都单独导出：不用 Vue、不接网络，可以只取日志层，或只在测试里复用折叠规则。

## 给 AI 读的契约

文档站除了 prose 版的 `llms.txt` / `llms-full.txt`，还随站发布两份**结构化契约**：

| 文件 | 内容 |
| --- | --- |
| [/chat/ai-contract](/chat/ai-contract) | 硬规则 → 任务配方（含代码与坑）→ 逐组件的 props / 事件 / 插槽 / 实例方法表 |
| [/ai/evoke-chat.components.json](https://evoke-business-ui.wil-works.com/ai/evoke-chat.components.json) | 同一份契约的机器可读版（组件 + 具名导出 + 配方） |

两份产物由 `packages/evoke-chat/scripts/gen-ai-docs.mjs` 从源码抽取，`--check` 已进构建链：源码改了没重新生成，构建即失败（与文档 API 门同一思路）。

## 接入 OpenAI / Anthropic

两家模型服务各一个适配器（`openai` / `anthropic`），**纯映射、零 SDK 依赖**：请求体、SSE 解析、wire → 本库事件三件事都在里面，接上 `useChatSession` 就能跑。

```js
import { createChatTransport, useChatSession } from '@wil-works/evoke-chat'

const transport = createChatTransport({
  provider: 'anthropic',        // 'openai' | 'anthropic'
  apiKey: '...',                // 浏览器直连不安全：生产走你自己的后端代理（url 换成代理地址）
  model: 'claude-sonnet-4-5',
  system: '你是运营助手',
  tools: [{ name: 'web_search', description: '联网检索', parameters: { type: 'object', properties: { query: { type: 'string' } } } }],
  contextWindow: 32000,         // 给了才会报上下文占用
  getMessages: () => session.messages.value,   // 历史来源（本库消息数组）
})

const session = useChatSession({ transport })
session.open({ cursor: 0, records: [] })
session.submit('帮我诊断渠道下滑')
```

**映射表**（各家差异都在适配器里吸收，宿主不用管）：

| 环节 | OpenAI | Anthropic |
| --- | --- | --- |
| 正文 | `choices[0].delta.content` | `content_block_delta.text_delta` |
| 思考 | `delta.reasoning_content`（非官方字段，有则透传） | `content_block_delta.thinking_delta` |
| 工具参数 | `delta.tool_calls[].function.arguments`：**分片 JSON**，按 index 拼完再 parse | `content_block_delta.input_json_delta.partial_json`：同理 |
| 工具交卡时机 | 流结束 `finalize` 时一次性交（参数必须拼完） | `content_block_stop` 时交 |
| 结束语义 | `finish_reason`：`stop`→完成、`length`→截断（保留已产出）、`content_filter`→失败 | `stop_reason`：`end_turn`→完成、`max_tokens`→截断、`refusal`→失败 |
| 用量 | `usage.prompt_tokens / completion_tokens / total_tokens` | `message_start.input_tokens` + `message_delta.output_tokens`（分两处，适配器合并） |
| 工具 schema | `tools[].function.{name,description,parameters}` | `tools[].{name,description,input_schema}` |
| 历史回灌 | `role:'tool'` + `tool_call_id` | `tool_result` 内容块 |
| 中断 | 客户端 `AbortController`；abort 后统一补一条 `turn/end(aborted)` | 同 |

**边界（刻意不做的事）**：这两家**没有** follow 流与补页协议，所以适配出来的 transport `open` 只登记事件出口、`page` 返回空——**历史要宿主自己存**（刷新后从你的后端拿）；`approve` / `answerQuestion` 是应用级交互，不属于 provider 适配。想用完整的会话日志层（游标/缺口补齐/断线恢复），把 `open` / `page` 接到你自己的后端即可，其余照旧。

单测用录制的流式 fixture 覆盖：纯文本、思考、分片工具参数、用量、截断、HTTP 错误、中断保留已流出正文（见 `test/chat-adapters.test.js`）。

## 多语言

对话家族的文案只有一份，住在**本包**的语言包里（`src/locale/zh-CN.js` 与 `en.js`）。**语言名由底座决定**：组件读 `EbConfigProvider` 的 `locale`（或全局默认），拿到 `name`（`zh-cn` / `en` …）后在本包语言表里取译文，因此切换后已挂载的消息、动作条、输入区就地更新，不必重建组件。

```vue
<eb-config-provider :locale="en">
  <eb-chatbot :model-value="messages" />
</eb-config-provider>
```

要点：

- **局部生效**：`EbConfigProvider` 只影响子树；不套 Provider 就跟随全局语言（`app.use(EvokeBusinessUI, { locale })`）。
- **缺失回退**：没译文的语言（如 `ja` / `ko`）或某条键缺失时回退基准包 `zh-CN`——显示中文，而不是 `actionbar.copy` 这样的裸键。
- **宿主传值优先**：`placeholder` / `user-name` / `assistant-name` 这类可传入的文案，宿主给了就用宿主的；不传才取当前语言包的默认值（prop 默认值在模块加载时冻结，所以这是渲染期解析的）。
- **语言包入口**：`@wil-works/evoke-chat/locale` 导出 `zhCN` / `en` 与 `getChatLocalePack(name)`；底座的语言包在 `@wil-works/evoke-business-ui/locale`。
- **非组件调用**：`renderChatMarkdown(content)` 不传第二参时用基准包静态文案；需要跟随语言的宿主可以自己传 `renderChatMarkdown(content, labels)`。

## API

<ApiTable title="Chatbot Props" :rows="[
  { name: 'modelValue', desc: '消息数组，配合 v-model 使用；项为 { id, role, content, status, thinking?, attachments?, suggestions?, feedback?, feedbackReasons?, feedbackNote?, edited?, citations?, toolCalls? }（toolCalls 项可带 subCalls 形成子调用树；changes 为本轮改动汇总 { files, total?, added?, deleted? }），status 取 pending / streaming / done / error / cancelled', type: 'array', default: '[]' },
  { name: 'role 取值', desc: 'user / assistant 为对话双方；system 与 notice 是系统提示，居中弱化呈现、不给头像昵称与动作条，也不参与复制与评价', type: 'user | assistant | system | notice', default: '—' },
  { name: 'input-value', desc: '受控输入框内容，配合 v-model:input-value 使用', type: 'string', default: '—' },
  { name: 'loading', desc: '回复生成中（ assistant 打字态）', type: 'boolean', default: 'false' },
  { name: 'render-mode', desc: '消息渲染方式：markdown / 纯文本', type: 'markdown | text', default: 'markdown' },
  { name: 'placeholder', desc: '输入框占位文案；不传时取当前语言包（zh-CN 默认为「输入消息，按 Enter 发送，Shift+Enter 换行」）', type: 'string', default: '—' },
  { name: 'height / width', desc: '容器尺寸', type: 'string | number', default: '600px / 100%' },
  { name: 'send-on-enter', desc: 'Enter 发送、Shift+Enter 换行；关闭后 Enter 换行。输入法组字中的 Enter 始终交还输入法，不会误发', type: 'boolean', default: 'true' },
  { name: 'max-length / show-word-count', desc: '输入上限（真正约束 textarea，传 0 不限长）与字数统计', type: 'number / boolean', default: '2000 / false' },
  { name: 'stoppable', desc: '生成中发送钮切换为停止钮，点击抛 stop', type: 'boolean', default: 'false' },
  { name: 'approval', desc: '待审批请求 { id, toolName, reason?, detail?, status? }；非空时审批面板接管输入区（Enter 允许一次 / Esc 拒绝）', type: 'object | null', default: 'null' },
  { name: 'question', desc: '待回答请求 { id, items: [...] }；审批缺席时提问面板接管输入区（Enter 前进 / Esc 取消），审批优先', type: 'object | null', default: 'null' },
  { name: 'status', desc: '状态条 { phase, label?, tool?, elapsed?, hint?, queue? }；phase 为 idle/缺省时不渲染', type: 'object | null', default: 'null' },
  { name: 'statusStoppable', desc: '当前阶段能否中断（决定状态条是否给「停止」钮）', type: 'boolean', default: 'false' },
  { name: 'status-queue', desc: '状态条上的排队计数被点击', type: '() => void', default: '—' },
  { name: 'context', desc: '上下文占用 { used, capacity, breakdown? }；给了就在输入区上方显示占用环', type: 'object | null', default: 'null' },
  { name: 'allow-attachments / max-attachments', desc: '附件开关与上限', type: 'boolean / number', default: 'true / 5' },
  { name: 'accept', desc: '附件类型白名单（.ext / mime/* / mime/type，逗号分隔）；拖拽与粘贴路径同样按它校验', type: 'string', default: '—' },
  { name: 'max-file-size', desc: '单个附件字节上限，0 为不限', type: 'number', default: '0' },
  { name: 'allow-drop', desc: '允许拖拽与粘贴投递', type: 'boolean', default: 'true' },
  { name: 'show-thinking', desc: '是否展示消息的思考过程折叠块', type: 'boolean', default: 'true' },
  { name: 'actions', desc: '消息动作条自定义动作 { key, label, icon? }', type: 'array', default: '[]' },
  { name: 'editable', desc: '用户消息可原地编辑并重发（动作条加「编辑」）', type: 'boolean', default: 'false' },
  { name: 'edit-max-length', desc: '编辑框输入上限，传 0 不限长', type: 'number', default: '0' },
  { name: 'feedback', desc: '助手消息显示点赞点踩；点踩展开结构化原因面板', type: 'boolean', default: 'false' },
  { name: 'feedback-reasons', desc: '点踩原因词汇表；不传用内置六项', type: 'array', default: '[]' },
  { name: 'tool-retryable', desc: '失败的工具调用卡是否给重试钮', type: 'boolean', default: 'true' },
  { name: 'user-name / assistant-name', desc: '双方显示名（同时决定默认头像首字）；不传时取当前语言包', type: 'string', default: '我 / AI助手（随语言包）' },
  { name: 'show-avatar / show-name', desc: '隐去消息头部的头像 / 昵称；传 `{ user: false }` 只隐自己那侧、`{ assistant: false }` 只隐对方（隐藏后头部行按剩余内容决定是否渲染）', type: 'boolean | { user?, assistant? }', default: 'true / true' },
  { name: 'show-time', desc: '时间戳：默认落在消息下方、与动作条同排，悬浮或键盘聚焦时显示；关掉则完全不渲染', type: 'boolean', default: 'true' },
  { name: 'avatar-user / avatar-assistant', desc: '双方头像图片地址', type: 'string', default: '' },
  { name: 'auto-scroll', desc: '新消息自动滚动到底部', type: 'boolean', default: 'true' },
  { name: 'show-tip', desc: '是否展示底部提示，可用 #tip 插槽替换', type: 'boolean', default: 'true' },
  { name: 'disabled', desc: '整体禁用', type: 'boolean', default: 'false' },
]" />

<ApiTable title="Chatbot Events" :rows="[
  { name: 'send', desc: '发送消息（文本 + 附件），回写 modelValue 完成闭环', type: '(text: string, attachments: array) => void', default: '—' },
  { name: 'stop', desc: '点击停止钮（stoppable 且生成中），在此中断请求并把该条消息置为 cancelled', type: '() => void', default: '—' },
  { name: 'approval-respond', desc: '审批结论，两参 (outcome, request)；outcome 取 allowed-once / rejected', type: '(outcome, request) => void', default: '—' },
  { name: 'question-respond', desc: '提问结论，两参 (answer, request)；answer.status 取 answered / cancelled', type: '(answer, request) => void', default: '—' },
  { name: 'copy', desc: '消息复制（动作条透传）', type: '(message) => void', default: '—' },
  { name: 'regenerate', desc: '重新生成（动作条透传，由页面删旧回复并重新请求）', type: '(message) => void', default: '—' },
  { name: 'action', desc: 'actions 自定义动作点击', type: '(key: string, message) => void', default: '—' },
  { name: 'edit', desc: '用户消息编辑后保存（组件只交出文本，重发由你驱动引擎 editAndResend 或自行截断）', type: '(message, content: string) => void', default: '—' },
  { name: 'feedback', desc: '评价提交；取消时 payload.value 为 null', type: '(message, { value, reasons, note }) => void', default: '—' },
  { name: 'suggestion-click', desc: '点击回答尾部的追问 chip', type: '(text: string, suggestion, message) => void', default: '—' },
  { name: 'citation-click', desc: '点击正文里的引用上标（来源卡会自动展开并高亮，此处供埋点或自定义跳转）', type: '(id: string, message) => void', default: '—' },
  { name: 'tool-retry', desc: '点击失败工具调用卡的重试钮', type: '(toolCall, message) => void', default: '—' },
  { name: 'attachment-add', desc: '附件通过校验后触发，第二个参数为组件生成的附件对象（回写 status / progress 用）', type: '(file: File, attachment) => void', default: '—' },
  { name: 'attachment-reject', desc: '附件被拒；reason 取 type / size / limit / empty', type: '(file: File, reason: string) => void', default: '—' },
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
