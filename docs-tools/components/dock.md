# EtDock · 停靠区

dock 节点的呈现件：stack 并列分摊 / tabs 单槽 tab 化，内容归消费方。

```vue
<et-dock
  :dock="dockNode"
  :maximized="maximizedId"
  @update:dock="onDockUpdate"
  @panel-collapse="onCollapse"
  @panel-close="onClose"
  @panel-maximize="onMaximize"
  @panel-restore="onRestore"
  @dock-toggle="onDockToggle"
>
  <template #panel="{ panel, dock }">
    <component :is="viewOf(panel.id)" />
  </template>
</et-dock>
```

## Props

| 名称 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `dock` | Object | 必填 | 停靠区节点 `{ id, side, collapsed, panels, presentation? }` |
| `maximized` | String | `null` | 当前全屏面板 id（全局唯一） |

## Emits

| 名称 | 载荷 | 说明 |
| --- | --- | --- |
| `update:dock` | dock | 尺寸分摊后经 `setPanelSize` 夹角回写的新 dock 节点 |
| `panel-collapse` / `panel-expand` / `panel-close` | id | 面板动作 |
| `panel-maximize` | id | 面板全屏请求 |
| `panel-restore` | —— | 退出全屏 |
| `dock-toggle` | id | 折叠把手点击（整列收/放） |

## Slots

| 名称 | 作用域 | 说明 |
| --- | --- | --- |
| `panel` | `{ panel, dock }` | 面板内容；不传 = 面板只有标题栏（合法空态） |

## 行为

- `stack`（默认）：每个可见面板一个面板位，同屏并列；停靠主轴 = 各位声明宽之和，拖拽在底座 min/max 夹角内重分配，百分比换算回 px 写回树（过夹角、可持久化）。
- `tabs`（`dock.presentation === 'tabs'`）：单槽 + `EtPanelGroup`，任一时刻只有激活面板渲染内容，尺寸度量取激活面板。
- 折叠面板位收成标题条高度（标题栏仍可达、展开钮可还原），且不参与尺寸回写。
- 隐藏面板整条退出渲染但留在树里（产品层用 `visiblePanels` / `showPanel` 拉回来）。
- 全屏时只渲染全屏目标位，兄弟面板让位，停靠位跨满主体行（EtWorkbench 的 grid 让位）。
- 尺寸回写等一拍（120ms）只落稳定值，过渡中间值不进树。

## 令牌与门禁

- `--et-panel-header-height`：折叠把手与折叠位尺寸同源（28px）。
- 拖拽条度量由族内 `EtSplitter` 的样式表负责，见 [分隔面板族](splitter.md)。
- 内存：拖拽/折叠过渡的定时器卸载时清理。
