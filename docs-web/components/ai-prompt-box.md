# AiPromptBox AI 输入台

大模型调用的首屏入口台：模型选择、场景 chips、能力开关、额度展示、发送与停止。设计向组件——渐变描边输入台随 focus 点亮，明暗一体；`send` 事件交出完整调用上下文（`{ text, scene, capabilities, model, attachments }`），模型调用与会话编排由使用方承接。

## 基础用法

<DemoBlock>
  <ev-ai-prompt-box
    v-model="demoText"
    v-model:scene="demoScene"
    v-model:active-capabilities="demoCaps"
    v-model:model="demoModel"
    :scenes="demoScenes"
    :capabilities="demoCaps_"
    :models="demoModels"
    quota="剩余免费额度：100%"
    @send="onSend"
  />
  <div v-if="payload" class="demo-send-payload">send 载荷：<code>{{ payload }}</code></div>
</DemoBlock>

## 停止生成

`stoppable` 开启后，loading 期间发送钮切换为停止钮：

<DemoBlock>
  <ev-ai-prompt-box
    v-model="genText"
    :scenes="demoScenes"
    :loading="generating"
    stoppable
    @send="() => (generating = true)"
    @stop="() => (generating = false)"
  />
</DemoBlock>

## 组合建议

- 产品站的完整对话工作台（欢迎语 + 示例 + 会话流）见姊妹库 business-ui 的 `AiConsole`，两库 `AiPromptBox` API 同面。
- 标题区用 Hero 展示体排版，关键词可借 `--ev-gradient-hero` 做渐变文字。

<script setup>
import { ref } from 'vue'

const demoScenes = [
  { key: 'write', label: '创意写作' },
  { key: 'math', label: '数理逻辑' },
  { key: 'code', label: '代码开发', icon: 'file-list' },
  { key: 'translate', label: '文本翻译' },
]
const demoCaps_ = [
  { key: 'deep-think', label: '深度思考' },
  { key: 'web', label: '联网搜索' },
]
const demoModels = [
  { key: 'qwen-max', label: 'Qwen3.8-Max' },
  { key: 'glm-5', label: 'GLM-5' },
]
const demoText = ref('')
const demoScene = ref('')
const demoCaps = ref([])
const demoModel = ref('qwen-max')
const payload = ref('')
function onSend(p) {
  payload.value = JSON.stringify(p)
}

const genText = ref('')
const generating = ref(false)
</script>

<style>
.demo-send-payload {
  margin-top: 8px;
  font-size: 13px;
  color: var(--ev-color-ink-secondary);
  word-break: break-all;
}
</style>

## API

### Props

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| v-model | 输入文本 | string | `''` |
| placeholder | 占位文本 | string | `'今天你想创造什么？'` |
| disabled | 禁用整个输入台 | boolean | `false` |
| loading | 请求进行中；配合 stoppable 显示停止钮 | boolean | `false` |
| scenes | 场景定义 | `{ key, label, icon? }[]` | `[]` |
| v-model:scene | 当前场景 key；选中后输入台内显示可移除 tag | string | `''` |
| capabilities | 能力开关定义（图标需在 evoke-ui 图标集内） | `{ key, label, icon? }[]` | `[]` |
| v-model:activeCapabilities | 激活的能力 key 集合 | string[] | `[]` |
| models | 模型注册表；非空时显示模型 pill | `{ key, label }[]` | `[]` |
| v-model:model | 当前模型 key | string | `''` |
| quota | 额度展示；传 null 不渲染 | string \| `{ label, percent }` | `null` |
| showSettings | 工具行显示设置按钮 | boolean | `false` |
| allowAttachments / maxAttachments | 允许附件 / 数量上限 | boolean / number | `true` / `5` |
| accept | 附件类型白名单（`.ext` / `mime/*` / `mime/type`，逗号分隔）；拖拽与粘贴路径同样按它校验 | string | — |
| maxFileSize | 单个附件字节上限，0 为不限 | number | `0` |
| allowDrop | 允许拖拽进输入台与粘贴剪贴板图片 | boolean | `true` |
| maxLength / showWordCount | 输入长度上限（绑到 textarea maxlength，字数统计同源）/ 字数统计；未传则不限长 | number / boolean | — / `false` |
| maxRows | 输入区最大行数 | number | `8` |
| sendOnEnter | Enter 发送、Shift+Enter 换行；输入法组字中的 Enter 交还输入法，不会误发 | boolean | `true` |
| stoppable | loading 时发送钮切换为停止钮 | boolean | `false` |

### 事件

| 事件 | 说明 | 参数 |
| --- | --- | --- |
| send | 发送，载荷含完整调用上下文 | `{ text, scene, capabilities, model, attachments }` |
| stop | 停止生成（stoppable 时） | — |
| update:scene / scene-change | 场景切换（含取消） | `key` |
| update:activeCapabilities / capability-change | 能力开关变化 | `keys, key` |
| update:model / model-change | 模型切换 | `key` |
| quota-click / settings-click | 额度 / 设置点击 | — |
| attachment-add | 附件通过校验后触发；第二参数是列表内的响应式对象，回写 `status` / `progress` 即驱动 chip 显示上传中与失败 | `(file, item)` |
| attachment-reject | 附件被拒；`reason` 取 `type` / `size` / `limit` / `empty`，提示文案由宿主决定 | `(file, reason)` |

### 插槽

| 插槽 | 说明 |
| --- | --- |
| toolbar-extra | 工具行左侧追加内容 |
| scenes-append | 场景 chips 行末尾追加 |
