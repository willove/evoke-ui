# CascaderPanel 级联面板

[Cascader](/components/cascader) 的面板本体：不带输入框触发器，适合嵌在弹窗、表单空白区或自定义触发器里。字段映射、多选、任意级选中均由 `props` 配置。

## 基础用法

逐级展开，默认回传完整路径：

<DemoBlock>
  <eb-cascader-panel v-model="path" :options="options" />
  <eb-text size="small" type="info" style="margin-top:8px;display:block">当前路径：{{ path ?? '未选择' }}</eb-text>
</DemoBlock>

## 多选与任意级选中

`multiple` 多选 + `check-strictly` 允许只选父级：

<DemoBlock>
  <eb-cascader-panel v-model="multi" :options="options" :props="{ multiple: true, checkStrictly: true }" />
  <eb-text size="small" type="info" style="margin-top:8px;display:block">已选：{{ JSON.stringify(multi) }}</eb-text>
</DemoBlock>

<script setup>
import { ref } from 'vue'
const options = [
  {
    value: 'east',
    label: '华东',
    children: [
      { value: 'sh', label: '上海' },
      { value: 'hz', label: '杭州' },
    ],
  },
  {
    value: 'south',
    label: '华南',
    children: [
      { value: 'gz', label: '广州' },
      { value: 'sz', label: '深圳' },
    ],
  },
]
const path = ref(null)
const multi = ref([])
</script>

<ApiTable title="CascaderPanel Props" :rows="[
  { name: 'modelValue', desc: '绑定值；emitPath 开启时为路径数组', type: 'string | number | array', default: '—' },
  { name: 'options', desc: '级联数据', type: 'array', default: '[]' },
  { name: 'props', desc: '配置 { value, label, children, disabled, multiple, checkStrictly, emitPath, expandTrigger }', type: 'object', default: '{}' },
  { name: 'border', desc: '显示边框', type: 'boolean', default: 'true' },
]" />

<ApiTable title="CascaderPanel Events" :rows="[
  { name: 'change', desc: '选中变化', type: '(value) => void', default: '—' },
  { name: 'expand-change', desc: '展开路径变化', type: '(path: array) => void', default: '—' },
  { name: 'close', desc: '请求关闭（多选完成）', type: '() => void', default: '—' },
]" />

<ApiTable title="CascaderPanel Exposes" :rows="[
  { name: 'getCheckedNodes', desc: '获取选中节点', type: '() => array', default: '—' },
  { name: 'clearChecked', desc: '清空选中', type: '() => void', default: '—' },
  { name: 'activePath', desc: '当前展开路径（响应式）', type: 'array', default: '[]' },
]" />
