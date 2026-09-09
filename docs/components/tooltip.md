# Tooltip 文字提示

悬停 / 聚焦目标后出现的轻量文字提示，基于 EvPopper 浮层基座：12 个方位自适应、空间不足自动翻转、箭头自动锚定。

## 基础用法

<DemoBlock>
  <ev-space size="middle" style="flex-wrap: wrap">
    <ev-tooltip content="顶部提示" placement="top">
      <ev-button>top</ev-button>
    </ev-tooltip>
    <ev-tooltip content="右侧提示" placement="right">
      <ev-button>right</ev-button>
    </ev-tooltip>
    <ev-tooltip content="底部提示" placement="bottom">
      <ev-button>bottom</ev-button>
    </ev-tooltip>
    <ev-tooltip content="左侧提示" placement="left">
      <ev-button>left</ev-button>
    </ev-tooltip>
  </ev-space>
</DemoBlock>

## 全部方位（12 个）

<DemoBlock>
  <ev-space size="small" style="flex-wrap: wrap">
    <ev-tooltip v-for="p in placements" :key="p" :content="`placement: ${p}`" :placement="p">
      <ev-button size="small">{{ p }}</ev-button>
    </ev-tooltip>
  </ev-space>
</DemoBlock>

## 主题与禁用

<DemoBlock>
  <ev-space size="middle">
    <ev-tooltip content="深色主题（默认）">
      <ev-button>dark</ev-button>
    </ev-tooltip>
    <ev-tooltip content="浅色主题" effect="light">
      <ev-button>light</ev-button>
    </ev-tooltip>
    <ev-tooltip content="不会出现" disabled>
      <ev-button>disabled</ev-button>
    </ev-tooltip>
  </ev-space>
</DemoBlock>

<script setup>
const placements = ['top-start', 'top', 'top-end', 'left-start', 'left', 'left-end', 'right-start', 'right', 'right-end', 'bottom-start', 'bottom', 'bottom-end']
</script>

## Tooltip API

| 名称 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| content | String | — | 提示内容（默认插槽优先） |
| placement | String | `top` | 12 个方位 |
| effect | String | `dark` | dark / light |
| disabled | Boolean | `false` | 禁用 |

Tooltip 始终带箭头；无需箭头的轻提示可改用悬停触发的 Popover（`show-arrow` 可关）。

插槽：`content` 自定义内容；触发元素放入默认插槽。
