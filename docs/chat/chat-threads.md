# ChatThreads 会话列表

多会话工作台：左侧会话列表 + 右侧会话区。配合 `useChatSessions` 使用——它给每个会话挂一个独立的 `useChatEngine` 实例，**切走只是不渲染，回答继续流**，切回来内容还在。

> 本页组件在独立包 `@wil-works/evoke-chat` 里，安装与注册见 [Chatbot 对话窗口](/chat/chatbot)顶部说明。

家族既有原则不变：不发请求、不落存储。`transport` 由你注入，持久化由你经 `snapshot()` 取走、经 `initialThreads` 灌回。

## 基础用法

`useChatSessions` 交出的对象直接传给 `EbAiConsole` 的 `sessions`：列表、引擎、发送全接管，未传 `sessions` 时 Console 仍是原来的单栏形态。

<DemoBlock>
  <div style="height: 560px">
    <eb-ai-console
      :sessions="sessions"
      :welcome="{ title: '多会话工作台', highlight: '多会话', subtitle: '左上角新建，右侧提问；切走再切回，回答不会丢' }"
      placeholder="问点什么，首条消息会自动成为会话名"
      stoppable
      show-tip
      chat-height="320"
    />
  </div>
  <div style="margin-top: 8px; display: flex; gap: 8px; font-size: 12px; color: var(--eb-text-color-secondary);">
    <span>会话数：{{ sessions.threads.value.length }}</span>
    <span>生成中：{{ sessions.streamingIds.value.length }}</span>
    <span>最近回调：{{ lastChange }}</span>
  </div>
</DemoBlock>

## 只列表、自己排布

不想要 Console 那套编排时，`EbChatThreads` 可以单独用；`#item` 插槽整条接管，`itemProps` 用于回落默认渲染（与 `ChatList#message` 同款约定）：

<DemoBlock>
  <div style="height: 420px; border: 1px solid var(--eb-border-color-light); border-radius: 8px; overflow: hidden;">
    <eb-chat-threads
      :threads="sessions.threads.value"
      :active="sessions.activeId.value"
      :streaming="sessions.streamingIds.value"
      @select="sessions.select"
      @create="sessions.create"
      @rename="sessions.rename"
      @remove="sessions.remove"
      @pin="sessions.pin"
      @archive="sessions.archive"
    />
  </div>
</DemoBlock>

## 持久化

引擎不碰存储，但给足了取与回灌的入口：

```js
// 取走：thread 元数据 + 各自的消息数组
const saved = JSON.stringify(sessions.snapshot())

// 回灌
const sessions = useChatSessions({
  initialThreads: JSON.parse(saved),
  transport,          // (content, attachments, context, { threadId }) => ...
  onChange: (thread, reason) => { /* create / rename / pin / archive / remove / select / update */ },
  onReject: ({ threadId, reason }) => { /* 目前只有 concurrency */ },
})
```

## 并发与重排

- **切走不中断**：每个会话各持一个引擎，切走只是不渲染。代价是可能同时有多个会话在流式，所以有 `maxConcurrentStreaming`（`0` 为不限）；用满时 `send()` 返回 `false` 并走 `onReject({ reason: 'concurrency' })`。
- **列表不会因点击重排**：`updatedAt` 只在真的产生新消息时推进。选中、改名、置顶都不动它——否则用户刚点的条目会在指针底下跳走。

## API

<ApiTable title="useChatSessions" :rows="[
  { name: 'initialThreads', desc: '回灌用；每项 { id, title, updatedAt, pinned?, archived?, unread?, messages? }', type: 'array', default: '[]' },
  { name: 'activeId', desc: '初始选中的会话；缺省取第一条', type: 'string', default: '—' },
  { name: 'transport', desc: '模型调用入口，比 Console 的多收一个 { threadId }', type: '(content, attachments, context, { threadId }) => void | Promise', default: 'null' },
  { name: 'titleOf', desc: '首条消息生成标题的规则；缺省截前 24 字加省略号', type: '(text: string) => string', default: '—' },
  { name: 'maxConcurrentStreaming', desc: '同时生成中的会话数上限，0 为不限', type: 'number', default: '0' },
  { name: 'onChange', desc: '会话元数据变更：create / rename / pin / archive / remove / select / update', type: '(thread, reason) => void', default: '—' },
  { name: 'onReject', desc: '发送被拒：{ threadId, reason }', type: '(info) => void', default: '—' },
]" />

