# Evoke Charts

> **⚠️ 本包正在开发迭代中，尚未发布正式版：API、图表类型与视觉细节可能随版本调整，请勿用于生产环境。**

`@wil-works/evoke-charts` — 零依赖 Canvas 自绘图表库（Vue 3）：**29 种二维图型 + 三维篇章**。Evoke 生态的独立图表包，不依赖任何第三方图表引擎，也不依赖 Evoke 其他组件库。

**在线文档**：[evoke-charts.wil-works.com](https://evoke-charts.wil-works.com) — 全部图表类型、完整配置项与在线示例。

## 特性

- **29 种图表类型**：折线 / 面积 / 柱状 / 堆叠柱 / 条形 / 饼图 / 环形 / 玫瑰图 / 散点（趋势线 / 四象限 / 分面 / 矩阵）/ 雷达 / 漏斗 / 仪表盘 / 热力图 / 日历热力 / K 线（量副图 / MA 均线）/ 子弹图 / 直方图 / 矩形树图 / 旭日图 / 瀑布图 / 箱线图 / 混合双轴 / 迷你图 / 桑基图 / 韦恩图 / 弦图 / 弧长连接图（线性 / 环形）/ 甘特图
- **三维篇章**：柱林 / 空间折线 / 散点云 / 曲面高度场 / 三维饼环——透视投影自绘，无需 WebGL，详见下文[三维篇章](#三维篇章charts-3d)
- **零运行时依赖**：仅 peer 依赖 Vue 3，全部绘制自研 Canvas 2D
- **主题跟随**：从 `--ev-*` CSS 令牌实时读取颜色，宿主换主题 / 暗色即跟随；无令牌时使用内置色板兜底
- **内置色系**：`palette` 一键固定成套配色（7 套现代色系，明暗双主题各 8 槽），生效后不随宿主换肤
- **交互完备**：tooltip、图例点选 / 悬停高亮、十字准线、dataZoom（滑块 / 滚轮 / 触摸平移）、框选刷选、工具箱（导出 PNG / 还原）、多图 connect 联动
- **叙述与编排**：`annotations[]` 图内旁白（峰值标注 / 区间强调 / 涨跌结论）、`emphasis` 焦点弱化、`scenes` 分幕 reveal / 自动播报
- **AI 生成**：`generateChartSpec` 数据直生（CSV / 表格 → Spec，列推断与选型全自动）、`buildChartPrompt` 提示词契约（喂给任意大模型）、`lintChartSpec` 渲染自检；Spec 即 `options`，`getSpec / setSpec` 往返
- **导出**：`toDataURL`（PNG）、`exportSVG`（真矢量，渲染指令录制重放）
- **无障碍**：`role="img"` + aria-label、hover 信息 aria-live 播报、容器可聚焦后方向键巡历类目（准线 / tooltip / 播报与指针同通道）

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

图表颜色按以下 `--ev-*` 令牌实时读取（`document.documentElement` 上取值），未定义的槽位逐槽回落到内置成套色板：

- 系列色：`--ev-color-series-1` … `--ev-color-series-8`（数据系列专用色板，与状态语义色解耦；槽 1 未定义时回读 `--ev-color-primary`，主题跟随不受影响）
- 表面：`--ev-bg-color`、`--ev-bg-color-overlay`
- 文字：`--ev-text-color-primary / -secondary / -danger`
- 边线：`--ev-border-color / -light / -dark`
- 填充：`--ev-fill-color-light / -dark`
- 主色 RGB 三元组（用于高亮/准线）：`--ev-color-primary-rgb`

暗色跟随约定：在 `html.dark` 选择器下重映射上述令牌（组件内部监听 `<html>` 的 `class` 变化自动重绘）。

图表引擎对宿主保持中立：不为任何组件库做特殊配置；组件库或站点需要个性化时，走通用扩展接口——槽位令牌、`padding` / `theme` / `animation` 配置，以及 `applySeriesPalette` 配色方案工具。

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

`ready` / `click` / `legend-click` / `hover` / `unhover` / `scene-change` / `animation-end` / `data-update` / `brush-select` / `zoom`

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

## 三维篇章（Charts 3D）

三维能力以**独立子入口**提供，只用二维的消费方不背三维包体：

```js
import { EvChart3d, useChart3d } from '@wil-works/evoke-charts/3d'
import '@wil-works/evoke-charts/styles'
```

```vue
<template>
  <EvChart3d :options="options" :height="360" />
</template>

<script setup>
const options = {
  type: 'bar3d',
  labels: ['一月', '二月', '三月', '四月'],
  series: [
    { name: '华东', data: [120, 200, 150, 80] },
    { name: '华南', data: [90, 60, 130, 170] },
  ],
}
</script>
```

- **五种三维图型**：`bar3d` 柱林 / `line3d` 空间折线 / `scatter3d` 散点云 / `surface3d` 曲面高度场 / `pie3d` 三维饼环
- **轨道相机**：拖拽环绕、滚轮与捏合缩放、Shift 平移、双击复位、方向键、自动旋转；悬浮拾取复用渲染投影，所见即所选
- **与二维同一套配置**：系列色槽位、内置色系、`--ev-*` 令牌、暗色与换肤事件完全同源，`applySeriesPalette` 一次换装二维三维一起变
- **导出**：`exportSVG` 真矢量（三维图可导出可缩放 SVG）、`toDataURL` 位图

渲染为自研透视投影管线（画家算法深度排序 + 面法线光照），不依赖 WebGL 与任何三方渲染库。

## License

MIT
