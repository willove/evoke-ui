# Popconfirm 气泡确认框

轻量二次确认：点击目标弹出确认气泡，代替 Dialog 完成低风险操作确认（删除、停用等）。箭头自动锚定触发元素。

## 基础用法

<DemoBlock>
  <eb-space size="middle">
    <eb-popconfirm title="确定删除该记录吗？" @confirm="onConfirm" @cancel="onCancel">
      <eb-button type="danger" plain>删除</eb-button>
    </eb-popconfirm>
    <eb-popconfirm title="确认停用该账号？" icon-type="danger" confirm-button-text="停用" cancel-button-text="取消">
      <eb-button>停用账号</eb-button>
    </eb-popconfirm>
  </eb-space>
  <p style="margin-top: 8px; font-size: 12px; color: var(--eb-text-color-secondary);">结果：{{ result }}</p>
</DemoBlock>

## 不同方位与语义图标

<DemoBlock>
  <eb-space size="middle" style="flex-wrap: wrap">
    <eb-popconfirm v-for="p in placements" :key="p" :title="`placement: ${p}`" :placement="p">
      <eb-button size="small">{{ p }}</eb-button>
    </eb-popconfirm>
  </eb-space>
</DemoBlock>

## 危险操作（红色确认按钮）

<DemoBlock>
  <eb-popconfirm title="该操作将清空回收站且不可恢复，确定继续吗？" icon-type="danger" confirm-button-text="清空" cancel-button-text="再想想" confirm-button-type="danger">
    <eb-button type="danger">清空回收站</eb-button>
  </eb-popconfirm>
</DemoBlock>

<script setup>
import { ref } from 'vue'
const result = ref('—')
const placements = ['top', 'bottom', 'left', 'right']
function onConfirm() {
  result.value = '已确认删除'
}
function onCancel() {
  result.value = '已取消'
}
</script>

## Popconfirm API

| 名称 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| title | String | — | 确认文案 |
| confirm-button-text | String | `确定` | 确认按钮文案 |
| cancel-button-text | String | `取消` | 取消按钮文案 |
| confirm-button-type | String | `primary` | 确认按钮类型（危险操作可用 danger） |
| icon | String | `warning` | 图标名 |
| icon-type | String | `warning` | 图标语义色 |
| placement | String | `top` | 12 个方位 |

事件：`confirm`、`cancel`；触发元素放入默认插槽。
