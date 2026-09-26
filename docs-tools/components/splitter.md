# EtSplitter / EtSplitterPanel · 分隔面板族

底座分隔基元的工具度量适配：拖拽条厚度、热区、把手走 `--et-splitter-*`，其余透传。

```vue
<et-splitter layout="horizontal" @resize="onResize">
  <et-splitter-panel :size="300" :min="220" :max="480">文件树</et-splitter-panel>
  <et-splitter-panel :default-size="'1fr'">编辑器</et-splitter-panel>
</et-splitter>
```

## EtSplitter

| 面 | 名称 | 说明 |
| --- | --- | --- |
| Props | 透传 | `layout`（`horizontal` / `vertical`，默认 `horizontal`）等全部下传 `EbSplitter` |
| Emits | `resize` | 载荷为底座回传的百分比数组 |
| Slots | 透传 | 默认槽放 `EtSplitterPanel` |

## EtSplitterPanel

| 面 | 名称 | 说明 |
| --- | --- | --- |
| Props | 透传 | `size` / `defaultSize` / `min` / `max` / `resizable`（默认 true）/ `collapsible`（默认 false） |
| Emits | —— | 无 |
| Slots | 透传 | 默认槽 = 面板内容 |

## 行为

- 面板注册、尺寸分摊、min/max 夹角、拖拽、折叠与百分比回传全部来自底座；本族只换度量。
- 拖拽条由底座 `EbSplitterPanel` 自渲染；`EtDock` 用族内包装件而不是裸底座，`.et-splitter` 作用域才落得上。
- 键盘调整尺寸未做：拖拽条键盘 resize 属面板树运行时射程，M0/M1 未交付（已知限制，文档与源码一致）。

## 令牌与门禁

- `--et-splitter-*`：拖拽条可视厚度 / 热区 / 把手度量，覆盖写在 `.et-splitter .eb-splitter__bar` 上。
- G7：度量只引用令牌，禁字面量 px。
