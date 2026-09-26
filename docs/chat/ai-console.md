# AiConsole AI 工作台

完整的大模型对话工作台编排：欢迎标题（高亮词渐变）+ 示例问题 + AI 输入台 + 会话流。首次发送后欢迎区自动收起、会话区展开；模型调用通过 `transport` 注入（`transport(content, attachments, context)`），流式回写直接驱动 [useChatEngine](#api) 暴露的方法，组件内部不发起任何请求。

> 本页组件在独立包 `@wil-works/evoke-chat` 里，安装与注册见 [Chatbot 对话窗口](/chat/chatbot)顶部说明。

界面文案（底部提示、默认显示名、输入台占位等）取自语言包 `eb.chat`，随 `EbConfigProvider` 的 `locale` 走——机制见 [Chatbot · 多语言](/chat/chatbot#多语言)。

## 基础用法

`engine` 缺省时组件内部自建引擎；`transport` 里模拟流式打字即可看到完整会话流。点击示例问题直接发送：

> 高度约定：**父容器给了确定高度时 Console 撑满它**——会话区吃掉剩余空间、输入区贴底（`chat-height` 只是会话区上限）；父容器高度 auto 时按内容收缩，行为与从前一致。文档示例因此统一包一层定高容器（560px）。

<DemoBlock>
  <!-- 给容器一个确定高度：Console 会撑满它，会话区吃掉剩余空间、输入区贴底 -->
  <div style="height: 560px; max-width: 760px;">
    <eb-ai-console
      ref="consoleRef"
      :welcome="{ title: '欢迎体验文本生成，今天你想创造什么？', highlight: '文本生成' }"
      :examples="['请把“不要香菜，少放辣椒”翻译成自然英文', '帮我写一段新员工入职欢迎词', '用小学四年级能听懂的话解释什么是圆周率']"
      :transport="mockTransport"
      stoppable
    />
  </div>
</DemoBlock>

## 插槽

| 插槽 | 位置 | 用途 |
| --- | --- | --- |
| `input-prepend` | 输入区顶部（状态条之上） | 待发送队列（`EbChatQueue`）、附件条这类贴着输入台的内容 |
| `toolbar-extra` / `toolbar-meta` | 透传给输入台工具栏左侧 / 右侧 | 额外工具与读数（上下文占用由组件内部经 `#toolbar-meta` 传入） |
| `empty` | 消息列表空态 | 自定义欢迎区 |

## 实例方法（ref 调用）

| 方法 | 说明 |
| --- | --- |
| `setDraft(text)` | 回填输入台草稿（队列「取回编辑」、外部按钮用） |
| `send(text, attachments?)` | 程序化发送，与输入台同一条路径（队列「立即发送」用） |
| `focus()` | 聚焦输入框 |
| `clear()` | 清空会话回欢迎页 |
| `engine` / `listRef` | 引擎与消息列表 ref 透出，供宿主自行编排 |

## 受控引擎

传 `engine`（`useChatEngine` 返回值）即完全受控：消息列表、loading、会话历史归使用方所有，Console 只负责编排与交互；`clear()` 一键清空回欢迎页。

## API

<ApiTable title="AiConsole Props" :rows="[
  { name: 'engine', desc: '外部 useChatEngine 实例（受控）；缺省内部创建。注意：传外部 engine 时本组件的 transport 不参与调用，模型入口即引擎自身的 onSend', type: 'object', default: 'null' },
  { name: 'transport', desc: '模型调用入口：流式回写经引擎方法驱动（仅内部自建引擎时生效）', type: '(content, attachments, context) => void | Promise', default: 'null' },
  { name: 'welcome', desc: '欢迎区：title / highlight（title 中的渐变高亮词）/ subtitle', type: 'object', default: 'null' },
  { name: 'examples', desc: '示例问题：string 或 { text, prompt? }', type: 'array', default: '[]' },
  { name: 'exampleAction', desc: '示例点击行为：send 直发 / fill 仅填充', type: 'send | fill', default: 'send' },
  { name: 'placeholder', desc: '输入台占位文本；不传时取当前语言包（`eb.chat.promptBox.placeholder`）', type: 'string', default: '—' },
  { name: 'disabled', desc: '禁用输入台', type: 'boolean', default: 'false' },
  { name: 'loading', desc: '强制 loading（与引擎态取或）', type: 'boolean', default: 'false' },
  { name: 'scenes / capabilities / models / quota / showSettings', desc: '输入台配置面，同 AiPromptBox 同名参数', type: '—', default: '—' },
  { name: 'allowAttachments / maxAttachments / maxLength / sendOnEnter / stoppable', desc: '输入台行为，同 AiPromptBox', type: '—', default: '—' },
  { name: 'approval', desc: '待审批请求 { id, toolName, reason?, detail?, status? }；非空时审批面板接管输入台（Enter 允许一次 / Esc 拒绝）', type: 'object | null', default: 'null' },
  { name: 'question', desc: '待回答请求 { id, items: [...] }；审批缺席时提问面板接管输入台（Enter 前进 / Esc 取消），审批优先', type: 'object | null', default: 'null' },
  { name: 'status', desc: '状态条 { phase, label?, tool?, elapsed?, hint?, queue? }；phase 为 idle/缺省时不渲染', type: 'object | null', default: 'null' },
  { name: 'statusStoppable', desc: '当前阶段能否中断（决定状态条是否给「停止」钮）', type: 'boolean', default: 'false' },
  { name: 'status-queue', desc: '状态条上的排队计数被点击', type: '() => void', default: '—' },
  { name: 'context', desc: '上下文占用 { used, capacity, breakdown? }；给了就在输入台工具栏右侧显示占用环（经 #toolbar-meta）', type: 'object | null', default: 'null' },
  { name: 'showThinking', desc: '会话消息展示思考过程', type: 'boolean', default: 'true' },
  { name: 'renderMode', desc: '消息渲染模式', type: 'markdown | text', default: 'markdown' },
  { name: 'userName / assistantName', desc: '会话区双方显示名（同时决定默认头像首字）；不传时取当前语言包', type: 'string', default: '我 / AI助手（随语言包）' },
  { name: 'avatarUser / avatarAssistant', desc: '会话区双方头像图片地址', type: 'string', default: '' },
  { name: 'actions', desc: '消息动作条自定义动作 { key, label, icon? }', type: 'array', default: '[]' },
  { name: 'autoScroll', desc: '新消息自动滚动到底部', type: 'boolean', default: 'true' },
  { name: 'chatHeight', desc: '会话区最大高度', type: 'number | string', default: '420' },
  { name: 'showTip', desc: '展示「内容由 AI 生成」提示', type: 'boolean', default: 'true' },
]" />

<ApiTable title="AiConsole Events" :rows="[
  { name: 'send', desc: '发送（载荷同 AiPromptBox）', type: '(payload) => void', default: '—' },
  { name: 'stop', desc: '停止生成', type: '() => void', default: '—' },
  { name: 'approval-respond', desc: '审批结论，两参 (outcome, request)；outcome 取 allowed-once / rejected', type: '(outcome, request) => void', default: '—' },
  { name: 'question-respond', desc: '提问结论，两参 (answer, request)；answer.status 取 answered / cancelled', type: '(answer, request) => void', default: '—' },
  { name: 'example-click', desc: '点击示例问题', type: '(example) => void', default: '—' },
  { name: 'copy / regenerate / action', desc: '消息复制 / 重新生成（内部已驱动引擎重发，此处仅供埋点）/ 自定义动作，均由会话区转发', type: '(message) => void / (key, message) => void', default: '—' },
  { name: 'quota-click / settings-click', desc: '额度 / 设置点击', type: '() => void', default: '—' },
]" />

<ApiTable title="AiConsole Methods（defineExpose）" :rows="[
  { name: 'engine', desc: '当前引擎实例（messages / loading / appendContent / completeMessage 等）', type: 'object', default: '—' },
  { name: 'clear', desc: '清空会话，回到欢迎区', type: '() => void', default: '—' },
]" />

<script setup>
import { ref } from 'vue'

const consoleRef = ref(null)

// 模拟流式打字：真实场景在此 fetch/SSE 并调用引擎 appendContent / appendThinkContent
function mockTransport(content, attachments, context) {
  const eng = consoleRef.value?.engine
  if (!eng) return
  const reply = `（${context.model || '默认模型'}）已收到「${content}」——这是一段模拟回复，演示 transport 注入与流式回写。`
  const msg = eng.createAssistantMessage()
  let i = 0
  const timer = setInterval(() => {
    eng.appendContent(msg.id, reply.slice(i, i + 2))
    i += 2
    if (i >= reply.length) {
      clearInterval(timer)
      eng.completeMessage(msg.id)
    }
  }, 40)
}
</script>
