# Input 输入框

<script setup>
import { ref } from 'vue'

const v = ref('')
const sizeL = ref('')
const sizeM = ref('')
const sizeS = ref('')
const userV = ref('')
const searchV = ref('')
const suffixV = ref('')
const pw = ref('')
const wordV = ref('evoke-business-ui')
const areaV = ref('多行文本内容')
const errV = ref('')
</script>


通过键盘输入文本的基础表单控件：支持前后置图标与插槽、密码框、字数统计、textarea 多行与高度自适应，内置 error / help 校验提示（error 变化时抖动提醒）。在 eb-form 中使用时，input / blur 时机自动触发所在表单项校验。

## 基础用法

<DemoBlock>
<eb-input v-model="v" placeholder="请输入内容" clearable />
</DemoBlock>

clearable 默认开启：输入非空时右侧出现清空按钮（禁用 / 只读态不显示），点击后清空绑定值、触发 clear 事件并自动回焦输入框。

## 尺寸

size 支持 large / small（缺省为默认高度），用于与页面控件密度对齐；位于 eb-form 内时会继承表单尺寸上下文。

<DemoBlock>
<eb-input v-model="sizeL" size="large" placeholder="large" />
<eb-input v-model="sizeM" placeholder="default" />
<eb-input v-model="sizeS" size="small" placeholder="small" />
</DemoBlock>

## 禁用与只读

disabled 整体禁用并置灰；readonly 保留外观与焦点但内容不可修改，适合展示系统回填、不允许改动的值。

<DemoBlock>
<eb-input model-value="禁用状态" disabled />
<eb-input model-value="只读状态" readonly />
</DemoBlock>

## 密码框

show-password 时输入内容以密文显示，右侧出现明文 / 密文切换图标（有内容时才展示），用于密码、密钥等敏感信息输入。

<DemoBlock>
<eb-input v-model="pw" type="password" show-password placeholder="请输入密码" />
</DemoBlock>

## 前置 / 后置内容

prefix-icon / suffix-icon 传入图标名即可渲染前后置图标（也支持图标组件）；需要放置文本、单位等任意内容时使用 #prefix / #suffix 插槽。

<DemoBlock>
<eb-input v-model="userV" prefix-icon="user" placeholder="用户名" />
<eb-input v-model="searchV" suffix-icon="search" placeholder="搜索关键词" />
<eb-input v-model="suffixV" style="margin-top: 12px;">
  <template #suffix>万元</template>
</eb-input>
</DemoBlock>

## 输入长度与字数统计

maxlength 限制最大输入长度（原生截断）；显式开启 show-word-limit 后在右侧展示当前长度 / 上限计数，超限（粘贴等场景）呈红色告警，多行文本域同样支持。

<DemoBlock>
<eb-input v-model="wordV" :maxlength="10" show-word-limit placeholder="最多 10 个字符" />
<eb-input v-model="wordV" type="textarea" :rows="3" :maxlength="30" show-word-limit placeholder="多行输入同样支持计数" style="margin-top: 12px;" />
</DemoBlock>

## 文本域与高度自适应

type="textarea" 渲染多行输入，rows 指定初始行数（默认 2）；autosize 开启后高度随内容自适应，传 { minRows, maxRows } 约束自适应区间，适合内容长度不可预期的评论、描述类输入。

<DemoBlock>
<eb-input v-model="areaV" type="textarea" :rows="3" placeholder="固定 3 行" />
<eb-input v-model="areaV" type="textarea" :autosize="{ minRows: 2, maxRows: 4 }" placeholder="高度自适应（2 - 4 行）" style="margin-top: 12px;" />
</DemoBlock>

## 校验提示

help 在输入框下方展示灰色辅助说明；error 优先级更高并呈红色，error 文案变化时输入框抖动提醒，重新输入后自动清除错误态。两者也常由 eb-form 校验结果驱动。

<DemoBlock>
<eb-input v-model="errV" help="长度 4 - 16 位，支持字母与数字" placeholder="辅助说明" />
<eb-input v-model="errV" error="该用户名已被占用" placeholder="错误提示" style="margin-top: 12px;" />
</DemoBlock>

