# 图表

EvChart 是 Evoke 生态的 Canvas 自绘图表引擎（独立包 `@wil-works/evoke-charts`），evoke-business-ui **默认内嵌**本引擎并以 `<eb-chart>` 组件名提供——同一引擎的语法糖注册名，配置、事件与实例方法完全一致，主题、暗色与运行时换肤自动跟随组件库，无需任何图表侧配置。

## 图表文档已独立成站

图表引擎的能力全集、全部图表类型（折线 / 柱状 / 饼环 / 散点 / 热力 / K 线等 20+）、完整配置项与逐类型在线示例，收录于 **Evoke Charts 独立文档站**：

<a class="chart-cta" href="https://evoke-charts.wil-works.com" target="_blank" rel="noopener">前往 Evoke Charts 文档站 →</a>

本页作为使用指引保留最常用图表的速查示例；能力面以独立文档站为准。

## 组件库内使用

无需安装与单独引入——组件库依赖图表包，`<eb-chart>` 已全局注册：

```vue
<template>
  <eb-chart :options="options" :height="280" />
</template>

<script setup>
const options = {
  type: 'line',
  title: '渠道转化',
  labels: ['周一', '周二', '周三', '周四', '周五'],
  series: [
    { name: '自然流量', data: [120, 132, 101, 134, 90] },
    { name: '广告投放', data: [80, 92, 91, 94, 70] },
  ],
  legend: { show: true },
}
</script>
```

## 主题与配色

图表默认跟随组件库主题与暗色；运行时换肤（含品牌换色）自动重绘。需要定制图表数据配色时：

- 声明式：`<eb-config-provider :series="['#175DFF', '#5AD8A6', ...]">`（≤8 色槽位）；
- 命令式：`setSeriesPalette(colors)` / `clearSeriesPalette()`（主题工具导出）。

契约与配色方案说明见独立文档站的[主题接入](https://evoke-charts.wil-works.com/guide/theme)与[设计规范](https://evoke-charts.wil-works.com/guide/design)。

<style scoped>
.chart-cta {
  display: inline-block;
  margin: 6px 0 4px;
  padding: 9px 20px;
  border: 1px solid var(--eb-color-primary);
  border-radius: 8px;
  color: var(--eb-color-primary);
  font-weight: 600;
  text-decoration: none;
  transition: opacity 0.15s;
}
.chart-cta:hover {
  opacity: 0.85;
}
</style>
