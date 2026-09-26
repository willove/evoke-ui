# EtBanner · 内联横条通知

跟内容同流的内联横条：浅底 + 图标色，warn/error 打断式播报。

```vue
<et-banner type="warn" title="有未保存改动" @close="onClose">
  切换页面前请先保存，或选择「放弃改动」。
</et-banner>
```

## Props

| 名称 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `type` | String | `'info'` | `info` / `warn` / `error`；未知值回落 info |
| `closable` | Boolean | `true` | 渲染关闭钮 |
| `title` | String | `''` | 标题；空 = 只有正文的紧凑形态 |

## Emits

| 名称 | 载荷 | 说明 |
| --- | --- | --- |
| `close` | —— | 关闭钮点击；去留由消费方（v-if）决定 |

## Slots

| 名称 | 作用域 | 说明 |
| --- | --- | --- |
| 默认 | —— | 正文 |
| `action` | —— | 操作位（如「立即保存」） |

## 行为

- 内联件（不 Teleport）：随消费方的容器排版。
- `warn` / `error` 用 `role="alert"`（打断式播报），`info` 用 `role="status"`（礼貌播报）。
- 关闭钮带 `aria-label`（G4）。
- 与 `EtToast` 的分界：横条常驻在内容流里讲一件事，Toast 是瞬时反馈、不占布局。

## 令牌与门禁

- 浅底 + 图标色走语义色令牌，文字仍走中性阶；三种 type 即一屏彩色上限内的三档。
