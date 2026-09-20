# TreeSelect 树形选择

下拉树选择器：[Tree](/components/tree) 与选择器的组合，支持单选 / 多选（复选框）、过滤、懒加载；层级数据用 `props` 字段映射。关闭态触发器支持键盘展开（Enter / Space / ↓）。

## 基础用法

<DemoBlock>
  <eb-tree-select v-model="dept" :data="treeData" placeholder="选择部门" />
  <eb-text size="small" type="info" style="margin-top:8px;display:block">当前值：{{ dept ?? '未选择' }}</eb-text>
</DemoBlock>

## 多选（复选框）

`multiple` + `show-checkbox` 多选回显为标签；`check-strictly` 让父子选中互不联动：

<DemoBlock>
  <eb-tree-select v-model="areas" :data="treeData" multiple show-checkbox collapse-tags placeholder="选择多个区域" />
</DemoBlock>

## 回传值策略

多选复选默认按 `checked-strategy: child` 只回传叶子 key；改为 `parent` 时只回传「子级全选中」的最上层父节点（勾满一个大区只记大区，取消任一子级回退到仍全选中的最上层节点），`all` 则连同父级一起回传：

<DemoBlock>
  <eb-tree-select v-model="strategyVal" :data="treeData" multiple show-checkbox checked-strategy="parent" placeholder="勾满大区只记大区" />
  <eb-text size="small" type="info" style="margin-top:8px;display:block">当前值：{{ JSON.stringify(strategyVal) }}</eb-text>
</DemoBlock>

## 对象值形态

`label-in-value` 让绑定值形如 { value, label }（multiple 时为对象数组），业务侧免于二次反查文案；与 `checked-strategy` 组合时 label 取归约后 key 的文案：

<DemoBlock>
  <eb-tree-select v-model="livVal" :data="treeData" label-in-value multiple show-checkbox checked-strategy="parent" placeholder="值形如 { value, label }" />
  <eb-text size="small" type="info" style="margin-top:8px;display:block">当前值：{{ JSON.stringify(livVal) }}</eb-text>
</DemoBlock>

## 过滤

`filterable` 按节点文案过滤；自定义过滤逻辑用 `filter-method`：

<DemoBlock>
  <eb-tree-select v-model="filtered" :data="treeData" filterable placeholder="输入关键词过滤" />
</DemoBlock>

## 任意层级选择

单选默认只能选中叶子；加 `check-strictly` 后点击任意层级节点即可选中，展开/收起改由节点前箭头控制，常用于「选择部门或其上级」场景：

<DemoBlock>
  <eb-tree-select v-model="anyNode" :data="treeData" check-strictly clearable placeholder="大区或团队均可选择" />
  <eb-text size="small" type="info" style="margin-top:8px;display:block">当前值：{{ anyNode ?? '未选择' }}</eb-text>
</DemoBlock>

## 懒加载

`lazy` + `load` 按需拉取子级，展开时才请求；宿主侧把已加载子级合并进 `data`，保证选中回显始终有 label 可查：

<DemoBlock>
  <eb-tree-select v-model="lazyDept" :data="lazyNodes" lazy :load="onLazyLoad" placeholder="懒加载选择团队" />
  <eb-text size="small" type="info" style="margin-top:8px;display:block">当前值：{{ lazyDept ?? '未选择' }}</eb-text>
</DemoBlock>

## 禁用与事件

`disabled` 整体禁用（也可由 Form 注入）；`change` / `remove-tag` / `clear` / `visible-change` 覆盖值变更、删标签、清空与下拉开合：

<DemoBlock>
  <p style="display: flex; align-items: center; gap: 8px; margin: 0 0 8px; font-size: 13px; color: var(--eb-text-color-secondary);">
    <eb-switch v-model="evtDisabled" />
    禁用选择器
  </p>
  <eb-tree-select
    v-model="evtVal"
    :data="treeData"
    multiple
    show-checkbox
    clearable
    :disabled="evtDisabled"
    placeholder="多选团队并观察事件"
    @change="onEvtChange"
    @remove-tag="onEvtRemoveTag"
    @clear="onEvtClear"
    @visible-change="onEvtVisible"
  />
  <div style="margin-top: 8px; font-size: 12px; color: var(--eb-text-color-secondary);">
    <p v-for="(line, idx) in evtLog" :key="idx" style="margin: 2px 0;">{{ line }}</p>
  </div>
