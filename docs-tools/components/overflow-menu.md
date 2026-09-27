# EtOverflowMenu · 溢出菜单

**内部件**：功能区放不下的条目按**组**收进这里，保留组标题与组结构。
它由 `EtRibbonBar` 自己用，产品一般不直接引——但它有独立子路径，便于测试与定制形态。

```vue
<et-overflow-menu
  :groups="overflowGroups"
  :registry="registry"
  :ctx="ctx"
  label="更多"
  @command="onCommand"
/>
```

## API

<CompApi id="overflow-menu" />

## 契约要点

- **计数角标**：收起的条目数挂在入口上——藏 = 不占视野，不是不可达；
- **状态一致**：菜单项的名称 / 图标 / 快捷键 / 禁用态全部读 `registry`，与展开态同源；
- **浮层基座**是 `EbDropdown`（`#trigger` + `#dropdown`），z 走 `--et-z-popover` 阶梯。
