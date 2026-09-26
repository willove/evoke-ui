# EtTabStrip · 下划线式 tab 条

纯文字 tab 条（对齐 Excel/WPS）：roving 漫游、Delete 关闭、窄屏溢出「更多」。

```vue
<script setup>
import { ref } from 'vue'
const active = ref('home')
const tabs = [
  { id: 'home', label: '开始' },
  { id: 'insert', label: '插入', closable: true },
  { id: 'review', label: '审阅', disabled: true },
]
</script>

<template>
  <et-tab-strip v-model="active" :tabs="tabs" @change="onChange" @close="onClose" />
</template>
```

## Props

| 名称 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `modelValue` | String | `''` | 激活 tab 的 id |
| `tabs` | Array | 必填 | `{ id, label, closable?, disabled? }` |
| `overflowLabel` | String | `'更多'` | 窄屏溢出入口文案 |

## Emits

| 名称 | 载荷 | 说明 |
| --- | --- | --- |
| `update:modelValue` | id | v-model 回写 |
| `change` | id | 选中变化，与 `update:modelValue` 同场发（两个都绑会双发） |
| `close` | id | 关闭请求（Delete 或关闭钮） |
| `context` | `(id, event)` | 右键 / 上下文 tab 钩子，不拦默认行为 |

## Slots

| 名称 | 作用域 | 说明 |
| --- | --- | --- |
| —— | —— | 无 |

## 行为

- ARIA 只有 `tablist` / `tab` / `aria-selected`；不渲染 tabpanel，激活态由消费方自己渲染。
- 键盘：左右 / Home / End 漫游并把焦点落到对应 DOM；Delete 关闭当前可关闭条目。
- 溢出：ResizeObserver 量容器宽，尾部条目收进「更多」下拉；观察器卸载时断开。
- 同文件导出纯函数 `planOverflow(widths, available, { gap, moreWidth })`，返回 `{ visible, overflow }`（条目下标划分）。
- 关闭钮 `tabindex="-1"` 不进 Tab 序列，`aria-label` 满足 G4。
- 暴露 `measure()`。

## 令牌与门禁

- 度量与 `EtDocumentTabs` 逐项共用（同槽位视觉一致）。
- G5：Delete 判 `isImeComposing`。
- 内存预算：观察器必须 disconnect。
