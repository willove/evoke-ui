<template>
  <div class="eb-ai-console" :class="{ 'has-threads': hasThreads }">
    <aside v-if="hasThreads" class="eb-ai-console__threads">
      <slot name="threads">
        <ChatThreads
          :threads="sessionThreads"
          :active="sessionActiveId"
          :streaming="sessionStreamingIds"
          @select="sessions.select"
          @create="sessions.create"
          @rename="sessions.rename"
          @remove="sessions.remove"
          @pin="sessions.pin"
          @archive="sessions.archive"
        />
      </slot>
    </aside>
    <div class="eb-ai-console__main">
    <!-- 欢迎区（会话开始后收起） -->
    <div v-if="!hasMessages" class="eb-ai-console__welcome">
      <h2 v-if="welcome?.title" class="eb-ai-console__title">
        <template v-if="welcome.highlight && welcome.title.includes(welcome.highlight)">
          {{ welcome.title.split(welcome.highlight)[0] }}<span class="eb-ai-console__title-highlight">{{ welcome.highlight }}</span>{{ welcome.title.split(welcome.highlight)[1] }}
        </template>
        <template v-else>{{ welcome.title }}</template>
      </h2>
      <p v-if="welcome?.subtitle" class="eb-ai-console__subtitle">{{ welcome.subtitle }}</p>

      <!-- 示例问题 -->
      <div v-if="resolvedExamples.length" class="eb-ai-console__examples">
        <button
          v-for="(ex, i) in resolvedExamples"
          :key="i"
          type="button"
          class="eb-ai-console__example"
          :disabled="disabled || loading"
          @click="pickExample(ex)"
        >
          <eb-icon name="question-answer" :size="14" />
          <span>{{ ex.text }}</span>
        </button>
      </div>
    </div>

    <!-- 会话区 -->
    <div v-show="hasMessages" class="eb-ai-console__chat" :style="chatStyle">
      <ChatList
        ref="listRef"
        :messages="messages"
        :show-thinking="showThinking"
        :render-mode="renderMode"
        :auto-scroll="autoScroll"
        :avatar-user="avatarUser"
        :avatar-assistant="avatarAssistant"
        :user-name="userName ?? labels.message.user"
        :assistant-name="assistantName ?? labels.message.assistant"
        :show-avatar="showAvatar"
        :show-name="showName"
        :show-time="showTime"
        :actions="actions"
        :editable="editable"
        :edit-max-length="editMaxLength"
        :feedback="feedback"
        :feedback-reasons="feedbackReasons"
        @copy="emit('copy', $event)"
        @regenerate="handleRegenerate"
        @action="handleAction"
        @edit="handleEdit"
        @feedback="handleFeedback"
        @suggestion-click="handleSuggestionClick"
        @citation-click="handleCitationClick"
        :tool-retryable="toolRetryable"
        :speech="speech"
        :trace-url="traceUrl"
        @tool-retry="handleToolRetry"
        @plan-toggle="(p) => emit('plan-toggle', p)"
        @plan-step-click="(step, i, m) => emit('plan-step-click', step, i, m)"
        @confirm-respond="(c, k, m) => emit('confirm-respond', c, k, m)"
        @artifact-open="(a, m) => emit('artifact-open', a, m)"
        @artifact-copy="(a, m) => emit('artifact-copy', a, m)"
        @file-select="(f, p, m) => emit('file-select', f, p, m)"
      >
        <template v-if="$slots.empty" #empty><slot name="empty" /></template>
      </ChatList>
    </div>

    <!-- 输入台 -->
    <div class="eb-ai-console__input">
      <!-- 贴着输入台的宿主内容（待发送队列、附件条…） -->
      <slot name="input-prepend" />
      <!-- 状态条：空态不渲染；审批/提问接管时它仍可见（说明当前卡在哪一步） -->
      <EbChatStatusBar
        v-if="status"
        :status="status"
        :stoppable="statusStoppable"
        @stop="emit('stop')"
        @view-queue="emit('status-queue')"
      />
      <!-- 审批接管输入区：待审批时输入台让位给审批面板（Enter 允许一次 / Esc 拒绝） -->
      <EbChatApproval
        v-if="approval"
        :request="approval"
        @respond="(outcome, request) => emit('approval-respond', outcome, request)"
      />
      <!-- 待回答：提问面板接管输入区；审批优先（越权动作必须先答） -->
      <EbChatQuestion
        v-else-if="question"
        :request="question"
        @respond="(answer, request) => emit('question-respond', answer, request)"
      />
      <EbAiPromptBox
        v-else
        ref="boxRef"
        v-model="boxText"
        v-model:scene="sceneState"
        v-model:active-capabilities="capabilityState"
        v-model:model="modelState"
        :placeholder="placeholder ?? labels.promptBox.placeholder"
        :disabled="disabled"
        :loading="loading"
        :queueable="queueable"
        :scenes="scenes"
        :capabilities="capabilities"
        :models="models"
        :quota="quota"
        :show-settings="showSettings"
        :allow-attachments="allowAttachments"
        :max-attachments="maxAttachments"
        :max-length="maxLength"
        :send-on-enter="sendOnEnter"
        :stoppable="stoppable"
        @send="handleSend"
        @stop="emit('stop')"
        @quota-click="emit('quota-click')"
        @settings-click="emit('settings-click')"
      >
        <template v-if="$slots['toolbar-extra']" #toolbar-extra>
          <slot name="toolbar-extra" />
        </template>
        <!-- 上下文占用放输入台内部（工具栏右侧），不再占输入区一行 -->
        <template v-if="context" #toolbar-meta>
          <EbChatContextMeter v-bind="context" />
        </template>
      </EbAiPromptBox>
      <div v-if="showTip" class="eb-ai-console__tip">
        <slot name="tip">
          <span>{{ labels.console.tip }}</span>
        </slot>
      </div>
    </div>
    </div>
  </div>
