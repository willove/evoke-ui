# Select 选择器

> 移动端：下拉 popper 改为底部选择面板，参见 [移动端 · 数据录入](/mobile/data-entry)。

<script setup>
import { ref } from 'vue'

const v = ref('')
const filterV = ref('')
const sizeL = ref('')
const sizeS = ref('')
const sizeM = ref('')
const mSel = ref('')
const mv = ref([])
const colV = ref(['beijing', 'shanghai', 'hangzhou', 'chengdu'])
const createV = ref('')
const groupV = ref('shanghai')
const remoteV = ref('')
const remoteLoading = ref(false)
const remoteOptions = ref([
  { value: 'shenzhen', label: '深圳' },
  { value: 'guangzhou', label: '广州' },
])
const dataV = ref('')
const virtualV = ref('')
const cityOptions = [
  '上海', '北京', '广州', '深圳', '杭州', '成都', '武汉', '南京', '重庆', '苏州', '西安', '长沙',
].map((c) => ({ value: c, label: c }))
const hugeOptions = Array.from({ length: 10000 }, (_, i) => ({
  value: i + 1,
  label: `数据行 ${String(i + 1).padStart(5, '0')}`,
}))
let remoteTimer = null
function handleRemoteSearch(query) {
  remoteLoading.value = true
  if (remoteTimer) clearTimeout(remoteTimer)
  remoteTimer = setTimeout(() => {
    remoteLoading.value = false
    remoteOptions.value = query
      ? [{ value: query + '-dev', label: query + ' 研发组' }, { value: query + '-ops', label: query + ' 运维组' }]
      : [{ value: 'shenzhen', label: '深圳' }, { value: 'guangzhou', label: '广州' }]
  }, 400)
}
</script>


下拉选择控件：Option 挂载时向 Select 注册，支持单选 / 多选、可搜索与自定义过滤、远程搜索、允许创建、折叠标签、选项分组与键盘导航（上下键高亮、Enter 选中、Esc 关闭、Backspace 删除多选末项）。

## 基础用法

<DemoBlock>
<eb-select v-model="v" placeholder="请选择" clearable style="width: 200px;">
  <eb-option label="华东" value="east" />
  <eb-option label="华南" value="south" />
  <eb-option label="华北" value="north" />
</eb-select>
</DemoBlock>

单选时绑定值为选中项的 value；clearable 默认关闭，开启后单选有值时展示清空按钮，点击清空绑定值并触发 clear 事件。

## 多选与折叠标签

multiple 时绑定值为数组，选中项以可关闭的 tag 呈现，选择后下拉保持打开；collapse-tags 只展示前 max-collapse-tags 个 tag（默认 1），其余折叠为 + N 计数，避免撑高筛选区。

<DemoBlock>
<eb-select v-model="mv" multiple placeholder="请选择城市" style="width: 280px;">
  <eb-option label="北京" value="beijing" /><eb-option label="上海" value="shanghai" />
  <eb-option label="杭州" value="hangzhou" /><eb-option label="成都" value="chengdu" />
</eb-select>
<eb-select v-model="colV" multiple collapse-tags :max-collapse-tags="2" placeholder="已选城市" style="width: 300px;">
  <eb-option label="北京" value="beijing" /><eb-option label="上海" value="shanghai" />
  <eb-option label="杭州" value="hangzhou" /><eb-option label="成都" value="chengdu" />
</eb-select>
</DemoBlock>

## 可搜索

filterable 开启后可在输入框中按 label 关键字过滤选项；需要按拼音、编码等自定义规则过滤时传 filter-method（(query, option) => boolean 返回是否保留）。

<DemoBlock>
<eb-select v-model="filterV" filterable placeholder="输入关键字搜索" style="width: 220px;">
  <eb-option label="北京" value="beijing" /><eb-option label="上海" value="shanghai" />
  <eb-option label="广州" value="guangzhou" /><eb-option label="深圳" value="shenzhen" />
</eb-select>
</DemoBlock>

## 允许创建

allow-create 配合 filterable：搜索无匹配项时把当前输入作为临时选项出现在下拉首位，回车选中后写入绑定值，适合标签、备注类自由输入。

