# VirtualList 虚拟滚动

万级数据只渲染可视窗口的列表基元，同时支撑 Listy（原 List 组件的替代）与 Select 虚拟化。

两种模式：传 `item-size` 走固定行高（纯数学定位）；不传则动态实测行高（渲染后回填偏移表，滚动中收敛）。

> 对标 ant-design v6：通用 List 已废弃，由虚拟列表替代。本组件注册了别名 **`EvListy`**（标签 `<ev-listy>`），从旧 List 迁移见 [List（已废弃）](/components/list)。

## 基础用法

<DemoBlock>
  <ev-virtual-list :items="items" item-key="id" :item-size="40" :height="240">
    <template #default="{ item, index }">
      <div style="height: 40px; display: flex; align-items: center; padding: 0 16px; border-bottom: 1px solid var(--ev-border-color-lighter);">
        <span style="color: var(--ev-text-color-secondary); width: 56px;">#{{ index }}</span>
        <span>{{ item.name }}</span>
      </div>
    </template>
  </ev-virtual-list>
</DemoBlock>

<script setup>
const items = Array.from({ length: 10000 }, (_, i) => ({ id: i, name: `数据行 ${i + 1}` }))
</script>

## Listy 别名

`<ev-listy>` 与 `<ev-virtual-list>` 完全等价（同一组件的两个注册名），方便从旧 List 或 ant-design Listy 迁移：

<DemoBlock>
  <ev-listy :items="items" item-key="id" :item-size="40" :height="160">
    <template #default="{ item, index }">
      <div style="height: 40px; display: flex; align-items: center; padding: 0 16px; border-bottom: 1px solid var(--ev-border-color-lighter);">
        <span style="color: var(--ev-text-color-secondary); width: 56px;">#{{ index }}</span>
        <span>{{ item.name }}</span>
      </div>
    </template>
  </ev-listy>
</DemoBlock>

## VirtualList API

### Props

| 名称 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| items | Array | `[]` | 数据源 |
| item-key | String / Function | — | 唯一键字段名或 `(item) => key` |
| item-size | Number | — | 固定行高（px）；不传走动态实测 |
| height | Number / String | `280` | 容器高度 |
| buffer | Number | `5` | 视口外上下各多渲染条数 |
| estimated-size | Number | `40` | 动态模式行高估算值 |
| bottom-threshold | Number | `20` | 距底部多少 px 触发 scroll-bottom |

### 事件

| 名称 | 说明 |
| --- | --- |
| scroll | 滚动，参数 scrollTop |
| scroll-bottom | 滚近底部触发（无限加载） |
| range-change | 可视窗口变化，参数 `{ start, end }` |

### 暴露方法

`scrollTo(index, align)`（align: start / center）、`scrollToTop()`、`getVisibleRange()`