<ApiTable title="useChatSessions 返回值" :rows="[
  { name: 'threads / visible / archived', desc: '全部 / 未归档 / 已归档会话', type: 'Ref<array>', default: '—' },
  { name: 'activeId / active / activeEngine', desc: '当前会话 id / 元数据 / 引擎实例', type: 'Ref', default: '—' },
  { name: 'streamingIds', desc: '仍在生成中的会话 id', type: 'Ref<string[]>', default: '—' },
  { name: 'engineOf(id)', desc: '取某个会话的引擎（惰性创建）', type: '(id) => engine | null', default: '—' },
  { name: 'select / create / rename / pin / archive / remove', desc: '会话操作；remove 后 activeId 自动落到剩余第一条', type: '函数', default: '—' },
  { name: 'send / stop', desc: '在当前会话上发送 / 取当前引擎（停止请求由宿主 abort）', type: '函数', default: '—' },
  { name: 'canSendOn(id)', desc: '该会话当前能否发起生成（loading 与并发上限一起判）', type: '(id) => boolean', default: '—' },
  { name: 'snapshot / clear', desc: '取可持久化快照 / 清空全部会话', type: '函数', default: '—' },
]" />

<ApiTable title="ChatThreads Props" :rows="[
  { name: 'threads', desc: '会话列表', type: 'array', default: '[]' },
  { name: 'active', desc: '当前会话 id', type: 'string', default: '—' },
  { name: 'streaming', desc: '仍在生成中的会话 id，用于显示活动标记', type: 'string[]', default: '[]' },
  { name: 'searchable', desc: '显示搜索框（本地按标题过滤）', type: 'boolean', default: 'true' },
  { name: 'showCreate', desc: '显示新建按钮', type: 'boolean', default: 'true' },
  { name: 'groupByDate', desc: '按今天 / 昨天 / 近 7 天 / 更早分组；搜索中与置顶段不分组', type: 'boolean', default: 'true' },
  { name: 'renamable / removable', desc: '菜单里的重命名与删除项；置顶与归档不受影响', type: 'boolean', default: 'true / true' },
]" />

<ApiTable title="ChatThreads Events" :rows="[
  { name: 'select / create', desc: '选中会话 / 新建', type: '(id) => void / () => void', default: '—' },
  { name: 'rename', desc: '重命名提交（空标题视为放弃，不触发）', type: '(id, title) => void', default: '—' },
  { name: 'remove / pin / archive', desc: '删除 / 置顶（第二参为目标态）/ 归档（同）', type: '(id, value?) => void', default: '—' },
  { name: 'search', desc: '搜索词变化（过滤已由组件完成，此处仅供埋点或远端检索）', type: '(keyword) => void', default: '—' },
]" />

<ApiTable title="ChatThreads Slots" :rows="[
  { name: 'item', desc: '整条接管；作用域 { thread, index, isActive, isStreaming, itemProps }', type: '—', default: '—' },
  { name: 'header / footer / empty', desc: '列表顶部 / 底部 / 空态', type: '—', default: '—' },
]" />

## 未做

- **列表虚拟滚动**：分组标题与虚拟列表本身冲突（要拍平成带 sticky 表头），与其交一个半成品不如先不做；消息列表侧同理。
- 会话分享、多模型并行对比、跨设备同步。

<script setup>
import { ref } from 'vue'
import { useChatSessions } from '@wil-works/evoke-chat'

const lastChange = ref('—')

function mockReply(prompt) {
  return `关于「${prompt}」：这是模拟回复。真实场景在 transport 里接你的接口，用 engine.appendContent 逐步回写。`
}

const sessions = useChatSessions({
  initialThreads: [
    { id: 'demo-1', title: '报表口径对齐', messages: [{ id: 'd1', role: 'user', content: '上季度口径为什么和财务对不上？', status: 'done' }] },
    { id: 'demo-2', title: '热泉口资料整理', messages: [] },
  ],
  activeId: 'demo-1',
  maxConcurrentStreaming: 2,
  onChange: (thread, reason) => {
    lastChange.value = `${reason}${thread?.title ? `（${thread.title}）` : ''}`
  },
  // 返回 promise 直到流结束：否则 loading 立刻回落，列表里的「生成中」标记看不见
  transport: (content, _attachments, _context, meta) => {
    const engine = sessions.engineOf(meta.threadId)
    if (!engine) return Promise.resolve()
    const msg = engine.createAssistantMessage()
    const reply = mockReply(content)
    let i = 0
    return new Promise((resolve) => {
      const timer = setInterval(() => {
        engine.appendContent(msg.id, reply.slice(i, i + 4))
        i += 4
        if (i >= reply.length) {
          clearInterval(timer)
          engine.completeMessage(msg.id)
          resolve()
        }
      }, 40)
    })
  },
})
</script>
