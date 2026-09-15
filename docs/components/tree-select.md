# TreeSelect 树形选择

下拉树选择器：[Tree](/components/tree) 与选择器的组合，支持单选 / 多选（复选框）、过滤、懒加载；层级数据用 `props` 字段映射。

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

## 过滤

`filterable` 按节点文案过滤；自定义过滤逻辑用 `filter-method`：

<DemoBlock>
  <eb-tree-select v-model="filtered" :data="treeData" filterable placeholder="输入关键词过滤" />
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
</script>

<ApiTable title="TreeSelect Props" :rows="[
  { name: 'modelValue', desc: '绑定值；multiple 时为数组', type: 'string | number | boolean | array', default: '—' },
  { name: 'data', desc: '树形数据（字段可用 props 映射）', type: 'array', default: '[]' },
  { name: 'props', desc: '字段映射 { value, label, children, disabled, isLeaf }', type: 'object', default: '{}' },
  { name: 'multiple', desc: '多选（回显为标签）', type: 'boolean', default: 'false' },
  { name: 'show-checkbox', desc: '节点前显示复选框', type: 'boolean', default: 'false' },
  { name: 'check-strictly', desc: '父子选中互不联动', type: 'boolean', default: 'false' },
  { name: 'filterable', desc: '可搜索', type: 'boolean', default: 'false' },
  { name: 'filter-method', desc: '自定义过滤 (query, data) => boolean', type: 'function', default: 'null' },
  { name: 'collapse-tags / max-collapse-tags', desc: '多选标签折叠', type: 'boolean / number', default: 'false / 1' },
  { name: 'default-expand-all', desc: '默认展开全部', type: 'boolean', default: 'false' },
  { name: 'accordion', desc: '手风琴模式（同层互斥展开）', type: 'boolean', default: 'false' },
  { name: 'clearable', desc: '可清空', type: 'boolean', default: 'false' },
  { name: 'disabled', desc: '禁用', type: 'boolean', default: 'false' },
  { name: 'lazy / load', desc: '懒加载开关与加载函数', type: 'boolean / function', default: 'false / null' },
  { name: 'ripple', desc: '激活涟漪动效开关：聚焦时实体色影向外扩展；也可在 Form 上批量关闭或全局 setRipple(false)', type: 'boolean', default: 'true' },
]" />

<ApiTable title="TreeSelect Events" :rows="[
  { name: 'change', desc: '值变更', type: '(value) => void', default: '—' },
  { name: 'clear', desc: '清空', type: '() => void', default: '—' },
  { name: 'remove-tag', desc: '移除多选标签', type: '(value) => void', default: '—' },
]" />
