# Chatbot 对话窗口

开箱可用的 AI 对话窗口：消息流（Markdown 渲染、思考过程、附件）、输入区（Enter 发送 / Shift+Enter 换行、字数与附件上限）、动作条（复制 / 重新生成）。接口层完全由你承接——`send` 事件拿到输入，回写 `modelValue` 即完成闭环。

## 基础对话

发送后回写消息数组，异步回复用 `loading` 显示打字态：

<DemoBlock>
  <eb-chatbot v-model="messages" :loading="pending" height="360px" :show-tip="false" @send="onSend" />
</DemoBlock>

<script setup>
import { ref } from 'vue'

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
</script>

<ApiTable title="Chatbot Props" :rows="[
  { name: 'modelValue', desc: '消息数组，项为 { id, role, content, status, thinking?, attachments? }', type: 'array', default: '[]' },
  { name: 'loading', desc: '回复生成中（ assistant 打字态）', type: 'boolean', default: 'false' },
  { name: 'render-mode', desc: '消息渲染方式：markdown / 纯文本', type: 'markdown | text', default: 'markdown' },
  { name: 'height / width', desc: '容器尺寸', type: 'string | number', default: '600px / 100%' },
  { name: 'send-on-enter', desc: 'Enter 发送、Shift+Enter 换行；关闭后 Enter 换行', type: 'boolean', default: 'true' },
  { name: 'max-length / show-word-count', desc: '输入上限与字数统计', type: 'number / boolean', default: '2000 / false' },
  { name: 'allow-attachments / max-attachments', desc: '附件开关与上限', type: 'boolean / number', default: 'true / 5' },
  { name: 'actions', desc: '消息动作条自定义动作 { key, label, icon? }', type: 'array', default: '[]' },
  { name: 'user-name / assistant-name', desc: '双方显示名', type: 'string', default: '我 / AI助手' },
  { name: 'avatar-user / avatar-assistant', desc: '双方头像地址', type: 'string', default: '' },
  { name: 'auto-scroll', desc: '新消息自动滚动到底部', type: 'boolean', default: 'true' },
  { name: 'disabled', desc: '整体禁用', type: 'boolean', default: 'false' },
]" />

<ApiTable title="Chatbot Events" :rows="[
  { name: 'send', desc: '发送消息（文本 + 附件），回写 modelValue 完成闭环', type: '(text: string, attachments: array) => void', default: '—' },
  { name: 'copy / regenerate', desc: '消息复制 / 重新生成（动作条透传）', type: '(message) => void', default: '—' },
  { name: 'action', desc: 'actions 自定义动作点击', type: '(key: string, message) => void', default: '—' },
]" />