</template>

<script setup>
/**
 * EbAiConsole — AI 工作台（业务编排组件）
 * 欢迎标题（高亮词渐变）+ 示例问题 + EbAiPromptBox + Chatbot 家族会话区；
 * 首次发送后欢迎区收起、会话展开；engine 传外部 useChatEngine 实例则完全受控，
 * 缺省内部创建；transport(content, attachments, context) 由使用方注入模型调用，
 * context = { scene, capabilities, model }（PromptBox 的完整上下文）。
 */
import { computed, ref } from 'vue'
import EbIcon from "@wil-works/evoke-business-ui/icon"
import EbAiPromptBox from '../ai-prompt-box/index.vue'
import EbChatApproval from '../chatbot/ChatApproval.vue'
import EbChatQuestion from '../chatbot/ChatQuestion.vue'
import EbChatContextMeter from '../chatbot/ChatContextMeter.vue'
import EbChatStatusBar from '../chatbot/ChatStatusBar.vue'
import ChatList from '../chatbot/ChatList.vue'
import ChatThreads from '../chatbot/ChatThreads.vue'
import { useChatEngine } from '../chatbot/useChatEngine'
import { useChatLabels } from '../chatbot/labels'

defineOptions({ name: 'EbAiConsole' })

const labels = useChatLabels()

