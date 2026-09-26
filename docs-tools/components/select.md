# EtSelect · 工具界面选择器

底座 `EbSelect` 的密度适配包装：size 缺省时按当前密度档映射，其余全透传。

```vue
<script setup>
import { ref } from 'vue'
const size = ref(12)
const options = [
  { value: 12, label: '12' },
  { value: 14, label: '14' },
  { value: 16, label: '16' },
]
</script>

<template>
  <et-select v-model="size" :options="options" size="small" @change="onChange" />
</template>
```

## Props

| 名称 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `modelValue` | String \| Number \| Boolean \| Array \| Object | `''` | 选中值 |
| `size` | String | `undefined` | 显式传入优先；缺省按密度档映射 |
| 透传 | —— | —— | 其余属性经 `v-bind="$attrs"` 下传 `EbSelect`（含 `options` / `field-names` / `label-in-value` / `virtual` …） |

## Emits

| 名称 | 载荷 | 说明 |
| --- | --- | --- |
| `update:modelValue` | value | v-model 回写 |
| `change` | value | 选中变化 |
| `clear` | —— | 清空 |
| `visible-change` | boolean | 浮层显隐 |
| `remove-tag` | value | 多选移除标签 |
| `filter-change` | string | 过滤词变化 |
| `blur` / `focus` | Event | 焦点事件 |

## Slots

| 名称 | 作用域 | 说明 |
| --- | --- | --- |
| 透传 | —— | 插槽模式（`EbOption` 注册）与 `#empty` 等底座槽原样可用 |

## 行为

- 密度映射：`compact → small`、`default → ''`、`relaxed → large`；同文件导出 `mapDensityToSelectSize(density)` 供单测。
- 未挂 EtProvider 时 `useDensity()` 回落 `'default'`。
- 暴露 `focus()` / `blur()` / `toggleDropdown()` / `clearSelection()` / `updateDropdown()`。
- 控件高 24/32/40 对齐 Fluent UI 的 small/medium/large 阶梯，不发明新档位。

## 令牌与门禁

- 密度覆盖写在全局 `.eb-select__dropdown` 上（与 EtDropdown 同因：底座浮层经 Teleport 渲染）。
- G1 / G7：密度由容器负责，不改底座组件内部。
