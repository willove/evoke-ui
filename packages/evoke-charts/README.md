# Evoke Charts

`@wil-works/evoke-charts` — 零依赖 Canvas 自绘图表库（Vue 3）。Evoke 生态的独立图表包，不依赖任何第三方图表引擎，也不依赖 Evoke 其他组件库。

**在线文档**：[evoke-charts.wil-works.com](https://evoke-charts.wil-works.com) — 全部图表类型、完整配置项与在线示例。

## 特性

- **20+ 图表类型**：折线 / 面积 / 柱状 / 堆叠柱 / 条形 / 饼图 / 环形 / 玫瑰图 / 散点（含趋势线）/ 雷达 / 漏斗 / 仪表盘 / 热力图 / K 线 / 子弹图 / 直方图 / 矩形树图 / 旭日图 / 瀑布图 / 箱线图 / 混合图 / 迷你图
- **零运行时依赖**：仅 peer 依赖 Vue 3，全部绘制自研 Canvas 2D
- **主题跟随**：从 `--ev-*` CSS 令牌实时读取颜色，宿主换主题 / 暗色即跟随；无令牌时使用内置色板兜底
- **交互完备**：tooltip、图例点选 / 悬停高亮、十字准线、dataZoom（滑块 / 滚轮 / 触摸平移）、框选刷选、工具箱（导出 PNG / 还原）、多图 connect 联动
- **导出**：`toDataURL`（PNG）、`exportSVG`（真矢量，渲染指令录制重放）
- **无障碍**：`role="img"` + aria-label、hover 信息 aria-live 播报

## 安装

```bash
pnpm add @wil-works/evoke-charts
```

```js
import { createApp } from 'vue'
import EvokeCharts from '@wil-works/evoke-charts'
import '@wil-works/evoke-charts/styles'

const app = createApp(App)
app.use(EvokeCharts) // 全局注册 <EvChart />
```

或按需引入：

```js
import { EvChart, useChart } from '@wil-works/evoke-charts'
import '@wil-works/evoke-charts/styles'
```

## 快速上手

```vue
<template>
  <EvChart :options="options" :height="320" />
</template>

<script setup>
import { EvChart } from '@wil-works/evoke-charts'

const options = {
  type: 'line',
  labels: ['一月', '二月', '三月', '四月'],
  series: [
    { name: '营收', data: [120, 200, 150, 80] },
    { name: '成本', data: [60, 90, 70, 40] },
  ],
}
</script>
```

## 主题接入

图表颜色按以下 `--ev-*` 令牌实时读取（`document.documentElement` 上取值），任一缺失即整组回落到内置色板：

- 系列色：`--ev-color-primary / -success / -warning / -danger / -info`、`--ev-color-ext-violet / -cyan / -magenta`
- 表面：`--ev-bg-color`、`--ev-bg-color-overlay`、`--ev-app-card-border`
- 文字：`--ev-text-color-primary / -secondary / -danger`
- 边线：`--ev-border-color / -light / -dark`
- 填充：`--ev-fill-color-light / -dark`
- 主色 RGB 三元组（用于高亮/准线）：`--ev-color-primary-rgb`

暗色跟随约定：在 `html.dark` 选择器下重映射上述令牌（组件内部监听 `<html>` 的 `class` 变化自动重绘）。

### 与 evoke-business-ui 搭配

`evoke-business-ui` 依赖本包并以 `EbChart`（模板 `<eb-chart>`）提供同一组件，其样式包内置了 `--eb-*` 令牌到 `--ev-*`（本包读取面）的映射，两库同用时图表自动跟随其主题、暗色与运行时换肤（其换肤时会派发 `ev-theme-change` 事件），无需额外配置。

## 组件 API（摘要）

以下为常用项摘要，各图表类型的独立文档页与完整配置项见[在线文档](https://evoke-charts.wil-works.com/chart)。

### Props

| 名称 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| options | Object | 必填 | 图表配置：`type`、`labels`、`series`、`legend`、`tooltip`、`title`、`dataZoom`、`theme` 等 |
| width | String / Number | `'100%'` | 容器宽 |
| height | String / Number | `400` | 容器高（数字按 px） |
| responsive | Boolean | `true` | 容器尺寸变化时自动重绘 |
| devicePixelRatio | Number | 自动 | 画布 DPR |

### 事件

`ready` / `click` / `legend-click` / `hover` / `unhover` / `animation-end` / `data-update` / `brush-select` / `zoom`

### 实例方法（ref）

`refresh` / `update` / `resize` / `toDataURL` / `exportSVG` / `toggleSeries` / `highlightSeries` / `clearHighlight` / `getDataExtent` / `getPlotArea` / `setTheme` / `getOption` / `setDataZoomRange` / `getDataZoomRange` / `getCanvas` / `destroy`

### Composable

```js
import { useChart } from '@wil-works/evoke-charts'

const { options, chartProps, chartRef, resize, exportPNG, setTheme } = useChart({ options })
```

```vue
<EvChart v-bind="chartProps" ref="chartRef" />
```

## License

MIT