</DemoBlock>

<script setup>
import { ref } from 'vue'
const treeData = [
  {
    label: '华东大区',
    value: 'east',
    children: [
      { label: '上海团队', value: 'east-sh' },
      { label: '杭州团队', value: 'east-hz' },
    ],
  },
  {
    label: '华南大区',
    value: 'south',
    children: [
      { label: '广州团队', value: 'south-gz' },
      { label: '深圳团队', value: 'south-sz', disabled: true },
    ],
  },
]
const dept = ref(null)
const areas = ref([])
const filtered = ref(null)

// ─── 回传值策略 ───
const strategyVal = ref([])

// ─── 对象值形态 ───
const livVal = ref([])

// ─── 任意层级选择 ───
const anyNode = ref(null)

// ─── 懒加载 ───
const lazyDept = ref(null)
const lazyNodes = ref([
  { value: 'rd', label: '研发中心' },
  { value: 'deliver', label: '交付中心' },
])
function onLazyLoad(node, resolve) {
  setTimeout(() => {
    const children = [
      { value: `${node.data.value}-fe`, label: `${node.data.label} · 前端组`, isLeaf: true },
      { value: `${node.data.value}-be`, label: `${node.data.label} · 后端组`, isLeaf: true },
    ]
    const parent = lazyNodes.value.find((n) => n.value === node.data.value)
    if (parent) parent.children = [...(parent.children || []), ...children]
    resolve(children)
  }, 500)
}

// ─── 禁用与事件 ───
const evtDisabled = ref(false)
const evtVal = ref([])
const evtLog = ref(['试试勾选团队、删除标签或清空'])
let evtLogSeq = 1
function pushEvtLog(text) {
  evtLog.value = [`${evtLogSeq++}. ${text}`, ...evtLog.value].slice(0, 4)
}
const onEvtChange = (value) => pushEvtLog(`change：${value.length ? value.join('、') : '已清空'}`)
const onEvtRemoveTag = (value) => pushEvtLog(`remove-tag：${value}`)
const onEvtClear = () => pushEvtLog('clear：一键清空')
const onEvtVisible = (visible) => pushEvtLog(`visible-change：${visible ? '展开' : '收起'}`)
</script>

