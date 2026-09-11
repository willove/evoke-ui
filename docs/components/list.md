# List 列表（已废弃）

::: warning 已废弃（Deprecated）
`EbList` 组件已在 **v0.4** 移除，`<eb-list>` 标签不再注册。请迁移到虚拟列表 **VirtualList / Listy**（`<eb-virtual-list>` 或别名 `<eb-listy>`）。

废弃原因与 ant-design v6 一致：通用 List 的「列表 + 加载更多」能力在 B 端场景中几乎总是被表格（DataTable）或虚拟长列表覆盖，维护两套列表得不偿失。List 的独有价值是**万级数据下的列表渲染**，这正是 VirtualList 的定位。
:::

## 迁移指南

List 是「带骨架/空态的包裹组件」，VirtualList 是「只管窗口渲染的基元」。迁移时骨架屏用 `EbSkeleton`、空态用 `EbEmpty` 自行组合，职责更清晰：

```html
<!-- 旧：EbList（已移除） -->
<eb-list
  title="消息中心"
  :items="items"
  item-key="id"
  :item-size="52"
  :height="280"
  @load-more="loadMore"
>
  <template #default="{ item }">
    <div class="row">{{ item.title }}</div>
  </template>
</eb-list>
```

```html
<!-- 新：VirtualList / Listy -->
<eb-listy :items="items" item-key="id" :item-size="52" :height="280" @scroll-bottom="loadMore">
  <template #default="{ item }">
    <div class="row">{{ item.title }}</div>
  </template>
</eb-listy>
```

### 属性对照

| EbList（旧） | VirtualList / Listy（新） | 说明 |
| --- | --- | --- |
| `items` | `items` | 一致 |
| `item-key` | `item-key` | 一致 |
| `item-size` | `item-size` | 一致；新组件不传时进入动态实测行高模式 |
| `height` | `height` | 一致 |
| `virtual` | —（移除） | 新组件只做虚拟渲染，小数据量直接 `v-for` 即可 |
| `title` | —（移除） | 用 `EbCard` / 标题标签自行包裹 |
| `empty-text` | —（移除） | `items.length === 0` 时用 `EbEmpty` 自行渲染 |
| `loading` | —（移除） | 用 `EbSkeleton` 或 `EbSpin` 组合 |
| `@load-more` | `@scroll-bottom` | 语义更名，触发行为一致（滚动触底） |
| `@scroll` | `@scroll` | 一致 |

## 完整迁移示例

骨架 + 空态 + 触底加载，全部显式组合：

```vue
<template>
  <div class="msg-panel">
    <h4>消息中心</h4>
    <eb-skeleton v-if="loading" :rows="5" animated></eb-skeleton>
    <eb-empty v-else-if="!items.length" description="暂无消息"></eb-empty>
    <eb-listy
      v-else
      :items="items"
      item-key="id"
      :item-size="52"
      :height="320"
      @scroll-bottom="loadMore"
    >
      <template #default="{ item }">
        <div style="height: 52px; display: flex; align-items: center;">{{ item.title }}</div>
      </template>
    </eb-listy>
  </div>
</template>
```

详见 [VirtualList 虚拟滚动](/components/virtual-list)。
