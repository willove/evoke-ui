# Popover 气泡卡片

点击 / 悬停触发的富内容浮层，比 Tooltip 更适合承载标题、表单、操作列表等结构化内容；12 个方位自适应翻转，箭头自动锚定。

## 基础用法

<DemoBlock>
  <ev-space size="middle">
    <ev-popover title="操作确认" content="将把选中记录移入回收站，可在 30 天内恢复。" width="280">
      <ev-button>点击展示</ev-button>
    </ev-popover>
    <ev-popover content="悬停触发的气泡" trigger="hover" placement="top">
      <ev-button>悬停展示</ev-button>
    </ev-popover>
    <ev-popover content="聚焦时出现" trigger="focus" placement="right">
      <ev-button>聚焦展示</ev-button>
    </ev-popover>
  </ev-space>
</DemoBlock>

## 自定义内容

<DemoBlock>
  <ev-popover width="260" placement="bottom">
    <template #reference>
      <ev-button type="primary">自定义内容</ev-button>
    </template>
    <div style="display: flex; flex-direction: column; gap: 8px;">
      <ev-text strong>快捷操作</ev-text>
      <ev-button size="small" style="justify-content: flex-start;">导出 Excel</ev-button>
      <ev-button size="small" style="justify-content: flex-start;">导出 PDF</ev-button>
    </div>
  </ev-popover>
</DemoBlock>

## 方位（placement）

12 个方位自动适应空间，空间不足时自动翻转：

<DemoBlock>
  <ev-space size="middle" style="flex-wrap: wrap">
    <ev-popover v-for="p in placements" :key="p" :content="`placement: ${p}`" :placement="p" trigger="hover">
      <ev-button size="small">{{ p }}</ev-button>
    </ev-popover>
  </ev-space>
</DemoBlock>

<script setup>
const placements = ['top','top-start','top-end','bottom','bottom-start','bottom-end','left','left-start','left-end','right','right-start','right-end']
</script>

## Popover API

| 名称 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| title | String | — | 标题 |
| content | String | — | 内容（默认插槽优先） |
| placement | String | `bottom` | 12 个方位 |
| width | String / Number | — | 浮层宽度 |
| trigger | String | `click` | click / hover / focus / manual |
| show-arrow | Boolean | `true` | 显示箭头 |

事件：`show`、`hide`；插槽：`reference` 触发元素、`default` 自定义内容。