const props = defineProps({
  /** 外部引擎（useChatEngine 返回值）；缺省内部创建 */
  engine: { type: Object, default: null },
  /** useChatSessions 返回值：传了即渲染左侧会话列表并接管引擎与发送 */
  sessions: { type: Object, default: null },
  /** transport(content, attachments, context)：流式回写由使用方驱动引擎。
   *  刻意不叫 onSend——该名会与 emit('send') 的监听器约定撞车被二次调用 */
  transport: { type: Function, default: null },
  /** 欢迎区 { title, highlight?, subtitle? }；highlight 在 title 中渐变高亮 */
  welcome: { type: Object, default: null },
  /** 示例问题：string 或 { text, prompt? }（prompt 缺省用 text） */
  examples: { type: Array, default: () => [] },
  /** 示例点击行为：send 直发 / fill 仅填充 */
  exampleAction: { type: String, default: 'send' },
  /** 透传 EbAiPromptBox 的配置面 */
  placeholder: { type: String, default: void 0 },
  disabled: { type: Boolean, default: false },
  /** 强制 loading（与引擎态取或：停止钮与输入禁用都吃它） */
  loading: { type: Boolean, default: false },
  scenes: { type: Array, default: () => [] },
  capabilities: { type: Array, default: () => [] },
  models: { type: Array, default: () => [] },
  quota: { type: [String, Object], default: null },
  showSettings: { type: Boolean, default: false },
  allowAttachments: { type: Boolean, default: true },
  maxAttachments: { type: Number, default: 5 },
  maxLength: { type: Number, default: 2000 },
  sendOnEnter: { type: Boolean, default: true },
  stoppable: { type: Boolean, default: false },
  /** 待审批请求 { id, toolName, reason?, detail?, status? }：有值时审批面板接管输入区 */
  approval: { type: Object, default: null },
  /** 待回答请求 { id, items: [...] }：审批缺席时提问面板接管输入区 */
  question: { type: Object, default: null },
  /** 上下文占用 { used, capacity, breakdown? }：给了就在输入台上方显示占用环 */
  context: { type: Object, default: null },
  /** 状态条 { phase, label?, tool?, elapsed?, hint?, queue? }：空态不渲染 */
  status: { type: Object, default: null },
  /** 当前阶段能否中断（决定状态条是否给「停止」钮） */
  statusStoppable: { type: Boolean, default: false },
  /** 生成中是否允许继续投递（引擎入队等下一轮）；关掉则生成中拦下 */
  queueable: { type: Boolean, default: false },
  /** 会话区 */
  showThinking: { type: Boolean, default: true },
  renderMode: { type: String, default: 'markdown' },
  autoScroll: { type: Boolean, default: true },
  /** 双方显示名（同时决定默认头像首字）；不传时取当前语言包 */
  userName: { type: String, default: void 0 },
  assistantName: { type: String, default: void 0 },
  /** 消息头部开关与时间位置，透传 ChatList；头像/昵称传对象可分侧 */
  showAvatar: { type: [Boolean, Object], default: true },
  showName: { type: [Boolean, Object], default: true },
  showTime: { type: Boolean, default: true },
  /** 头像图片地址 */
  avatarUser: { type: String, default: '' },
  avatarAssistant: { type: String, default: '' },
  /** 消息动作条自定义动作 { key, label, icon? } */
  actions: { type: Array, default: () => [] },
  /** 用户消息可编辑重发 */
  editable: { type: Boolean, default: false },
  editMaxLength: { type: Number, default: 0 },
  /** 助手消息点赞点踩 */
  feedback: { type: Boolean, default: false },
  feedbackReasons: { type: Array, default: () => [] },
  toolRetryable: { type: Boolean, default: true },
  speech: { type: Boolean, default: false },
  traceUrl: { type: String, default: "" },
  /** 会话区最大高度（px 或 CSS 值） */
  chatHeight: { type: [Number, String], default: 420 },
  showTip: { type: Boolean, default: true },
})

const emit = defineEmits([
  'send',
  'stop',
  'approval-respond',
  'question-respond',
  'status-queue',
  'copy',
  'regenerate',
  'action',
  'edit',
  'feedback',
  'suggestion-click',
  'citation-click',
  'tool-retry',
  'plan-toggle',
  'plan-step-click',
  'confirm-respond',
  'artifact-open',
  'artifact-copy',
  'file-select',
  'quota-click',
  'settings-click',
  'example-click',
])

