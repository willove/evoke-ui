# 工作台布局

布局即数据：一棵可序列化的树，EtWorkbench 是唯一写树处。

## 布局树

```js
import { createLayoutTree } from '@wil-works/evoke-tools-ui/runtime'

const layout = ref(createLayoutTree({
  docks: [
    { id: 'left', side: 'left', panels: [{ id: 'files', title: '文件', size: 300, min: 220, max: 480 }] },
    { id: 'bottom', side: 'bottom', panels: [{ id: 'log', title: '日志', size: 180 }] },
  ],
  maximized: null,
}))
```

| 字段 | 说明 |
| --- | --- |
| `docks[].id` | kebab-case 或点号式（与命令 id 同命名域），与面板 id 共用一个命名空间，全局唯一 |
| `docks[].side` | `left` / `right` / `bottom` |
| `docks[].collapsed` | 整列收成把手条，点击 emit `dock-toggle` |
| `docks[].presentation` | `stack`（默认，同屏并列）/ `tabs`（单渲染位 tab 化） |
| `panels[].id` / `title` | title 必填，标题栏显示 |
| `panels[].size` | 正数 px 或 `'NN%'`；拖拽后经 min/max 夹角回写 |
| `panels[].min` / `max` | 尺寸夹角，拖拽互不越界 |
| `panels[].collapsed` | 收成标题条，声明宽保留，展开即还原 |
| `panels[].hidden` | 显式状态：整条退出渲染，重置布局可恢复 |
| `panels[].closable` | 缺省 true；false 不渲染关闭钮 |
| `maximized` | 全屏面板 id，同刻只有一个 |

所有变更都是返回新树的纯函数：`togglePanelCollapsed` / `toggleDockCollapsed` / `setPanelSize` / `hidePanel` / `showPanel` / `maximizePanel` / `restorePanel` / `addDock` / `removeDock` / `resetLayout`。未知 id 原样返回，即空操作。

## 持久化与损坏降级

`persistKey` 非空即挂载读回、变更写盘；写前 `layoutEquals` 比对，无变更不写，异常静默。

坏 prop / 坏 JSON / 半坏树一律降级到 `defaultLayout`，不白屏，并 emit `layout-corrupted`：

```js
function onCorrupted(errors) {
  // 框架已降级并自愈：修好的树覆写坏档，提示不重复刷屏
}
```

隐私模式与配额满走同一条静默路径。

## EtWorkbench 区域槽

| 槽 | 位置 | 放什么 |
| --- | --- | --- |
| `titlebar` | 顶带 | EtTitleBar |
| `documents` | 文档标签位 | EtDocumentTabs |
| `toolbar` | 工具区 | EtRibbonBar |
| `panel` | 停靠面板内容 | 作用域 `{ panel, dock }`，按 id 映射 |
| 默认槽 | 中列画布 | 主题桥 / 画布 / 空态 |
| `statusbar` | 底带 | EtStatusBar |

`panel` 槽按 `panel.id` 映射内容组件，框架不引入组件注册表；不传槽 = 面板只有标题栏（合法空态）：

```vue
<et-workbench
  v-model:layout="layout"
  :default-layout="DEFAULT"
  persist-key="my-app"
  @layout-corrupted="onCorrupted"
>
  <template #toolbar><et-ribbon-bar :schema="schema" :registry="registry" /></template>
  <template #panel="{ panel }"><component :is="viewOf(panel.id)" /></template>
  <main>画布</main>
  <template #statusbar><et-status-bar :items="items" /></template>
</et-workbench>
```

命令式入口由产品挂（backstage / 命令里放）：`resetLayout()` / `saveNow()` / `getLayout()`。

## stack 与 tabs 两档

- `stack`（默认）：每个可见面板一个面板位，同屏并列、尺寸分摊；停靠宽 = 各位声明宽之和，画布吃剩余。
- `tabs`：单槽 + `EtPanelGroup`，多面板 tab 化，只渲染激活面板，尺寸度量取激活面板。

两档都进树，刷新不丢。

## 停靠链上的族件

- `EtDock`：停靠区，折叠收把手、隐藏退出渲染、全屏让位重排。
- `EtPanel`：28px 标题栏 + 折叠/最大化/关闭；折叠态内容不渲染。
- `EtPanelGroup`：同 dock 多面板的 tab 化呈现。
- `EtDocumentTabs`：脏标记（圆点 + aria 双通道）、关闭确认、溢出列表。
- `EtScrollArea` / `EtEmptyState`：面板内容滚外壳不滚；空态一句引导 + 一个主钮。

## 相关页

- 组件：[EtWorkbench](/components/workbench) / [EtDock](/components/dock) / [EtPanel](/components/panel) / [EtPanelGroup](/components/panel-group) / [EtDocumentTabs](/components/document-tabs) / [EtScrollArea](/components/scroll-area) / [EtEmptyState](/components/empty-state)
- [命令驱动](commands.md)：工具区数据来自命令表与 schema。
- [设计规范](design.md#工作台契约m2)：布局树契约的令牌侧口径。
