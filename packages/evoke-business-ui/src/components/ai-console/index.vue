<template>
  <div class="eb-ai-console">
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
        :user-name="userName"
        :assistant-name="assistantName"
        :actions="actions"
        @copy="emit('copy', $event)"
        @regenerate="handleRegenerate"
        @action="handleAction"
      >
        <template v-if="$slots.empty" #empty><slot name="empty" /></template>
      </ChatList>
    </div>

    <!-- 输入台 -->
    <div class="eb-ai-console__input">
      <EbAiPromptBox
        v-model="boxText"
        v-model:scene="sceneState"
        v-model:active-capabilities="capabilityState"
        v-model:model="modelState"
        :placeholder="placeholder"
        :disabled="disabled"
        :loading="loading"
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
      </EbAiPromptBox>
      <div v-if="showTip" class="eb-ai-console__tip">
        <slot name="tip">
          <span>内容由 AI 生成，仅供参考</span>
        </slot>
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
import EbIcon from '../icon/index.vue'
import EbAiPromptBox from '../ai-prompt-box/index.vue'
import ChatList from '../chatbot/ChatList.vue'
import { useChatEngine } from '../chatbot/useChatEngine'

defineOptions({ name: 'EbAiConsole' })

const props = defineProps({
  /** 外部引擎（useChatEngine 返回值）；缺省内部创建 */
  engine: { type: Object, default: null },
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
  placeholder: { type: String, default: '今天你想创造什么？' },
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
  /** 会话区 */
  showThinking: { type: Boolean, default: true },
  renderMode: { type: String, default: 'markdown' },
  autoScroll: { type: Boolean, default: true },
  /** 双方显示名（同时决定默认头像首字） */
  userName: { type: String, default: '我' },
  assistantName: { type: String, default: 'AI助手' },
  /** 头像图片地址 */
  avatarUser: { type: String, default: '' },
  avatarAssistant: { type: String, default: '' },
  /** 消息动作条自定义动作 { key, label, icon? } */
  actions: { type: Array, default: () => [] },
  /** 会话区最大高度（px 或 CSS 值） */
  chatHeight: { type: [Number, String], default: 420 },
  showTip: { type: Boolean, default: true },
})

const emit = defineEmits([
  'send',
  'stop',
  'copy',
  'regenerate',
  'action',
  'quota-click',
  'settings-click',
  'example-click',
])

// ─── 引擎（外部受控 / 内部自建） ───
const internalEngine = useChatEngine({ onSend: (...args) => props.transport?.(...args) })
const engineRef = computed(() => props.engine || internalEngine)
const messages = computed(() => engineRef.value.messages.value)
// 引擎态与外部强制 loading 合并（stoppable 停止钮、输入禁用都吃这个）
const loading = computed(() => props.loading || engineRef.value.loading.value)
const hasMessages = computed(() => messages.value.length > 0)

// ─── 输入台状态（v-model 中转） ───
const boxText = ref('')
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
  engineRef.value.sendMessage(payload.text, payload.attachments, {
    scene: payload.scene,
    capabilities: payload.capabilities,
    model: payload.model,
  })
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

const listRef = ref(null)

defineExpose({
  engine: engineRef,
  clear: () => engineRef.value.clearMessages(),
  listRef,
})
</script>

<style src="./style.css"></style>
