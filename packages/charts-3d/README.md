# Charts 3D

零依赖 Canvas 三维图表库（Vue 3）。自研透视投影管线 —— 向量/矩阵数学 → 轨道相机 → 场景图元 → 画家算法深度排序 → Canvas 2D 呈现，**不依赖 WebGL 与任何三方渲染库**。

与 [Evoke Charts](https://www.npmjs.com/package/@wil-works/evoke-charts) 同源同族：共用 `--ev-*` 设计令牌、`ev-theme-change` 换肤事件、`html.dark` 暗色约定与同名内置色系（同 id 同色值），二维图与三维图并排时观感一致。

## 特性

- **五种三维图型**：`bar3d` 柱林 / `line3d` 空间折线（含落地投影与面带）/ `scatter3d` 散点（三元组与类目双模式、色带编码第四维）/ `surface3d` 曲面高度场 / `pie3d` 三维饼与环形
- **真透视**：可旋转、缩放、平移的轨道相机，光照随视角自适应，形体感来自法线着色而非描边
- **完整交互**：拖拽环绕、滚轮/捏合缩放、Shift 平移、双击复位、方向键环绕、悬浮拾取（复用同一套投影，所见即所选）、图例点选显隐
- **观感一致**：背面剔除 + 兰伯特明度着色；坐标框墙面与轴线取边跟随相机，标签屏幕空间防碰撞
- **工程友好**：空/载/错/成四态、DPR 适配、容器响应式、`exportSVG` 矢量导出、`toDataURL` 位图导出、aria 标注与 aria-live 播报

## 安装

```bash
npm install @wil-works/charts-3d
```

## 快速上手

```js
import { createApp } from 'vue'
import Charts3d from '@wil-works/charts-3d'
import '@wil-works/charts-3d/styles'

createApp(App).use(Charts3d).mount('#app')
```

```vue
<template>
  <EvChart3d :options="options" :height="400" />
</template>

<script setup>
const options = {
  type: 'bar3d',
  title: { text: '季度出货量' },
  labels: ['1月', '2月', '3月', '4月'],
  series: [
    { name: '华东', data: [420, 380, 500, 460] },
    { name: '华南', data: [300, 340, 320, 410] },
  ],
  zAxis: { name: '出货量（件）' },
}
</script>
```

曲面与散点的高级形态：

```js
// 曲面：矩阵 + 连续色带 + 线框
{
  type: 'surface3d',
  surfaceData: { x: [-3, -2, -1, 0, 1, 2, 3], y: [-3, -2, -1, 0, 1, 2, 3], z: matrix },
  surface: { wireframe: true, ramp: 'classic' },
}

// 散点：三元组 + 色带编码 Z 值
{
  type: 'scatter3d',
  scatterData: [[1, 2, 3], [2, 3, 6], [3, 1, 4.5]],
  scatter: { size: 5, colorScale: 'heat' },
}
```

## 主题接入

- 默认读取 `--ev-color-series-1..8` 与 `--ev-color-primary` 等令牌，宿主换主色自动跟随
- 暗色以 `html.dark` 为准；广播 `ev-theme-change` 事件即可触发重绘
- `options.palette: 'aurora'` 一键固定内置色系（`classic / aurora / sunset / morandi / forest / ink / candy`），生效后不再读令牌
- `applySeriesPalette(palette)` / `clearSeriesPalette()` 把色系写入文档根，二维与三维图一起换装

## 组件 API（摘要）

### Props

| 名称 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| options | Object | 必填 | 图表配置，`type` 为 `bar3d / line3d / scatter3d / surface3d / pie3d` 之一 |
| width | String \| Number | 100% | 容器宽 |
| height | String \| Number | 400 | 容器高 |
| responsive | Boolean | true | ResizeObserver 跟随容器尺寸 |
| devicePixelRatio | Number | 取环境 | 显式指定渲染倍率 |

### 事件

`ready` `click` `hover` `unhover` `legend-click` `animation-end` `data-update` `camera-change`（载荷 `{ yaw, pitch, distance, target }`）

### 实例方法（ref）

`refresh` `update` `toDataURL` `destroy` `getCanvas` `resize` `getCamera` `setCamera` `resetCamera` `toggleSeries` `getHiddenSeries` `getProjected` `exportSVG`

### options 相机与交互

```js
{
  camera: {
    yaw: -52, pitch: 27, distance: 3.6, fov: 42, target: [0, 0, 0.31],
    autoRotate: false, autoRotateSpeed: 10,
    minPitch: 2, maxPitch: 88, minDistance: 1.4, maxDistance: 10,
  },
  lighting: { ambient: 0.56, intensity: 0.88, follow: true }, // 或固定方向 direction: [x,y,z]
  interaction: { zoom: true, pan: true, resetOnDblClick: true },
  grid: { show: true },
  box: { show: true, walls: 'back' },   // 'all' | 'back' | 'side' | 'none'
}
```

### Composable

```js
const { chartRef, setCamera, resetCamera, orbit, zoom, toggleSeries, exportSVG } = useChart3d()
```

底层管线亦可直接使用：`render3d(canvas, params)` 无头渲染、`projectScene` / `pickScene` 投影与拾取、`createSvgRecorder` SVG 录制、`validateOptions3d` 配置校验、`resolveCamera` 相机解析。

## License

MIT
