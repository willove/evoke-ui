# EtToolSpacer · 弹性占位

工具区弹性占位：把后续组推到行尾（对齐 Office 功能区右侧留白的形态）。

```vue
<et-tool-group label="视图">
  <et-tool-button icon="zoom-in" label="放大" />
  <et-tool-spacer />
  <et-tool-button icon="more" label="更多" />
</et-tool-group>
```

## Props

| 名称 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `direction` | String | `'horizontal'` | `horizontal` / `vertical` |

## Emits / Slots

| 面 | 名称 | 说明 |
| --- | --- | --- |
| Emits | —— | 无 |
| Slots | —— | 无 |

## 行为

- 可访问性上无意义，整件对读屏隐藏（`aria-hidden="true"`）。
- 纯布局件：不渲染子内容，只占位。

## 令牌与门禁

- 伸缩行为走布局令牌，件内无 px 字面量。
