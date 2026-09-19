# Tree 树形控件

层级数据展示与交互：展开/收起、勾选（父子联动可选）、选中高亮、搜索过滤与懒加载，常用于组织架构、目录、权限树。

## 基础用法

<DemoBlock>
  <div style="max-width: 340px; border: 1px solid var(--eb-border-color-lighter); border-radius: 8px; padding: 8px;">
    <eb-tree :data="data" default-expand-all node-key="id" @node-click="onNodeClick" />
  </div>
  <p style="margin-top: 8px; font-size: 12px; color: var(--eb-text-color-secondary);">点击节点：{{ clicked || '—' }}</p>
</DemoBlock>

## 勾选模式

<DemoBlock>
  <div style="max-width: 340px; border: 1px solid var(--eb-border-color-lighter); border-radius: 8px; padding: 8px;">
    <eb-tree :data="data" show-checkbox node-key="id" default-expand-all :default-checked-keys="['1-1']" />
  </div>
</DemoBlock>

## 选中高亮（受控）

`highlight-current` 开启点击高亮，`current-change` 拿到当前节点；实例方法 `setCurrentKey` / `getCurrentKey` 支持程序化选中，传 `null` 取消选中：

<DemoBlock>
  <div style="max-width: 340px; border: 1px solid var(--eb-border-color-lighter); border-radius: 8px; padding: 8px;">
    <eb-tree ref="currentTreeRef" :data="data" node-key="id" highlight-current default-expand-all @current-change="onCurrentChange" />
  </div>
  <div style="margin-top: 8px; display: flex; gap: 8px; align-items: center;">
    <eb-button @click="onMarkCurrent">程序化选中前端组</eb-button>
    <eb-button @click="onClearCurrent">取消选中</eb-button>
    <span style="font-size: 12px; color: var(--eb-text-color-secondary);">当前：{{ currentLabel || '—' }}</span>
  </div>
</DemoBlock>

## 勾选联动与半选

父子默认级联：全选父级勾选全部后代，部分勾选呈半选态；`check-strictly` 切换为父子互不联动。`check` 事件携带完整勾选信息，也可随时用 `getCheckedKeys(true)` 只取叶子、`getHalfCheckedKeys()` 取半选：

<DemoBlock>
  <div style="display: flex; gap: 24px; flex-wrap: wrap; align-items: flex-start;">
    <div style="width: 300px; border: 1px solid var(--eb-border-color-lighter); border-radius: 8px; padding: 8px;">
      <eb-tree ref="checkTreeRef" :data="data" node-key="id" show-checkbox default-expand-all :check-strictly="strictMode" :default-checked-keys="['1-1', '2-1']" @check="onTreeCheck" />
    </div>
    <div style="font-size: 13px; color: var(--eb-text-color-secondary);">
      <p style="display: flex; align-items: center; gap: 8px; margin: 0 0 8px;">
        <eb-switch v-model="strictMode" />
        父子勾选不联动（check-strictly）
      </p>
      <p style="margin: 0 0 4px;">{{ checkSummary || '勾选节点试试' }}</p>
      <eb-button text @click="onShowLeafKeys">只看叶子选中</eb-button>
    </div>
  </div>
</DemoBlock>

## 懒加载

`lazy` + `load` 按需拉取子级：首次展开未加载节点时调用 `load(node, resolve)`，`resolve([])` 即视为叶子；未提供初始 `data` 时挂载后自动加载根级：

<DemoBlock>
  <div style="max-width: 340px; border: 1px solid var(--eb-border-color-lighter); border-radius: 8px; padding: 8px;">
    <eb-tree :lazy="true" :load="lazyLoad" node-key="id" :indent="20" />
  </div>
</DemoBlock>

## 搜索过滤

先传 `filter-node-method` 声明匹配规则，再调用实例方法 `filter(value)` 触发过滤——命中的节点连同其祖先链保留展示，清空关键词即恢复：

<DemoBlock>
  <div style="max-width: 340px;">
    <eb-input v-model="filterWord" placeholder="输入关键词，如：前端" clearable @input="onFilterInput" @clear="onFilterReset" />
    <div style="margin-top: 8px; border: 1px solid var(--eb-border-color-lighter); border-radius: 8px; padding: 8px;">
      <eb-tree ref="filterTreeRef" :data="data" node-key="id" default-expand-all :filter-node-method="onFilterNode" />
    </div>
  </div>
</DemoBlock>

<script setup>
import { ref, nextTick, onMounted, watch } from 'vue'

const clicked = ref('')
const data = [
  {
    id: '1',
    label: '研发部',
    children: [
      { id: '1-1', label: '前端组' },
      { id: '1-2', label: '后端组' },
    ],
  },
  {
    id: '2',
    label: '交付部',
    children: [
      { id: '2-1', label: '实施组' },
      { id: '2-2', label: '运维组' },
    ],
  },
]
function onNodeClick(node) {
  clicked.value = node.label
}

// ─── 选中高亮（受控） ───
const currentTreeRef = ref(null)
const currentLabel = ref('')
const onCurrentChange = (nodeData) => {
  currentLabel.value = nodeData?.label ?? ''
}
const onMarkCurrent = () => currentTreeRef.value?.setCurrentKey('1-1')
const onClearCurrent = () => {
  currentTreeRef.value?.setCurrentKey(null)
  currentLabel.value = ''
}

