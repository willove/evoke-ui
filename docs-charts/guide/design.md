# 设计规范

EvChart 的默认视觉遵循一套克制的规范：结构元素（网格、轴、图例）退到背景，墨水留给数据。理解这套规范，能更容易配置出干净专业的图表。

## 设计原则

1. **数据墨水比优先**——网格与轴退到视觉背景，颜色和粗细留给数据本身；
2. **克制**——一张图只保留一个视觉焦点，默认无数据点、无装饰性阴影；
3. **一致性**——同层级元素字号字色完全一致，系列色成套取用；
4. **可读性优先**——任何装饰不得降低数据与背景的对比度。

## 色彩

### 系列色板

数据系列按以下顺序取色（与状态语义色解耦的专用色板），品牌蓝打头：

| # | 令牌 | 浅色 | 暗色 |
| --- | --- | --- | --- |
| 1 | `--ev-color-series-1`（缺省回读 `--ev-color-primary`） | `#175DFF` | `#4d8bff` |
| 2 | `--ev-color-series-2` | `#5AD8A6` | `#5ad8a6` |
| 3 | `--ev-color-series-3` | `#F6BD16` | `#f6bd16` |
| 4 | `--ev-color-series-4` | `#6DC8EC` | `#6dc8ec` |
| 5 | `--ev-color-series-5` | `#E8684A` | `#f08568` |
| 6 | `--ev-color-series-6` | `#9270CA` | `#a585e8` |
| 7 | `--ev-color-series-7` | `#FF9D4D` | `#ff9d4d` |
| 8 | `--ev-color-series-8` | `#5D7092` | `#8da3bf` |

未定义的槽位逐槽回落上表；相邻取色的色相差 ≥ 30°，多系列同图不撞色。

<DemoBlock>
  <ev-chart
    :options="{
      type: 'bar',
      title: '默认系列色板',
      labels: ['一季度', '二季度', '三季度', '四季度'],
      series: [
        { name: '产品线 A', data: [120, 132, 101, 134] },
        { name: '产品线 B', data: [80, 92, 91, 94] },
        { name: '产品线 C', data: [60, 72, 81, 84] },
      ],
      legend: { show: true },
    }"
    :height="240"
  />
</DemoBlock>

### 配色方案切换

数据色板整体可切换：写一组槽位令牌（浅色 + 暗色各一份，随暗色自动换挡）并广播 `ev-theme-change`，页面上的全部图表即时跟随。以下预设即此机制的现场效果：

<div class="palette-demo__btns">
  <button v-for="(p, key) in PALETTES" :key="key" type="button" class="palette-btn" :class="{ 'is-active': current === key }" @click="applyPalette(key)">{{ p.name }}</button>
</div>

<DemoBlock>
  <ev-chart
    :options="paletteDemo"
    :height="260"
  />
</DemoBlock>

接入方调用内置的 `applySeriesPalette` / `clearSeriesPalette` 即可复现这一效果（本页演示即由它驱动），无需自行处理令牌写入与事件广播。

### 状态语义色边界

`success` / `warning` / `danger` / `info` 是状态语义色，不再默认进入数据色板；只有当数据本身承载该状态含义（如「告警数」）时，才通过 `series[].color` 显式指定。

## 线条与数据点

| 项 | 规范 |
| --- | --- |
| 线宽 | 默认 1.5；监控小图 1.25；单系列主图 2 |
| 数据点 | 默认不绘制（纯线条观感），`showSymbol: true` 打开 |
| 悬浮反馈 | 空心圆环 + 十字准线 + tooltip |
| 平滑 | `smooth: true` 单调三次插值，过点无过冲 |

## 坐标轴与网格

- 只保留横向网格，1px 极淡实线；无纵向网格；
- y 刻度为「标签 + 短横」式，标签右对齐、次要色；
- 隐藏 x 轴（`xAxis.show: false`）时底部轴位自动回收为 12px，小图高度不被挤占；
- 刻度密度 y 向约每 26px 一档，x 向可 `interval` 控制。

## 留白

