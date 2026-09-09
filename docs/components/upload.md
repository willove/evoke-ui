# Upload 上传

<script setup>
import { ref } from 'vue'

const files = ref([
  { uid: 1, name: '需求说明.pdf', size: 204800, status: 'success', percentage: 100 },
])
const limitFiles = ref([])
const exceeded = ref(false)
const manualRef = ref(null)
const cardFiles = ref([])
const cardExceeded = ref(false)
const thumbs = ref({})

function submitManual() {
  manualRef.value?.submit()
}

// 内置列表只渲染「图标 + 文件名」卡片，不含图片缩略图；需要预览时用 FileReader 把 file.raw 转 data URL 自行渲染
function readThumb(file) {
  if (!file?.raw?.type?.startsWith('image/')) return
  const reader = new FileReader()
  reader.onload = (e) => { thumbs.value = { ...thumbs.value, [file.uid]: e.target?.result || '' } }
  reader.readAsDataURL(file.raw)
}
</script>


文件上传组件：隐藏 input 覆盖触发区，XHR 直传 `action`（FormData 提交，文件字段名由 `name` 指定，`data` 附加表单字段、`headers` 附加请求头），内置文件列表、进度条与数量限制。文件项包含 `uid / name / size / status（ready | uploading | success | fail）/ percentage` 字段；上传过程中 status 为 uploading 并展示进度，结束后按 HTTP 状态码落入 success 或 fail。

## 基础用法

`action` 为必传上传地址，`multiple` 支持一次选择多个文件，`accept` 按扩展名或 MIME 过滤可选文件。

<DemoBlock>
  <ev-upload action="https://httpbin.org/post" multiple accept=".png,.jpg,.pdf" />
</DemoBlock>

## 受控文件列表

`v-model:file-list` 受控列表，可预置已上传文件（status 为 success 的项带已上传图标），移除文件时同步更新。

<DemoBlock>
  <ev-upload action="https://httpbin.org/post" v-model:file-list="files" />
</DemoBlock>

## 数量限制

`limit` 限制最大数量，超限不再加入列表并触发 `exceed` 事件。

<DemoBlock>
  <ev-upload
    action="https://httpbin.org/post"
    v-model:file-list="limitFiles"
    :limit="3"
    multiple
    @exceed="exceeded = true"
  />
  <div style="margin-top: 8px;">已选 {{ limitFiles.length }} 个{{ exceeded ? '，最多只能上传 3 个' : '' }}</div>
</DemoBlock>

## 手动上传

`auto-upload=false` 时选择文件仅进入列表（status 为 ready），调用实例方法 `submit` 才开始上传全部 ready 文件。

<DemoBlock>
  <ev-upload ref="manualRef" action="https://httpbin.org/post" :auto-upload="false" multiple />
  <div style="margin-top: 8px;">
    <ev-button type="primary" @click="submitManual">开始上传</ev-button>
  </div>
</DemoBlock>

## 拖拽与照片墙

`drag` 开启拖拽区（点击与拖入都走同一入口，悬停高亮，`#trigger` 可整体替换拖拽区内容，常配 `accept` 限定类型）；`list-type` 三种取值：`text` 普通列表、`picture` 列表项前置文件图标、`picture-card` 触发区与列表呈方形卡片。照片墙常与 `limit` 组合，超限触发 `exceed` 事件且不加入列表。

<DemoBlock>
  <ev-upload action="https://httpbin.org/post" drag multiple accept=".png,.jpg,.pdf" />
  <div style="margin-top: 12px; margin-bottom: 4px; font-size: 12px; color: var(--ev-text-color-secondary);">list-type picture-card：卡片触发区 + 卡片式文件列表</div>
  <ev-upload action="https://httpbin.org/post" list-type="picture-card" multiple :limit="4" @exceed="cardExceeded = true" />
  <div style="margin-top: 12px; margin-bottom: 4px; font-size: 12px; color: var(--ev-text-color-secondary);">list-type picture：普通列表项前置文件图标</div>
  <ev-upload action="https://httpbin.org/post" list-type="picture" multiple />
  <div style="margin-top: 8px;">{{ cardExceeded ? '最多 4 个，超出已被拦截' : '照片墙最多可传 4 个，超出试试' }}</div>
</DemoBlock>

## 照片墙自定义缩略图

内置列表（含 picture-card）渲染的是「图标 + 文件名」，不含图片缩略图预览，组件也没有缩略图插槽；需要预览时的完整做法：`show-file-list=false` 关闭内置列表，`change` 事件拿到 `file.raw` 后用 FileReader 转 data URL，自行渲染卡片网格（本例 `auto-upload=false` 避免真实上传，仅演示本地预览）。