<ApiTable title="TreeSelect Props" :rows="[
  { name: 'modelValue', desc: '绑定值；multiple 时为数组，label-in-value 下形如 { value, label }', type: 'string | number | boolean | array | object', default: '—' },
  { name: 'data', desc: '树形数据（字段可用 props 映射）', type: 'array', default: '[]' },
  { name: 'props', desc: '字段映射 { value, label, children, disabled, isLeaf }', type: 'object', default: '{}' },
  { name: 'node-key', desc: '唯一键字段，缺省取 props.value', type: 'string', default: '—' },
  { name: 'multiple', desc: '多选（回显为标签）', type: 'boolean', default: 'false' },
  { name: 'label-in-value', desc: '绑定值形如 { value, label }（multiple 为对象数组）；与 checked-strategy 组合时 label 取归约后 key 的文案，清空仍为 undefined / 空数组', type: 'boolean', default: 'false' },
  { name: 'size', desc: '尺寸：large / small', type: 'string', default: '—' },
  { name: 'placeholder', desc: '占位文案', type: 'string', default: '请选择' },
  { name: 'show-checkbox', desc: '节点前显示复选框', type: 'boolean', default: 'false' },
  { name: 'check-strictly', desc: '父子选中互不联动；单选时可选中任意层级节点', type: 'boolean', default: 'false' },
  { name: 'checked-strategy', desc: '多选复选回传值归约策略：child 只存叶子 key（默认），parent 只存子级全选中的最上层父 key，all 全存勾选 key；三种形态回显均支持', type: 'string', default: 'child' },
  { name: 'filterable', desc: '可搜索', type: 'boolean', default: 'false' },
  { name: 'filter-method', desc: '自定义过滤 (query, data) => boolean', type: 'function', default: 'null' },
  { name: 'collapse-tags / max-collapse-tags', desc: '多选标签折叠', type: 'boolean / number', default: 'false / 1' },
  { name: 'default-expand-all', desc: '默认展开全部', type: 'boolean', default: 'false' },
  { name: 'default-expanded-keys', desc: '默认展开节点；选中值回显时自动追加其祖先链', type: 'array', default: '[]' },
  { name: 'expand-on-click-node', desc: '点击节点展开（check-strictly 下自动关闭，改由箭头展开）', type: 'boolean', default: 'true' },
  { name: 'check-on-click-node', desc: '点击节点切换勾选（需开启复选框）', type: 'boolean', default: 'false' },
  { name: 'accordion', desc: '手风琴模式（同层互斥展开）', type: 'boolean', default: 'false' },
  { name: 'indent / empty-text', desc: '层级缩进像素与空数据文案', type: 'number / string', default: '16 / 暂无数据' },
  { name: 'clearable', desc: '可清空', type: 'boolean', default: 'false' },
  { name: 'disabled', desc: '禁用', type: 'boolean', default: 'false' },
  { name: 'lazy / load', desc: '懒加载开关与加载函数 load(node, resolve)', type: 'boolean / function', default: 'false / null' },
  { name: 'ripple', desc: '激活涟漪动效开关：聚焦时实体色影向外扩展；也可在 Form 上批量关闭或全局 setRipple(false)', type: 'boolean', default: 'true' },
]" />

<ApiTable title="TreeSelect Events" :rows="[
  { name: 'change', desc: '值变更', type: '(value) => void', default: '—' },
  { name: 'clear', desc: '清空', type: '() => void', default: '—' },
  { name: 'remove-tag', desc: '移除多选标签', type: '(value) => void', default: '—' },
  { name: 'visible-change', desc: '下拉展开 / 收起', type: '(visible: boolean) => void', default: '—' },
  { name: 'node-click', desc: '节点被点击', type: '(data, node) => void', default: '—' },
  { name: 'check', desc: '复选勾选变化，携带勾选与半选明细', type: '(data, { checkedKeys, checkedNodes, halfCheckedKeys, halfCheckedNodes }) => void', default: '—' },
  { name: 'node-expand', desc: '节点展开', type: '(data, node) => void', default: '—' },
  { name: 'focus / blur', desc: '下拉展开 / 收起时触发', type: '() => void', default: '—' },
]" />

<ApiTable title="TreeSelect Methods（defineExpose）" :rows="[
  { name: 'focus / blur', desc: '聚焦（展开下拉）/ 收起下拉', type: '() => void', default: '—' },
  { name: 'filter', desc: '按关键词过滤下拉树，配合 filterable 使用', type: '(value) => void', default: '—' },
  { name: 'getCheckedKeys / getCheckedNodes', desc: '获取选中 key / 原始数据，getCheckedKeys(leafOnly) 可只取叶子', type: '(leafOnly?) => array', default: '—' },
  { name: 'setCheckedKeys / setChecked', desc: '批量 / 单个设置勾选', type: '(keys) / (key, checked) => void', default: '—' },
  { name: 'getHalfCheckedKeys / getHalfCheckedNodes', desc: '获取半选节点 key / 原始数据', type: '() => array', default: '—' },
  { name: 'getNode / setCurrentKey', desc: '按 key 取内部节点 / 程序化选中', type: '(key) => node', default: '—' },
  { name: 'getCurrentKey / getCurrentNode', desc: '读取当前选中 key / 原始数据', type: '() => key | data', default: '—' },
]" />
