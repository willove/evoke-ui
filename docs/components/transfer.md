# Transfer 穿梭框

双栏数据搬运：勾选左侧候选后点击按钮移入右侧（`modelValue` 为右侧 `key` 数组），支持搜索过滤。

## 基础用法

<DemoBlock>
  <eb-transfer
    v-model="targetKeys"
    :data="transferData"
    :titles="['候选成员', '项目成员']"
    filterable
    filter-placeholder="搜索成员"
    @change="onChange"
  />
  <p style="margin-top: 8px; font-size: 12px; color: var(--eb-text-color-secondary);">已选：{{ targetKeys.join('、') || '—' }}</p>
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

const slotData = [
  { key: 'css', label: '样式重构', count: 12 },
  { key: 'perf', label: '性能优化', count: 5 },
  { key: 'a11y', label: '无障碍适配', count: 8 },
]
const slotKeys = ref(['a11y'])

const oneWayKeys = ref([])
</script>

## 单向模式

`one-way` 开启后隐藏右到左的回移按钮，并收起已选区的勾选入口（行内与表头），数据只从左向右移动——适合「确认即生效」的分配场景。

<DemoBlock>
  <eb-transfer v-model="oneWayKeys" :data="transferData" one-way filterable />
</DemoBlock>

## 自定义行内容

`item` 作用域插槽两栏共用，暴露 `item`（行数据）与 `direction`（left / right，来源面板）；未提供插槽时回退渲染 `label` 纯文本。

<DemoBlock>
  <eb-transfer v-model="slotKeys" :data="slotData" :titles="['待规划', '进行中']">
    <template #item="{ item, direction }">
      <span :style="{ fontWeight: direction === 'right' ? 600 : 400 }">{{ item.label }}（{{ item.count }}）</span>
    </template>
  </eb-transfer>
</DemoBlock>

## Transfer API

| 名称 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| modelValue | Array | `[]` | 右侧已选项的 key 数组（v-model） |
| data | Array | `[]` | 全量数据，项为 `{ key, label }` |
| titles | Array | `['列表 1', '列表 2']` | 左右栏标题，缺省取当前语言包 |
| filterable | Boolean | `false` | 开启搜索 |
| filter-placeholder | String | 取语言包（中文为 请输入搜索内容） | 搜索占位 |
| disabled | Boolean | `false` | 整体禁用：移动按钮、勾选框与搜索框联动 |
| one-way | Boolean | `false` | 单向模式：隐藏回移按钮与已选区勾选入口，数据只从左向右移动 |

事件：`update:modelValue`、`change(keys)`。

<ApiTable title="Transfer Slots" :rows="[
  { name: 'item', desc: '行内容作用域插槽，参数 item（行数据）与 direction（left / right），两栏共用，缺省渲染 label', type: '—', default: '—' },
]" />
