# EtDocumentTabs · 多文档标签条

多文档标签：脏标记双通道、关闭确认、溢出列表，契约与 EtTabStrip 同源。

```vue
<script setup>
import { ref } from 'vue'
const active = ref('sheet-1')
const documents = [
  { id: 'sheet-1', title: '一季度', dirty: true },
  { id: 'sheet-2', title: '二季度' },
  { id: 'notes', title: '备注', closable: false },
]
</script>

<template>
  <et-document-tabs
    v-model="active"
    :documents="documents"
    confirm-close
    confirm-text="有未保存改动，确定关闭？"
    @change="onChange"
    @close="onClose"
  />
</template>
```

## Props

| 名称 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `modelValue` | String | `''` | 激活文档的 id |
| `documents` | Array | `[]` | `{ id, title, dirty?, closable? }`（closable 缺省视为可关闭） |
| `overflowLabel` | String | `'更多'` | 窄屏溢出入口文案 |
| `confirmClose` | Boolean | `false` | 关闭前弹确认（仅在同时给了 `confirmText` 时生效） |
| `confirmText` | String | `''` | 关闭确认文案（`EbPopconfirm` 的 title） |

## Emits

| 名称 | 载荷 | 说明 |
| --- | --- | --- |
| `update:modelValue` | id | v-model 回写 |
| `change` | id | 选中变化 |
| `close` | id | 关闭请求（确认过后） |
| `context` | `(id, event)` | 右键钩子，不拦默认行为 |

## Slots

| 名称 | 作用域 | 说明 |
| --- | --- | --- |
| —— | —— | 无 |

## 行为

- 脏标记双通道：CSS 圆点（不吃行高）+ `role="img"` `aria-label="未保存"`；读屏名补「未保存」。
- 关闭默认不弹确认（关闭是产品语义，组件不预判）；`confirmClose` + `confirmText` 双条件才用 `EbPopconfirm` 包一层。
- 溢出：复用 tab-strip 的 `planOverflow` 纯函数；全部条目常驻 DOM（溢出的只收起、不卸载）。
- 键盘：左右 / Home / End 漫游；关闭钮 `tabindex="-1"`，Delete 关闭由条级 keydown 处理。
- 点条目内的关闭钮 / 脏圆点不触发选中。
- 度量令牌与 `EtTabStrip` 逐项共用（同槽位视觉一致）。

## 令牌与门禁

- `--et-icon-xs`（关闭钮 14 档）。
- G4：关闭钮与脏标记都有可访问名。
- 内存：ResizeObserver 卸载时 disconnect。
