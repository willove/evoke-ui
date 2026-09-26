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

## Props

| 名称 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `panels` | Array | `[]` | 同一 dock 的面板节点数组（至少 1 个；顺序即 tab 顺序） |
| `activeId` | String | `''` | 激活面板 id；落空（切走/被隐藏）时落到首个可见面板 |
| `maximizedPanel` | String | `null` | 全屏面板 id（全局唯一，透传给激活面板做视觉放大） |

## Emits

| 名称 | 载荷 | 说明 |
| --- | --- | --- |
| `select` | id | 切 tab |
| `collapse` / `expand` / `close` | id | 面板动作 |
| `maximize` | id | 全屏请求 |
| `restore` | —— | 退出全屏 |

## Slots

| 名称 | 作用域 | 说明 |
| --- | --- | --- |
| 默认 | `{ panel }` | 内容，转发给激活面板的 EtPanel |
| `tools` | `{ panel }` | 工具位，同样转发给激活面板 |

## 行为

- tab 条只列未折叠、未隐藏的面板；单条目时不渲染条（没有可切换对象，空 tab 条只占 chrome 高度）。
- 激活面板折叠时，它的标题栏就是该面板在内容区的全部呈现（展开钮可还原）。
- `expand` 事件必须转发：不转发的话 tab 化 dock 里被折叠的面板永远回不来。
- 键盘漫游（左右 / Home / End）由 `EtTabStrip` 提供；只监听 `change`（与 `update:modelValue` 同场发，双绑会双发）。

## 令牌与门禁

- 复用 `EtTabStrip` 的度量令牌，同槽位与 tab 条视觉一致。
- 与 `EtPanel` 共用同目录样式表（族内子件一份样式，入口构建归入共享 chunk）。
