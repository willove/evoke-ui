# Transfer 穿梭框

双栏数据搬运：勾选左侧候选后点击按钮移入右侧（`modelValue` 为右侧 `key` 数组），支持搜索过滤。

## 基础用法

<DemoBlock>
  <ev-transfer
    v-model="targetKeys"
    :data="transferData"
    :titles="['候选成员', '项目成员']"
    filterable
    filter-placeholder="搜索成员"
    @change="onChange"
  />
  <p style="margin-top: 8px; font-size: 12px; color: var(--ev-text-color-secondary);">已选：{{ targetKeys.join('、') || '—' }}</p>
</DemoBlock>

<script setup>
import { ref } from 'vue'

const transferData = [
  { key: 'zhang', label: '张三' },
  { key: 'li', label: '李四' },
  { key: 'wang', label: '王五' },
  { key: 'zhao', label: '赵六' },
  { key: 'sun', label: '孙七' },
]
const targetKeys = ref(['zhang', 'zhao'])
function onChange(keys) {
  // keys 即更新后的 modelValue
}
</script>

## Transfer API

| 名称 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| modelValue | Array | `[]` | 右侧已选项的 key 数组（v-model） |
| data | Array | `[]` | 全量数据，项为 `{ key, label }` |
| titles | Array | `['列表 1', '列表 2']` | 左右栏标题 |
| filterable | Boolean | `false` | 开启搜索 |
| filter-placeholder | String | `请输入搜索内容` | 搜索占位 |

事件：`update:modelValue`、`change(keys)`。