<DemoBlock>
<eb-select v-model="createV" filterable allow-create placeholder="选择或输入标签" style="width: 220px;">
  <eb-option label="重点客户" value="vip" /><eb-option label="到期提醒" value="expire" />
</eb-select>
</DemoBlock>

## 远程搜索

remote 声明远程模式：键入时调用 remote-method(query) 拉取选项（示例做了 400ms 防抖），loading 期间下拉展示加载文案，常用于大数据量字典搜索。

<DemoBlock>
<eb-select v-model="remoteV" filterable remote :remote-method="handleRemoteSearch" :loading="remoteLoading" placeholder="输入关键字远程搜索" style="width: 260px;">
  <eb-option v-for="opt in remoteOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
</eb-select>
</DemoBlock>

## 数据模式与虚拟滚动

传 `options` 数组即进入数据模式：无需手写 eb-option，下拉由组件直接渲染；再叠加 `virtual` 开启虚拟滚动——万级选项只渲染可视窗口，滚动、键盘、过滤全程流畅。

<DemoBlock>
<div style="display:flex;gap:16px;flex-wrap:wrap">
  <eb-select v-model="dataV" :options="cityOptions" placeholder="数据模式（12 城）" style="width: 220px;" />
  <eb-select v-model="virtualV" :options="hugeOptions" virtual filterable placeholder="虚拟滚动（10000 项，可搜索）" style="width: 240px;" />
</div>
</DemoBlock>

## 选项分组

eb-option-group 以 label 作为分组标题，把选项按业务维度归组，长列表更易扫读。

<DemoBlock>
<eb-select v-model="groupV" style="width: 220px;">
  <eb-option-group label="华东">
    <eb-option label="上海" value="shanghai" />
    <eb-option label="杭州" value="hangzhou" />
  </eb-option-group>
  <eb-option-group label="华南">
    <eb-option label="广州" value="guangzhou" />
    <eb-option label="深圳" value="shenzhen" />
  </eb-option-group>
</eb-select>
</DemoBlock>

## 尺寸与禁用

size 支持 large / small；disabled 禁用整个选择器，单个 option 设置 disabled 则该项不可选（呈置灰态）。

<DemoBlock>
<eb-select v-model="sizeL" size="large" style="width: 140px;">
  <eb-option label="大" value="l" />
</eb-select>
<eb-select v-model="sizeS" size="small" style="width: 140px;">
  <eb-option label="小" value="s" />
</eb-select>
<eb-select model-value="east" disabled style="width: 140px;">
  <eb-option label="华东" value="east" />
</eb-select>
<eb-select v-model="sizeM" style="width: 140px;">
  <eb-option label="可选" value="ok" />
  <eb-option label="不可选" value="no" disabled />
</eb-select>
</DemoBlock>

## API

<ApiTable title="Select Props" :rows="[
  { name: 'v-model', desc: '绑定值，多选时为选中 value 数组', type: 'string | number | boolean | array', default: '' },
  { name: 'multiple', desc: '多选，绑定值为数组且选择后下拉保持打开', type: 'boolean', default: 'false' },
  { name: 'disabled', desc: '禁用（同时响应表单禁用态）', type: 'boolean', default: 'false' },
  { name: 'size', desc: '尺寸，支持 large / small', type: 'string', default: '' },
  { name: 'clearable', desc: '可清空，单选有值时展示清空按钮', type: 'boolean', default: 'false' },
  { name: 'placeholder', desc: '占位文本（缺省取语言包默认文案）', type: 'string', default: '' },
  { name: 'filterable', desc: '可搜索，键入关键字按 label 过滤选项', type: 'boolean', default: 'false' },
  { name: 'filter-method', desc: '自定义过滤函数，返回 true 保留该选项', type: '(query, option) => boolean', default: 'null' },
  { name: 'remote', desc: '远程搜索模式，过滤交给 remote-method', type: 'boolean', default: 'false' },
  { name: 'remote-method', desc: '远程搜索方法，键入时以当前关键字调用', type: '(query: string) => void', default: 'null' },
  { name: 'loading', desc: '加载中，下拉展示加载文案', type: 'boolean', default: 'false' },
  { name: 'allow-create', desc: '允许创建无匹配的新选项（需配合 filterable）', type: 'boolean', default: 'false' },
  { name: 'collapse-tags', desc: '多选时折叠超出数量的 tag', type: 'boolean', default: 'false' },
  { name: 'max-collapse-tags', desc: '折叠模式下展示的 tag 数上限，其余折叠为 + N', type: 'number', default: '1' },
  { name: 'collapse-tags-tooltip', desc: '预留参数（当前版本未启用）', type: 'boolean', default: 'false' },
  { name: 'options', desc: '数据模式选项数组，传入后下拉由组件渲染，无需手写 option', type: '{ value, label?, disabled? }[]', default: 'null' },
  { name: 'virtual', desc: '虚拟滚动（需配合 options），万级选项只渲染可视窗口', type: 'boolean', default: 'false' },
  { name: 'name', desc: '原生 name 属性', type: 'string', default: '—' },
  { name: 'ripple', desc: '激活涟漪动效开关：聚焦时实体色影向外扩展；也可在 Form 上批量关闭或全局 setRipple(false)', type: 'boolean', default: 'true' },
]" />

