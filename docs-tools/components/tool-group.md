# EtToolGroup · 工具区分组

控件行 + 组标题行的功能区组容器；组间分隔用 EtDivider，不在组内。

```vue
<et-tool-group label="剪贴板">
  <et-tool-button icon="copy" label="复制" />
  <et-divider direction="vertical" />
  <et-tool-button icon="brush" label="格式刷" />
</et-tool-group>
```

## Props

| 名称 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `label` | String | `''` | 组标题行文本；为空不渲染标题行，组不占标题带高度 |

## Slots

| 名称 | 作用域 | 说明 |
| --- | --- | --- |
| 默认 | —— | 控件行内容（ToolButton / Dropdown / Select / Divider / ToolSpacer 混排） |

## 行为

- `role="group"`，`aria-label` 取 `label`。
- 控件行 `flex-wrap: nowrap`：宽度不足由 L2 走溢出折叠，禁换行撑高。

## 令牌与门禁

- `--et-chrome-group-label-height`：标题行固定高度，同排所有组的标题行同一 y。
- 视觉断言「组标题行同一 y」的前提是同排组都有 label（label 为空不渲染标题行，计划契约如此）。
