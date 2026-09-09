# Switch 开关

<script setup>
import { ref } from 'vue'

const v = ref(true)
const valV = ref('yes')
const asyncV = ref(true)
const switching = ref(false)
const adminV = ref(true)
const pubV = ref(true)
const inlineV = ref(true)
function handleAsyncChange(val) {
  switching.value = true
  setTimeout(() => {
    asyncV.value = val
    switching.value = false
  }, 800)
}
</script>


表示两种相互对立状态的切换控件，支持自定义开 / 关时的取值与文案，以及异步加载态。在 ev-form 中 change 时机自动触发校验。

## 基础用法

<DemoBlock>
  <ev-switch v-model="v" />
  <ev-switch :model-value="true" disabled />
  <ev-switch loading />
</DemoBlock>

v-model 绑定布尔值（与 active-value / inactive-value 比较判定状态）；disabled 禁用切换，loading 呈加载中并同样阻止切换。静态回显用 :model-value 绑定即可。

基础用法之上，还有两种改变默认行为的方式：改变取值语义与异步受控，见下方示例。

## 文案与尺寸

`active-text / inactive-text` 自定义两侧文案（建议配合 `width` 加宽开关）；`inline-prompt` 时文案内嵌同时呈现；`size` 切换 small / large 尺寸。

<DemoBlock>
  <ev-switch v-model="pubV" active-text="发布" inactive-text="下线" />
  <ev-switch v-model="inlineV" inline-prompt active-text="开" inactive-text="关" :width="52" />
  <ev-switch v-model="inlineV" size="small" style="margin-left: 12px;" />
  <ev-switch v-model="inlineV" size="large" style="margin-left: 12px;" />
</DemoBlock>

## 自定义取值

active-value / inactive-value 让开 / 关写入自定义值（字符串、数字等）：绑定值与 active-value 相等即为开态，适合后端字段语义不是 boolean 的场景（如下例 yes / no 与 1 / 0）。

<DemoBlock>
  <ev-switch v-model="valV" active-value="yes" inactive-value="no" />
  <span style="margin-left: 12px;">当前值：{{ valV }}</span>
  <ev-switch :model-value="1" :active-value="1" :inactive-value="0" style="margin-left: 24px;" />
</DemoBlock>

## 异步切换

等待服务端确认再翻转的受控写法：用 `:model-value` 受控 + change 回调里先置 loading（阻止重复切换），请求成功后再把新值写入绑定值。loading 期间开关不可操作。

<DemoBlock>
  <ev-switch :model-value="asyncV" :loading="switching" @change="handleAsyncChange" />
</DemoBlock>

handleAsyncChange 定义见页面顶部 script：模拟 800ms 请求后提交新值，实际项目中替换为接口调用即可。

## 组合场景：控制配置项可用性

开关驱动其它控件的可用性是后台表单的高频组合：关闭后关联输入框联动禁用，直观表达该配置未启用。

<DemoBlock>
  <ev-switch v-model="adminV" active-text="仅管理员" inactive-text="所有人" :width="64" />
  <ev-input model-value="系统配置说明" :disabled="!adminV" style="margin-top: 12px;" />
</DemoBlock>

## API

<ApiTable title="Switch Props" :rows="[
  { name: 'v-model', desc: '绑定值（与 active-value 比较判定开态）', type: 'string | number | boolean', default: 'false' },
  { name: 'active-value', desc: '打开时的值', type: 'string | number | boolean', default: 'true' },
  { name: 'inactive-value', desc: '关闭时的值', type: 'string | number | boolean', default: 'false' },
  { name: 'active-text', desc: '打开态文案（两侧或内嵌展示）', type: 'string', default: '' },
  { name: 'inactive-text', desc: '关闭态文案', type: 'string', default: '' },
  { name: 'inline-prompt', desc: '文案内嵌显示（开 / 关文案同时呈现于两侧）', type: 'boolean', default: 'false' },
  { name: 'width', desc: '开关宽度（px），放置文案时建议加宽', type: 'string | number', default: '—' },
  { name: 'size', desc: '尺寸，支持 small / default / large', type: 'string', default: 'default' },
  { name: 'disabled', desc: '禁用（同时响应表单禁用态）', type: 'boolean', default: 'false' },
  { name: 'loading', desc: '加载中（禁止切换并显示旋转图标）', type: 'boolean', default: 'false' },
  { name: 'name', desc: '原生 input name 属性', type: 'string', default: '—' },
]" />

<ApiTable title="Switch Events" :rows="[
  { name: 'update:modelValue', desc: '状态切换，返回切换后的值（active-value 或 inactive-value）', type: '(value: string | number | boolean) => void', default: '—' },
  { name: 'change', desc: '状态切换，与 update:modelValue 同步触发', type: '(value: string | number | boolean) => void', default: '—' },
]" />

<ApiTable title="Switch Methods" :rows="[
  { name: 'focus', desc: '使内部 input 聚焦', type: '() => void', default: '—' },
  { name: 'blur', desc: '使内部 input 失焦', type: '() => void', default: '—' },
  { name: 'ref', desc: '内部原生 input 元素引用', type: 'HTMLInputElement', default: '—' },
]" />