## API

<ApiTable title="Input Props" :rows="[
  { name: 'v-model', desc: '绑定值', type: 'string | number', default: '' },
  { name: 'type', desc: '类型，textarea 渲染多行文本域，其余透传为原生 type（如 password）', type: 'string', default: 'text' },
  { name: 'size', desc: '尺寸，支持 large / small', type: 'string', default: '' },
  { name: 'placeholder', desc: '占位文本', type: 'string', default: '' },
  { name: 'disabled', desc: '禁用（同时响应表单禁用态）', type: 'boolean', default: 'false' },
  { name: 'readonly', desc: '只读，可聚焦但不可修改', type: 'boolean', default: 'false' },
  { name: 'clearable', desc: '可清空，有内容时展示清空按钮', type: 'boolean', default: 'true' },
  { name: 'show-password', desc: '密码框，展示明文 / 密文切换按钮', type: 'boolean', default: 'false' },
  { name: 'prefix-icon', desc: '前置图标（图标名或组件）', type: 'string | component', default: '—' },
  { name: 'suffix-icon', desc: '后置图标（图标名或组件）', type: 'string | component', default: '—' },
  { name: 'maxlength', desc: '最大输入长度（原生截断）', type: 'number', default: '—' },
  { name: 'show-word-limit', desc: '展示字数统计，需配合 maxlength', type: 'boolean', default: 'false' },
  { name: 'rows', desc: 'textarea 初始行数', type: 'number', default: '2' },
  { name: 'autosize', desc: 'textarea 高度自适应，传对象 { minRows, maxRows } 约束区间', type: 'boolean | object', default: 'false' },
  { name: 'error', desc: '错误提示文案（红色，优先于 help，变化时抖动）', type: 'string', default: '' },
  { name: 'help', desc: '辅助说明文案', type: 'string', default: '' },
  { name: 'name', desc: '原生 name 属性', type: 'string', default: '—' },
  { name: 'autocomplete', desc: '原生 autocomplete 属性', type: 'string', default: 'off' },
  { name: 'validate-event', desc: '是否在 input / blur 时触发表单项校验', type: 'boolean', default: 'true' },
  { name: 'ripple', desc: '激活涟漪动效开关：聚焦时实体色影向外扩展；也可在 Form 上批量关闭或全局 setRipple(false)', type: 'boolean', default: 'true' },
]" />

<ApiTable title="Input Events" :rows="[
  { name: 'update:modelValue', desc: '输入时同步绑定值', type: '(value: string) => void', default: '—' },
  { name: 'input', desc: '原生 input 事件，每次键入触发', type: '(value: string) => void', default: '—' },
  { name: 'change', desc: '原生 change 事件，失焦或回车且值变化时触发', type: '(value: string) => void', default: '—' },
  { name: 'focus', desc: '聚焦', type: '(e: FocusEvent) => void', default: '—' },
  { name: 'blur', desc: '失焦，并触发表单项 blur 校验', type: '(e: FocusEvent) => void', default: '—' },
  { name: 'clear', desc: '点击清空按钮（同时清空绑定值并回焦）', type: '() => void', default: '—' },
  { name: 'keydown', desc: '原生 keydown 事件', type: '(e: KeyboardEvent) => void', default: '—' },
]" />

<ApiTable title="Input Slots" :rows="[
  { name: 'prefix', desc: '输入框前置内容，与 prefix-icon 共存', type: '—', default: '—' },
  { name: 'suffix', desc: '输入框后置内容，与 suffix-icon / 清空按钮共存', type: '—', default: '—' },
]" />

<ApiTable title="Input Methods" :rows="[
  { name: 'focus', desc: '使输入框聚焦', type: '() => void', default: '—' },
  { name: 'blur', desc: '使输入框失焦', type: '() => void', default: '—' },
  { name: 'select', desc: '选中文本框全部内容', type: '() => void', default: '—' },
  { name: 'ref', desc: '内部原生 input / textarea 元素引用', type: 'HTMLInputElement | HTMLTextAreaElement', default: '—' },
]" />
