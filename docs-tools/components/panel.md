# EtPanel · 停靠面板

侧/底停靠面板：标题栏（标题 + 工具位 + 动作组）+ 内容区，状态只由 props 来。

```vue
<et-panel
  :panel="panelNode"
  :maximized="maximizedId === panelNode.id"
  :body-scroll="true"
  @collapse="onCollapse"
  @expand="onExpand"
  @close="onClose"
  @maximize="onMaximize"
  @restore="onRestore"
>
  <template #tools>
    <et-tool-button size="small" icon="more" label="更多" />
  </template>
  面板内容
</et-panel>
```

## Props

| 名称 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `panel` | Object | `null` | 布局节点 `{ id, title, size, min, max, collapsed, hidden, closable }` |
| `maximized` | Boolean | `false` | 全屏态（同刻全局只有一个面板为真） |
| `bodyScroll` | Boolean | `true` | 内容区滚动；关掉后自溢出由消费方自己管 |

## Emits

| 名称 | 载荷 | 说明 |
| --- | --- | --- |
| `collapse` | id | 折叠请求 |
| `expand` | id | 展开请求 |
| `close` | id | 关闭请求（关闭 = 隐藏，显式状态） |
| `maximize` | id | 全屏请求 |
| `restore` | —— | 退出全屏 |

## Slots

| 名称 | 作用域 | 说明 |
| --- | --- | --- |
| 默认 | `{ panel }` | 内容区；折叠态整体不渲染 |
| `tools` | —— | 标题栏右侧工具位，无槽不占位 |

## 行为

- 标题栏 = 标题 + tools 工具位 + 动作组（折叠 / 最大化|还原 / 关闭）。
- 本件不存 `collapsed` / `maximized`：单一事实源是布局树，写树入口在 EtWorkbench。
- 折叠态内容用 `v-if` 不渲染（省 DOM，折叠后面板不占事件天然成立）。
- 全屏只做视觉放大 + 层级抬升，不用 fixed 定位（那会提出工作台流、盖住 chrome）。
- `closable !== false` 才渲染关闭钮；三个动作钮都带 `aria-label`（G4）。

## 令牌与门禁

- `--et-panel-header-height`（28px，不随密度档变化）、`--et-icon-sm`（标题栏图标 16 档）。
- G7：标题栏高度钉死，内容溢出走内部滚动。