<DemoBlock>
  <ev-upload action="https://httpbin.org/post" list-type="picture-card" :auto-upload="false" :show-file-list="false" v-model:file-list="cardFiles" accept="image/*" @change="readThumb">
    <template #trigger>
      <ev-icon name="plus" :size="20" />
    </template>
  </ev-upload>
  <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px;">
    <div v-for="f in cardFiles" :key="f.uid" style="width: 96px; height: 96px; border: 1px dashed var(--ev-border-color); border-radius: 6px; display: flex; align-items: center; justify-content: center; overflow: hidden;">
      <img v-if="thumbs[f.uid]" :src="thumbs[f.uid]" :alt="f.name" style="width: 100%; height: 100%; object-fit: cover;" />
      <span v-else style="font-size: 12px; color: var(--ev-text-color-secondary); padding: 4px; text-align: center;">{{ f.name }}</span>
    </div>
  </div>
</DemoBlock>

## 自定义触发区与隐藏列表

`#trigger` 插槽替换默认触发内容（drag 模式下替换整个拖拽区）；`show-file-list=false` 隐藏文件列表，配合上传结果事件自行维护展示。

<DemoBlock>
  <ev-upload action="https://httpbin.org/post" :show-file-list="false">
    <template #trigger>
      <ev-button type="primary" icon="upload">上传文件</ev-button>
    </template>
  </ev-upload>
</DemoBlock>

## API

<ApiTable title="Upload Props" :rows="[
  { name: 'action', desc: '上传地址（POST）', type: 'string', default: '' },
  { name: 'headers', desc: '请求头', type: 'object', default: '{}' },
  { name: 'data', desc: '随文件附加的表单字段', type: 'object', default: '{}' },
  { name: 'name', desc: '文件字段名', type: 'string', default: 'file' },
  { name: 'multiple', desc: '支持多选', type: 'boolean', default: 'false' },
  { name: 'limit', desc: '最大上传数量，超限触发 exceed 且不加入列表', type: 'number', default: '—' },
  { name: 'disabled', desc: '禁用（响应表单禁用注入）', type: 'boolean', default: 'false' },
  { name: 'drag', desc: '拖拽上传', type: 'boolean', default: 'false' },
  { name: 'autoUpload', desc: '选择后立即上传，false 时通过 submit 手动提交', type: 'boolean', default: 'true' },
  { name: 'listType', desc: '列表样式', type: 'text | picture | picture-card', default: 'text' },
  { name: 'showFileList', desc: '显示文件列表', type: 'boolean', default: 'true' },
  { name: 'accept', desc: '原生 accept 文件类型过滤', type: 'string', default: '' },
  { name: 'fileList', desc: '受控文件列表（v-model:fileList），缺省内部维护', type: 'array', default: 'undefined' },
  { name: 'beforeUpload', desc: '上传前钩子，返回 false（或抛错）取消上传', type: '(file) => boolean | Promise', default: '—' },
]" />

<ApiTable title="Events" :rows="[
  { name: 'update:fileList', desc: '文件列表变化', type: '(fileList) => void', default: '—' },
  { name: 'change', desc: '文件状态变化（新增/开始上传/结束）', type: '(file, fileList) => void', default: '—' },
  { name: 'remove', desc: '移除文件', type: '(file, fileList) => void', default: '—' },
  { name: 'success', desc: '上传成功（HTTP 2xx）', type: '(response, file, fileList) => void', default: '—' },
  { name: 'error', desc: '上传失败（非 2xx 或网络错误）', type: '(error, file, fileList) => void', default: '—' },
  { name: 'exceed', desc: '超出 limit 数量', type: '(files, fileList) => void', default: '—' },
  { name: 'preview', desc: '点击文件名', type: '(file) => void', default: '—' },
]" />

<ApiTable title="Slots" :rows="[
  { name: 'trigger', desc: '触发区内容（drag 模式下替换整个拖拽区）', type: '—', default: '选择文件 / 拖拽区默认样式' },
]" />

<ApiTable title="Methods" :rows="[
  { name: 'submit', desc: '上传所有 status 为 ready 的文件', type: '() => void', default: '—' },
  { name: 'clearFiles', desc: '清空文件列表', type: '() => void', default: '—' },
  { name: 'abort', desc: '中断指定文件的上传', type: '(file) => void', default: '—' },
  { name: 'handleRemove', desc: '移除指定文件', type: '(file) => void', default: '—' },
]" />
