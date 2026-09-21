# AiPromptBox AI 输入台

大模型调用的聚合输入台：模型选择、场景 chips、能力开关（深度思考 / 联网搜索等）、额度展示、发送与停止，一键交出完整调用上下文。组件**不内置任何请求**——`send` 事件把 `{ text, scene, capabilities, model, attachments }` 一次交出，模型调用（fetch / SSE / SDK）由使用方注入，流式回写可配合 `useChatEngine`。

## 基础用法

选中场景后输入台内出现可移除的场景 tag；能力开关可多选；发送后面板清空并交出上下文（下方演示直接展示载荷）：

<DemoBlock>
  <eb-ai-prompt-box
    v-model="basicText"
    v-model:scene="basicScene"
    v-model:active-capabilities="basicCaps"
    v-model:model="basicModel"
    :scenes="scenes"
    :capabilities="capabilities"
    :models="models"
    quota="剩余免费额度：100%"
    @send="onSend"
  />
  <div v-if="lastPayload" class="demo-payload">最近一次 send 载荷：<code>{{ lastPayload }}</code></div>
</DemoBlock>

## 停止生成

`stoppable` 开启后，`loading` 期间发送钮切换为停止钮，点击触发 `stop`（AbortController 建议由请求方自持）。演示用 4 秒定时任务模拟一次生成：

<DemoBlock>
  <eb-ai-prompt-box
    v-model="stopText"
    :scenes="scenes"
    :loading="generating"
    stoppable
    @send="startGenerate"
    @stop="stopGenerate"
  />
  <div style="margin-top:8px;color:var(--eb-text-color-secondary);font-size:13px">
    {{ generating ? '生成中…（点发送钮可中断）' : generateState }}
  </div>
</DemoBlock>

## 组合成工作台

需要完整 AI 工作台（欢迎标题 + 示例问题 + 会话流）时，直接使用编排组件 [AiConsole](/components/ai-console)，无需自行拼装。

<script setup>
import { ref } from 'vue'

const scenes = [
  { key: 'write', label: '创意写作', icon: 'edit' },
  { key: 'math', label: '数理逻辑', icon: 'funds' },
  { key: 'code', label: '代码开发', icon: 'command' },
  { key: 'translate', label: '文本翻译', icon: 'file-list' },
]
const capabilities = [
  { key: 'deep-think', label: '深度思考', icon: 'brain' },
  { key: 'web', label: '联网搜索', icon: 'global' },
]
const models = [
  { key: 'qwen-max', label: 'Qwen3.8-Max' },
  { key: 'glm-5', label: 'GLM-5' },
  { key: 'deepseek-v4', label: 'DeepSeek-V4' },
]

const basicText = ref('')
const basicScene = ref('')
const basicCaps = ref([])
const basicModel = ref('qwen-max')
const lastPayload = ref('')
function onSend(payload) {
  lastPayload.value = JSON.stringify(payload)
}

const stopText = ref('')
const generating = ref(false)
const generateState = ref('输入内容并发送开始模拟生成')
let timer = null
function startGenerate() {
  generating.value = true
  generateState.value = ''
  timer = setTimeout(() => {
    generating.value = false
    generateState.value = '生成完成'
  }, 4000)
}
function stopGenerate() {
  clearTimeout(timer)
  generating.value = false
  generateState.value = '已手动停止'
}
</script>

<style>
.demo-payload {
  margin-top: 8px;
  font-size: 13px;
  color: var(--eb-text-color-secondary);
  word-break: break-all;
}
</style>