| 边 | 默认 |
| --- | --- |
| top | 18（标题/顶部图例另加） |
| right | 24 |
| bottom | 46（隐藏 x 轴 → 12；底部图例/dataZoom 另加） |
| left | 按 y 刻度标签宽度自适应（40–140） |

`options.padding` 可覆写任意边；长条监控带推荐 `{ top: 6, right: 8, bottom: 6, left: 34 }`。

## 文字排版

| 元素 | 字号 / 字重 | 颜色 |
| --- | --- | --- |
| 标题 | 13px / 600，左对齐 | 主文字色 |
| 副标题 | 11px / 400 | 次要色 |
| 图例 / 轴标签 | 12px / 400 | 次要色 |
| tooltip 数值 | 13px / 600 | 主文字色 |

## 动效

- 默认补间 1200ms 指数缓出，数值插值而非闪屏重绘；
- **实时流场景必须关闭**：`animation: { enabled: false }`，数据点即划即走；
- 悬浮反馈（准线 / 圆环 / tooltip）即时响应，不带动画。

## 相关

- 令牌契约与暗色约定：[主题接入](/guide/theme)
- 组件库内嵌说明：[内嵌于组件库](/guide/integration)

<script setup>
import { ref } from 'vue'
import { applySeriesPalette, clearSeriesPalette } from '@wil-works/evoke-charts'

const PALETTES = {
  brand: { name: '品牌蓝' },
  teal: {
    name: '青碧',
    light: ['#12A5A0', '#4d8bff', '#67C23A', '#F6BD16', '#9270CA', '#E8684A', '#6DC8EC', '#5D7092'],
    dark: ['#2CC5BF', '#7FA8FF', '#85D577', '#F6BD16', '#A585E8', '#F08568', '#8CD4F5', '#8DA3BF'],
  },
  warm: {
    name: '暖阳',
    light: ['#F0852B', '#E8684A', '#F6BD16', '#D9539B', '#9270CA', '#12A5A0', '#5D7092', '#6DC8EC'],
    dark: ['#F5A355', '#F08568', '#FBD35C', '#E393C0', '#A585E8', '#2CC5BF', '#8DA3BF', '#8CD4F5'],
  },
  mono: {
    name: '石墨',
    light: ['#175DFF', '#6C8CFF', '#98B4FF', '#46557A', '#93A5C8', '#2E4470', '#B9C8E8', '#748199'],
    dark: ['#7FA0FF', '#93B0FF', '#B7CBFF', '#6B7FA8', '#B3C3E2', '#43598C', '#CBD8F2', '#8B9CC4'],
  },
}
const current = ref('brand')
const paletteDemo = {
  type: 'line',
  title: '同一份数据 · 随配色方案换色',
  labels: ['1 月', '2 月', '3 月', '4 月', '5 月', '6 月'],
  series: [
    { name: '系列一', data: [120, 132, 101, 134, 90, 110] },
    { name: '系列二', data: [80, 92, 91, 94, 70, 88] },
    { name: '系列三', data: [60, 72, 81, 84, 66, 78] },
    { name: '系列四', data: [40, 52, 61, 54, 46, 58] },
  ],
  legend: { show: true },
}
function applyPalette(key) {
  current.value = key
  const preset = PALETTES[key]
  if (preset?.light) applySeriesPalette({ light: preset.light, dark: preset.dark })
  else clearSeriesPalette()
}
</script>

<style scoped>
.palette-demo__btns {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 14px 0 16px;
}
.palette-btn {
  padding: 6px 16px;
  border: 1px solid var(--ev-border-color, #e2e8f0);
  border-radius: 999px;
  background: var(--ev-bg-color-overlay, #fff);
  color: var(--ev-text-color-secondary, #646a73);
  font-size: 13px;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
}
.palette-btn:hover {
  border-color: var(--ev-color-primary, #175dff);
}
.palette-btn.is-active {
  border-color: var(--ev-color-primary, #175dff);
  color: var(--ev-color-primary, #175dff);
  font-weight: 600;
}
</style>
