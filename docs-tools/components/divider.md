# EtDivider · 工具区分隔线

工具界面组间分隔：1px 描边、长度随控件档位，与 `EbDivider` 分工不同。

```vue
<et-tool-group label="剪贴板">
  <et-tool-button icon="copy" label="复制" />
  <et-divider direction="vertical" length="large" />
  <et-tool-button icon="brush" label="格式刷" />
</et-tool-group>
```

## Props

| 名称 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `direction` | String | `'vertical'` | `horizontal` / `vertical` |
| `length` | String | `'large'` | `large` = 大钮高 / `small` = 小钮高 / `row` = 列表行高 |

## Emits / Slots

| 面 | 名称 | 说明 |
| --- | --- | --- |
| Emits | —— | 无 |
| Slots | —— | 无 |

## 行为

- `role="separator"`，`aria-orientation` 随方向。
- 与 `EbDivider` 的分界：底座做页面内容区分隔（可带文字、四向 border-style），本件只做工具界面组间分隔，不带文字。

## 令牌与门禁

- 长度档随密度令牌变化，禁写字面量长度。
- 横向 chrome 带的分隔线不要用 `border`：会吃掉 1px 内容盒，组标题行的 y 会漂（用 `box-shadow: inset` 画分隔）。