// ─── 勾选联动与半选 ───
const checkTreeRef = ref(null)
const strictMode = ref(false)
const checkSummary = ref('')
function syncCheckSummary() {
  const tree = checkTreeRef.value
  if (!tree) return
  checkSummary.value = `选中 ${tree.getCheckedKeys().length} 项 / 半选 ${tree.getHalfCheckedKeys().length} 项`
}
const onTreeCheck = () => syncCheckSummary()
const onShowLeafKeys = () => {
  const tree = checkTreeRef.value
  if (tree) checkSummary.value = `叶子选中：${tree.getCheckedKeys(true).join('、') || '无'}`
}
watch(strictMode, () => nextTick(syncCheckSummary))

// ─── 懒加载 ───
function lazyLoad(node, resolve) {
  setTimeout(() => {
    if (node.level === 0) {
      resolve([
        { id: 'region-east', label: '华东区域' },
        { id: 'region-south', label: '华南区域' },
      ])
      return
    }
    if (node.level >= 3) {
      resolve([])
      return
    }
    resolve([
      { id: `${node.data.id}-1`, label: `${node.data.label} · 一组` },
      { id: `${node.data.id}-2`, label: `${node.data.label} · 二组`, isLeaf: true },
    ])
  }, 600)
}

// ─── 搜索过滤 ───
const filterTreeRef = ref(null)
const filterWord = ref('')
const onFilterNode = (word, nodeData) => !word || String(nodeData.label).toLowerCase().includes(String(word).toLowerCase())
const onFilterInput = () => filterTreeRef.value?.filter(filterWord.value)
const onFilterReset = () => filterTreeRef.value?.filter('')

onMounted(() => nextTick(syncCheckSummary))
</script>

## Tree API

<ApiTable title="Tree Props" :rows="[
  { name: 'data', desc: '树形数据源，字段可用 props 映射', type: 'array', default: '[]' },
  { name: 'props', desc: '字段映射 { children, label, disabled, isLeaf }', type: 'object', default: '{}' },
  { name: 'node-key', desc: '唯一键字段，实例方法与勾选回显依赖它', type: 'string', default: '—' },
  { name: 'show-checkbox', desc: '节点前显示复选框', type: 'boolean', default: 'false' },
  { name: 'check-strictly', desc: '父子勾选不联动', type: 'boolean', default: 'false' },
  { name: 'default-expand-all', desc: '默认展开全部', type: 'boolean', default: 'false' },
  { name: 'default-expanded-keys', desc: '默认展开的节点 key', type: 'array', default: '[]' },
  { name: 'default-checked-keys', desc: '默认勾选的节点 key（非严格模式向下级联）', type: 'array', default: '[]' },
  { name: 'expand-on-click-node', desc: '点击节点展开/收起', type: 'boolean', default: 'true' },
  { name: 'check-on-click-node', desc: '点击节点切换勾选（需开启复选框）', type: 'boolean', default: 'false' },
  { name: 'highlight-current', desc: '点击高亮当前节点，配合 current-change 与 setCurrentKey', type: 'boolean', default: 'false' },
  { name: 'current-node-key', desc: '初始选中节点 key', type: 'string | number', default: '—' },
  { name: 'filter-node-method', desc: '过滤匹配函数 (word, data) => boolean，配合 filter() 方法', type: 'function', default: 'null' },
  { name: 'accordion', desc: '手风琴模式，同父兄弟节点互斥展开（全层级生效）', type: 'boolean', default: 'false' },
  { name: 'indent', desc: '层级缩进像素', type: 'number', default: '16' },
  { name: 'empty-text', desc: '空数据文案', type: 'string', default: '暂无数据' },
  { name: 'lazy / load', desc: '懒加载开关与加载函数 load(node, resolve)', type: 'boolean / function', default: 'false / null' },
]" />

<ApiTable title="Tree Events" :rows="[
  { name: 'node-click', desc: '节点被点击', type: '(data, node) => void', default: '—' },
  { name: 'node-expand / node-collapse', desc: '节点展开 / 收起', type: '(data, node) => void', default: '—' },
  { name: 'check', desc: '勾选变化，携带勾选与半选明细', type: '(data, { checkedKeys, checkedNodes, halfCheckedKeys, halfCheckedNodes }) => void', default: '—' },
  { name: 'check-change', desc: '节点勾选状态变化', type: '(data, checked: boolean) => void', default: '—' },
  { name: 'current-change', desc: '当前高亮节点变化（需 highlight-current）', type: '(data, node) => void', default: '—' },
  { name: 'node-contextmenu', desc: '节点右键菜单', type: '(event, node) => void', default: '—' },
]" />

<ApiTable title="Tree Methods（defineExpose）" :rows="[
  { name: 'filter', desc: '按关键词过滤，配合 filter-node-method 使用', type: '(value) => void', default: '—' },
  { name: 'setCheckedKeys / getCheckedKeys', desc: '批量设置 / 获取选中 key，getCheckedKeys(leafOnly) 可只取叶子', type: '(keys) / (leafOnly?) => void / array', default: '—' },
  { name: 'setChecked', desc: '设置单个节点勾选（非严格模式向下级联）', type: '(key, checked) => void', default: '—' },
  { name: 'getCheckedNodes', desc: '获取选中节点的原始数据', type: '(leafOnly?) => array', default: '—' },
  { name: 'getHalfCheckedKeys / getHalfCheckedNodes', desc: '获取半选节点 key / 原始数据', type: '() => array', default: '—' },
  { name: 'getNode', desc: '按 key 取内部节点（含 childNodes / level / isLeaf）', type: '(key) => node | null', default: '—' },
  { name: 'setCurrentKey / getCurrentKey', desc: '程序化选中 / 读取当前选中 key，传 null 取消选中', type: '(key) / () => void / key', default: '—' },
  { name: 'getCurrentNode', desc: '读取当前选中节点的原始数据', type: '() => data | null', default: '—' },
]" />
