# ColumnSettings 列设置

表格列设置触发器：列显隐复选 + 拖拽排序，`storageKey` 提供时自动持久化到 localStorage（经安全封装），列定义变化自动收敛。

规则要点：

- `v-model` 是按显示顺序排列的可见列 `prop` 数组——顺序即拖拽结果，缺失的 `prop` 即隐藏列；
- 至少保留一列可见，取消最后一列的勾选会被忽略；重新勾选时列回到其在 `columns` 中的定义位置；
- 非受控（不传 `v-model`）时组件内部维护状态，配 `storage-key` 可在刷新后恢复；
- 列定义变化时自动剔除已不存在的列、把新增列按定义顺序补尾。

## 基础用法

通常放在 EbDataTable 的 toolbar 插槽内：

<DemoBlock>
  <eb-column-settings
    button-text="列设置"
    :columns="[
      { prop: 'name', label: '名称' },
      { prop: 'amount', label: '金额' },
      { prop: 'owner', label: '负责人' },
    ]"
    :model-value="['name', 'amount', 'owner']"
  />
</DemoBlock>

<script setup>
import { computed, ref } from 'vue'
const csAllColumns = [
  { prop: 'name', label: '名称' },
  { prop: 'owner', label: '负责人' },
  { prop: 'amount', label: '金额' },
  { prop: 'createdAt', label: '创建时间' },
]
const csVisible = ref(['name', 'owner', 'amount', 'createdAt'])
const csTableColumns = computed(() =>
  csVisible.value.map((p) => csAllColumns.find((c) => c.prop === p)).filter(Boolean),
)
const csRows = [
  { name: '订单 A-1001', owner: '张三', amount: 9900, createdAt: '2026-09-01' },
  { name: '订单 A-1002', owner: '李四', amount: 12800, createdAt: '2026-09-02' },
]
const csRef = ref(null)
const csSaved = ref('')
</script>

## 与 DataTable 联动

把 `v-model` 结果映射回 `columns` 即完成联动：隐藏列不渲染，拖拽排序直接改变表格列顺序；实例方法 `reset()` 等价于面板内的重置按钮。

<DemoBlock>
  <eb-data-table
    title="订单列表"
    :columns="csTableColumns"
    :data="csRows"
  >
    <template #toolbar>
      <eb-column-settings
        ref="csRef"
        v-model="csVisible"
        button-text="列设置"
        :columns="csAllColumns"
      />
      <eb-button @click="csRef.reset()">重置列</eb-button>
    </template>
  </eb-data-table>
</DemoBlock>

试试取消勾选金额列或把创建时间拖到最前，表格即时跟随。

## 持久化到本地

非受控 + `storage-key`：选择结果写入 localStorage，刷新页面后自动恢复（仅恢复仍然存在的列，新列补尾）；`change` 事件可用于同步到服务端偏好。

<DemoBlock>
  <eb-column-settings
    storage-key="docs-column-settings-demo"
    :columns="[{ prop: 'name', label: '名称' }, { prop: 'owner', label: '负责人' }, { prop: 'amount', label: '金额' }]"
    @change="(v) => (csSaved = v.join(' / '))"
  />
  <p style="margin-top: 8px;">当前可见列：{{ csSaved || '（尚未操作，默认全显）' }}</p>
</DemoBlock>

不传 `button-text` 时触发器只显示齿轮图标，适合空间紧张的工具栏。

## API

<ApiTable title="ColumnSettings Props" :rows="[
  { name: 'columns', desc: '全量列定义（定义顺序），项为 { prop, label }', type: '{ prop, label }[]', default: '[]' },
  { name: 'v-model', desc: '按显示顺序的可见列 prop 数组；未传时组件内部维护', type: 'string[]', default: '—' },
  { name: 'storageKey', desc: 'localStorage 持久化 key（非受控时生效）', type: 'string', default: '' },
  { name: 'buttonText', desc: '触发按钮文字（缺省只显示图标）', type: 'string', default: '' },
]" />

<ApiTable title="Events" :rows="[
  { name: 'update:modelValue', desc: '显隐/排序变化', type: '(props: string[]) => void', default: '—' },
  { name: 'change', desc: '同上（同时触发，非受控时用它拿到结果）', type: '(props: string[]) => void', default: '—' },
]" />

<ApiTable title="Methods" :rows="[
  { name: 'reset', desc: '恢复定义顺序全显', type: '() => void', default: '—' },
]" />

本组件无插槽；弹出面板（复选列表 + 重置按钮）由组件内置。
