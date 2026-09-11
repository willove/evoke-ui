# 安装与引入

`@wil-works/evoke-charts` 仅 peer 依赖 Vue 3，没有其他运行时依赖；包本体为 ESM 格式。

## 安装

```bash
npm install @wil-works/evoke-charts
# 或
pnpm add @wil-works/evoke-charts
```

## 全局注册

全局注册后可在任意模板里直接使用 `<ev-chart>`：

```js
import { createApp } from 'vue'
import EvokeCharts from '@wil-works/evoke-charts'
import '@wil-works/evoke-charts/styles'

const app = createApp(App)
app.use(EvokeCharts) // 全局注册 <EvChart />
```

`@wil-works/evoke-charts/styles` 是图表的样式文件（tooltip、图例、占位等界面元素的样式），引入一次即可，全局注册与按需引入都需要它。

## 按需引入

不打全局注册、只要用到的场景（组合式 API 项目、微前端子应用等）：

```js
import { EvChart, useChart } from '@wil-works/evoke-charts'
import '@wil-works/evoke-charts/styles'
```

`useChart` 组合式函数收敛了 options 响应式、ref 透传、resize 与导出等常用接线：

```js
const { options, chartProps, chartRef, resize, exportPNG, setTheme } = useChart({ options })
```

```vue
<EvChart v-bind="chartProps" ref="chartRef" />
```

## 在 evoke-business-ui 中

组件库已依赖本包，无需安装：以 `<eb-chart>` 组件名提供同一引擎，样式与主题映射随组件库走，详见 [ev-chart 与 eb-chart](/guide/integration)。

## 下一步

- 一个最小组合跑起来：[总览与快速上手](/chart/)
- 让图表跟随宿主主题与暗色：[主题接入](/guide/theme)