// ─── 引擎（外部受控 / 内部自建） ───
const internalEngine = useChatEngine({ onSend: (...args) => props.transport?.(...args) })
// sessions 模式下引擎属于各 thread，Console 只做展示
const hasThreads = computed(() => !!props.sessions)
const sessionThreads = computed(() => props.sessions?.threads?.value ?? [])
const sessionActiveId = computed(() => props.sessions?.activeId?.value ?? '')
const sessionStreamingIds = computed(() => props.sessions?.streamingIds?.value ?? [])
const engineRef = computed(
  () => props.sessions?.activeEngine?.value || props.engine || internalEngine
)
const messages = computed(() => engineRef.value.messages.value)
// 引擎态与外部强制 loading 合并（stoppable 停止钮、输入禁用都吃这个）
const loading = computed(() => props.loading || engineRef.value.loading.value)
const hasMessages = computed(() => messages.value.length > 0)

// ─── 输入台状态（v-model 中转） ───
const boxText = ref('')
const boxRef = ref(null)
const sceneState = ref('')
const capabilityState = ref([])
const modelState = ref('')

const resolvedExamples = computed(() =>
  props.examples.map((ex) => (typeof ex === 'string' ? { text: ex, prompt: ex } : { prompt: ex.prompt ?? ex.text, ...ex }))
)

const chatStyle = computed(() => {
  const h = props.chatHeight
  return { maxHeight: typeof h === 'number' ? `${h}px` : h }
})

function handleSend(payload) {
  boxText.value = ''
  const context = {
    scene: payload.scene,
    capabilities: payload.capabilities,
    model: payload.model,
  }
  // 走 sessions.send 才能拿到自动起标题、并发上限这些编排行为
  if (props.sessions) {
    props.sessions.send(payload.text, payload.attachments, context)
  } else {
    engineRef.value.sendMessage(payload.text, payload.attachments, context)
  }
  emit('send', payload)
}

function pickExample(ex) {
  emit('example-click', ex)
  if (props.exampleAction === 'fill') {
    boxText.value = ex.prompt
    return
  }
  handleSend({
    text: ex.prompt,
    scene: sceneState.value,
    capabilities: [...capabilityState.value],
    model: modelState.value,
    attachments: [],
  })
}

// 会话区转发上来的是消息对象，引擎要的是 id——此前直接把对象当 id 传，
// findIndex 永不命中，「重新生成」是个死按钮
function handleRegenerate(message) {
  engineRef.value.regenerateMessage(message?.id);
  emit('regenerate', message);
}
// action 是 (key, message) 两参，$event 只接得住第一个
function handleAction(key, message) {
  emit('action', key, message);
}
// 编辑重发：交回宿主决定是走引擎 editAndResend 还是自己截断重发
function handleEdit(message, content) {
  emit('edit', message, content);
}
function handleFeedback(message, payload) {
  emit('feedback', message, payload);
}
function handleSuggestionClick(text, suggestion, message) {
  emit('suggestion-click', text, suggestion, message);
}
function handleCitationClick(id, message) {
  emit('citation-click', id, message);
}
function handleToolRetry(toolCall, message) {
  emit('tool-retry', toolCall, message);
}

const listRef = ref(null)

defineExpose({
  engine: engineRef,
  clear: () => (props.sessions ? props.sessions.clear() : engineRef.value.clearMessages()),
  listRef,
  /** 取回/预填草稿：队列的「取回编辑」、外部按钮都用它 */
  setDraft: (text) => {
    boxText.value = String(text ?? '')
  },
  /** 程序化发送：与输入台走同一条路径（队列的「立即发送」用它） */
  send: (text, attachments = []) => handleSend({ text, scene: sceneState.value, capabilities: [...capabilityState.value], model: modelState.value, attachments }),
  /** 聚焦输入框 */
  focus: () => boxRef.value?.focus?.(),
})
</script>

<style src="./style.css"></style>
