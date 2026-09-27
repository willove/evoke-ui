# EtPanelGroup · 同 dock 多面板呈现

同一停靠区内多面板的 tab 化呈现：标题行是 tab 条，内容区只渲染激活面板。

```vue
<et-panel-group
  :panels="panels"
  :active-id="activeId"
  :maximized-panel="maximizedId"
  @select="onSelect"
  @collapse="onCollapse"
  @expand="onExpand"
  @close="onClose"
  @maximize="onMaximize"
  @restore="onRestore"
>
  <template #default="{ panel }"><component :is="viewOf(panel.id)" /></template>
  <template #tools="{ panel }"><span>{{ panel.id }}</span></template>
</et-panel-group>
```

## API

<CompApi id="panel-group" />

## 行为

- tab 条只列未折叠、未隐藏的面板；单条目时不渲染条（没有可切换对象，空 tab 条只占 chrome 高度）。
- 激活面板折叠时，它的标题栏就是该面板在内容区的全部呈现（展开钮可还原）。
- `expand` 事件必须转发：不转发的话 tab 化 dock 里被折叠的面板永远回不来。
- 键盘漫游（左右 / Home / End）由 `EtTabStrip` 提供；只监听 `change`（与 `update:modelValue` 同场发，双绑会双发）。

## 令牌与门禁

- 复用 `EtTabStrip` 的度量令牌，同槽位与 tab 条视觉一致。
- 与 `EtPanel` 共用同目录样式表（族内子件一份样式，入口构建归入共享 chunk）。
