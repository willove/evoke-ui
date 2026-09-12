# 主题接入

图表的颜色在渲染时从宿主页面的 `--ev-*` 令牌取值（`document.documentElement` 上读取）。改这些令牌就是改图表主题，不需要给图表传任何颜色配置。

<DemoBlock>
  <ev-chart
    :options="{
      type: 'doughnut',
      title: '令牌取色演示',
      pieData: [
        { name: '直达', value: 335 },
        { name: '营销', value: 254 },
        { name: '搜索', value: 210 },
      ],
      legend: { show: true },
    }"
    :height="240"
  />
</DemoBlock>

## 令牌清单

图表按槽位读取以下令牌，未定义的槽位逐槽回落到内置成套色板：

| 令牌组 | 令牌 | 用途 |
| --- | --- | --- |
| 系列色 | `--ev-color-series-1` … `--ev-color-series-8` | 数据系列专用色板（与状态语义色解耦；槽 1 未定义时回读 `--ev-color-primary`） |
| 表面 | `--ev-bg-color`、`--ev-bg-color-overlay` | 画布底、浮层底 |
| 文字 | `--ev-text-color-primary` / `-secondary` / `-danger` | 标题、轴标签、图例文字 |
| 边线 | `--ev-border-color` / `-light` / `-dark` | 轴线、网格线 |
| 填充 | `--ev-fill-color-light` / `-dark` | 背景 band、悬停带 |
| 主色 RGB | `--ev-color-primary-rgb` | 高亮、十字准线等需要透明度叠加的场景 |

宿主只需要定义用到的组；一个令牌都不定义时图表整体使用内置色板，开箱即可用。

## 暗色模式

暗色跟随约定：在 `html.dark` 选择器下重映射上述令牌。图表内部监听 `<html>` 的 `class` 变化，暗色类挂上时自动取新值重绘，本站顶栏的暗色开关就是这个机制——切换后所有演示图即时跟随。

与 evoke-ui 同用时，其主题系统已带 `html.dark` 令牌重映射，图表自动跟随，无需额外代码。

## 运行时换肤

宿主在运行时改令牌（品牌换色、预设主题切换）后，图表在下一次绘制时取到新值。与 evoke-business-ui 同用时，其换肤流程会派发 `ev-theme-change` 事件，图表收到事件立即重绘，换肤过程无感跟随。

## 相关

- 令牌的完整清单与暗色示例值：evoke-ui 的 [主题与颜色](https://evoke-ui.wil-works.com/utils/theme-color)
- 组件库内的跟随约定：[内嵌于组件库](/guide/integration)