<ApiTable title="Select Events" :rows="[
  { name: 'update:modelValue / change', desc: '选中值变化（选择、移除 tag、清空、Backspace 均触发）', type: '(value) => void', default: '—' },
  { name: 'clear', desc: '点击清空按钮', type: '() => void', default: '—' },
  { name: 'visible-change', desc: '下拉展开 / 收起', type: '(visible: boolean) => void', default: '—' },
  { name: 'remove-tag', desc: '多选移除某一选中项（tag 关闭或再次点击已选项）', type: '(value) => void', default: '—' },
  { name: 'filter-change', desc: '搜索关键字变化', type: '(query: string) => void', default: '—' },
  { name: 'blur', desc: '下拉关闭时触发', type: '() => void', default: '—' },
  { name: 'focus', desc: '预留声明（当前版本未主动触发）', type: '() => void', default: '—' },
]" />

<ApiTable title="Select Methods" :rows="[
  { name: 'focus', desc: 'filterable 时聚焦搜索输入框，否则打开下拉', type: '() => void', default: '—' },
  { name: 'blur', desc: '关闭下拉并触发 blur', type: '() => void', default: '—' },
  { name: 'toggleDropdown', desc: '切换下拉展开 / 收起', type: '() => void', default: '—' },
  { name: 'clearSelection', desc: '清空选中值', type: '() => void', default: '—' },
  { name: 'updateDropdown', desc: '手动刷新下拉浮层定位', type: '() => void', default: '—' },
]" />

<ApiTable title="Option Props" :rows="[
  { name: 'value', desc: '选项值（必填）', type: 'string | number | boolean', default: '—' },
  { name: 'label', desc: '选项显示文案，缺省显示 String(value)', type: 'string | number', default: '' },
  { name: 'disabled', desc: '该项不可选', type: 'boolean', default: 'false' },
]" />

<ApiTable title="Option Slots" :rows="[
  { name: 'default', desc: '自定义选项内容（如图标 + 文案），缺省显示 label', type: '—', default: '—' },
]" />

<ApiTable title="OptionGroup Props" :rows="[
  { name: 'label', desc: '分组标题文案', type: 'string', default: '' },
  { name: 'disabled', desc: '分组禁用（预留声明，禁用请设置在 option 上）', type: 'boolean', default: 'false' },
]" />

## 移动端适配

容器环境为 mobile 时（优先级：ConfigProvider `platform` > 全局 `setPlatform()` > 自动探测：视口 ≤ 768px 或触屏设备），选择器不再渲染浮动下拉，而是**底部弹出选择面板**（带遮罩、圆角、安全区适配），点选即回填并关闭；桌面环境保持原形态。下方演示通过 `platform="mobile"` 强制移动形态（无论当前设备）：

<DemoBlock>
  <eb-config-provider platform="mobile">
    <eb-select v-model="mSel" placeholder="请选择城市（移动形态）" style="width: 240px">
      <eb-option label="上海" value="shanghai" />
      <eb-option label="深圳" value="shenzhen" />
      <eb-option label="杭州" value="hangzhou" />
    </eb-select>
  </eb-config-provider>
</DemoBlock>