<ApiTable title="AiPromptBox Props" :rows="[
  { name: 'v-model', desc: '输入文本', type: 'string', default: '' },
  { name: 'placeholder', desc: '占位文本', type: 'string', default: '今天你想创造什么？' },
  { name: 'disabled', desc: '禁用整个输入台', type: 'boolean', default: 'false' },
  { name: 'loading', desc: '请求进行中；配合 stoppable 显示停止钮', type: 'boolean', default: 'false' },
  { name: 'scenes', desc: '场景定义（key / label / icon）', type: '{ key, label, icon? }[]', default: '[]' },
  { name: 'v-model:scene', desc: '当前场景 key；选中后输入台内显示可移除 tag', type: 'string', default: '' },
  { name: 'capabilities', desc: '能力开关定义（词汇表由使用方定）', type: '{ key, label, icon? }[]', default: '[]' },
  { name: 'v-model:activeCapabilities', desc: '激活的能力 key 集合', type: 'string[]', default: '[]' },
  { name: 'models', desc: '模型注册表；非空时输入台上方显示模型 pill', type: '{ key, label, icon? }[]', default: '[]' },
  { name: 'v-model:model', desc: '当前模型 key', type: 'string', default: '' },
  { name: 'quota', desc: '额度展示；传 null 不渲染', type: 'string | { label, percent }', default: 'null' },
  { name: 'showSettings', desc: '工具行显示设置按钮', type: 'boolean', default: 'false' },
  { name: 'allowAttachments', desc: '允许附件', type: 'boolean', default: 'true' },
  { name: 'maxAttachments', desc: '附件数量上限', type: 'number', default: '5' },
  { name: 'accept', desc: '附件类型白名单（.ext / mime/* / mime/type，逗号分隔）；拖拽与粘贴路径同样按它校验', type: 'string', default: '—' },
  { name: 'maxFileSize', desc: '单个附件字节上限，0 为不限', type: 'number', default: '0' },
  { name: 'allowDrop', desc: '允许拖拽进输入台与粘贴剪贴板图片', type: 'boolean', default: 'true' },
  { name: 'maxLength', desc: '文本长度上限，真正约束 textarea；未传不限长', type: 'number', default: '—' },
  { name: 'showWordCount', desc: '显示字数统计', type: 'boolean', default: 'false' },
  { name: 'maxRows', desc: '输入区最大行数（超出滚动）', type: 'number', default: '8' },
  { name: 'sendOnEnter', desc: 'Enter 发送、Shift+Enter 换行；输入法组字中的 Enter 交还输入法，不会误发', type: 'boolean', default: 'true' },
  { name: 'stoppable', desc: 'loading 时发送钮切换为停止钮', type: 'boolean', default: 'false' },
]" />

<ApiTable title="AiPromptBox Events" :rows="[
  { name: 'send', desc: '发送，载荷含完整调用上下文', type: '({ text, scene, capabilities, model, attachments }) => void', default: '—' },
  { name: 'stop', desc: '停止生成（stoppable 时）', type: '() => void', default: '—' },
  { name: 'update:scene / scene-change', desc: '场景切换（含取消）', type: '(key: string) => void', default: '—' },
  { name: 'update:activeCapabilities / capability-change', desc: '能力开关变化', type: '(keys: string[], key: string) => void', default: '—' },
  { name: 'update:model / model-change', desc: '模型切换', type: '(key: string) => void', default: '—' },
  { name: 'quota-click', desc: '点击额度胶囊', type: '() => void', default: '—' },
  { name: 'settings-click', desc: '点击设置按钮', type: '() => void', default: '—' },
  { name: 'attachment-add', desc: '附件通过校验后触发；第二参数是列表内的响应式对象，宿主回写 status / progress 即驱动 chip 显示上传中与失败', type: '(file: File, item) => void', default: '—' },
  { name: 'attachment-reject', desc: '附件被拒；reason 取 type / size / limit / empty，提示文案由宿主决定', type: '(file: File, reason: string) => void', default: '—' },
]" />

<ApiTable title="AiPromptBox Slots" :rows="[
  { name: 'toolbar-extra', desc: '工具行左侧追加内容', type: '—', default: '—' },
  { name: 'scenes-append', desc: '场景 chips 行末尾追加', type: '—', default: '—' },
]" />
