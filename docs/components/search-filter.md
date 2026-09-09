# SearchFilter 筛选表单

查询/重置二合一的筛选表单，`fields` 配置式声明字段，支持输入框与下拉选择，内置查询/重置按钮与回车触发。

行为要点：

- 任意字段变更都会 emit `update:modelValue`，`v-model` 始终拿到完整值对象；
- 点击查询按钮或在输入框内回车都会 emit `search`；`loading` 期间查询被阻止（按钮加载态并忽略回车），防止重复提交；
- 点击重置会把每个字段恢复为 `defaultValue`（未配置则为空串），先 emit `reset`，`searchOnReset` 为真时紧接着再 emit 一次 `search`。

## 基础用法

<DemoBlock>
  <ev-search-filter
    v-model="sfQuery"
    :fields="[
      { prop: 'keyword', label: '关键词', placeholder: '订单号 / 客户名' },
      { prop: 'status', label: '状态', type: 'select', options: [{ label: '启用', value: 'active' }, { label: '禁用', value: 'disabled' }] },
      { prop: 'region', label: '区域', type: 'select', options: [{ label: '华东', value: 'east' }, { label: '华南', value: 'south' }] },
    ]"
    @search="() => {}"
  />
</DemoBlock>

<script setup>
import { ref } from 'vue'
const sfQuery = ref({ keyword: '', status: '', region: '' })
const sfReset = ref({ level: 'p1', email: '', city: 'hz', auditor: '' })
const sfExtra = ref({ keyword: '' })
const sfLive = ref({ keyword: '', status: '' })
const sfLastQuery = ref('（尚未查询）')
function onSfSearch(values) {
  sfLastQuery.value = JSON.stringify(values)
}
</script>

## 布局与加载态

`columns` 控制每行字段数（2 / 3 / 4），`loading` 时查询按钮进入加载态并阻止重复提交。

<DemoBlock>
  <ev-search-filter
    :fields="[{ prop: 'a', label: '字段一' }, { prop: 'b', label: '字段二' }]"
    :columns="2"
    loading
  />
</DemoBlock>

## 重置默认值与字段变体

`type: 'select'` 渲染下拉（`options` 就地内联声明，适合静态枚举；选项来自接口时先请求再更新 fields 即可）。`defaultValue` 是重置时的恢复值；select 默认可清空，`clearable: false` 关闭清空按钮；`disabled` 字段不可编辑但同样参与重置。

<DemoBlock>
  <ev-search-filter
    v-model="sfReset"
    :fields="[
      { prop: 'level', label: '等级', type: 'select', defaultValue: 'p0', options: [{ label: 'P0', value: 'p0' }, { label: 'P1', value: 'p1' }] },
      { prop: 'email', label: '邮箱', placeholder: 'name@example.com' },
      { prop: 'city', label: '城市', type: 'select', clearable: false, options: [{ label: '杭州', value: 'hz' }, { label: '上海', value: 'sh' }] },
      { prop: 'auditor', label: '审核人', disabled: true },
    ]"
  />
</DemoBlock>

先把等级改成 P1、城市选上海，再点重置：所有字段都恢复为各自 `defaultValue`（等级回到 P0，其余回到空串），并自动触发一次查询。

## 自定义操作区

`actions` 插槽渲染在查询/重置按钮之后，适合放高级筛选入口、保存常用条件等自定义操作。

<DemoBlock>
  <ev-search-filter
    v-model="sfExtra"
    :fields="[{ prop: 'keyword', label: '关键词' }]"
  >
    <template #actions>
      <ev-button text type="primary">高级筛选</ev-button>
    </template>
  </ev-search-filter>
</DemoBlock>

## 交互：查询取值

`search` 事件携带当前值对象的快照（拷贝，后续修改不影响已触发的那次）；也可通过实例方法 `getValues()` 主动取值。

<DemoBlock>
  <ev-search-filter
    v-model="sfLive"
    :fields="[
      { prop: 'keyword', label: '关键词' },
      { prop: 'status', label: '状态', type: 'select', options: [{ label: '启用', value: 'active' }, { label: '禁用', value: 'disabled' }] },
    ]"
    @search="onSfSearch"
  />
  <p style="margin-top: 8px;">最近一次查询：{{ sfLastQuery }}</p>
</DemoBlock>

## API

<ApiTable title="SearchFilter Props" :rows="[
  { name: 'v-model', desc: '筛选值对象', type: 'object', default: '{}' },
  { name: 'fields', desc: '字段配置', type: 'Field[]', default: '[]' },
  { name: 'columns', desc: '每行字段数', type: '2 / 3 / 4', default: '3' },
  { name: 'loading', desc: '查询加载态', type: 'boolean', default: 'false' },
  { name: 'searchOnReset', desc: '重置后自动触发查询', type: 'boolean', default: 'true' },
]" />

<ApiTable title="Field" :rows="[
  { name: 'prop', desc: '字段名（对应 v-model 键）', type: 'string', default: '—' },
  { name: 'label', desc: '标签文本', type: 'string', default: '' },
  { name: 'type', desc: '控件类型', type: 'input | select', default: 'input' },
  { name: 'options', desc: 'select 选项 { label, value }', type: 'array', default: '[]' },
  { name: 'placeholder', desc: '占位文本', type: 'string', default: '请输入 / 请选择' },
  { name: 'defaultValue', desc: '重置时恢复的默认值', type: 'any', default: '' },
  { name: 'disabled', desc: '是否禁用', type: 'boolean', default: 'false' },
  { name: 'clearable', desc: '是否可清空', type: 'boolean', default: 'true' },
]" />

<ApiTable title="Slots" :rows="[
  { name: 'actions', desc: '追加在查询/重置按钮后的自定义操作区', type: '—', default: '—' },
]" />

<ApiTable title="Events" :rows="[
  { name: 'search', desc: '点击查询 / 回车 / 重置后触发', type: '(values: object) => void', default: '—' },
  { name: 'reset', desc: '点击重置触发', type: '(values: object) => void', default: '—' },
  { name: 'update:modelValue', desc: '任意字段变更', type: '(values: object) => void', default: '—' },
]" />

<ApiTable title="Methods" :rows="[
  { name: 'getValues', desc: '取当前筛选值（拷贝）', type: '() => object', default: '—' },
  { name: 'reset', desc: '程序化重置（等价点击重置按钮）', type: '() => void', default: '—' },
  { name: 'search', desc: '程序化查询（等价点击查询按钮）', type: '() => void', default: '—' },
]" />
