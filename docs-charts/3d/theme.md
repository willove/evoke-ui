# 主题接入

三维图的颜色分两类：**系列色**（数据）与**结构色**（网格、轴线、文字）。两类都跟随宿主环境，
不设置任何主题时开箱即是默认观感。

## 跟随宿主令牌

系列色逐槽读取 `--ev-color-series-1` … `--ev-color-series-8`（槽 1 回落
`--ev-color-primary`），与 Evoke Charts、Evoke UI 同一套约定：宿主换主色、换主题，
三维图下一次绘制即跟随。

暗色以 `html.dark` 类为准；主题变化时广播一次 `ev-theme-change` 事件即可触发重绘：

```js
document.documentElement.classList.toggle('dark', true)
document.dispatchEvent(new CustomEvent('ev-theme-change', { bubbles: true }))
```

## 内置色系

`options.palette` 填色系 id 一键固定整图色板，与 Evoke Charts 同名色系同色值：

<DemoBlock>
  <ev-chart3d
    :options="{
      type: 'bar3d',
      title: 'sunset 落日',
      labels: ['Q1', 'Q2', 'Q3', 'Q4'],
      series: [
        { name: '线上', data: [180, 224, 201, 290] },
        { name: '线下', data: [140, 178, 160, 200] }
      ],
      palette: 'sunset'
    }"
    :height="300"
  />
</DemoBlock>

可用 id：`classic`（经典，即默认色板）· `aurora`（极光）· `sunset`（落日）·
`morandi`（莫兰迪）· `forest`（林间）· `ink`（墨蓝）· `candy`（糖果）。
每套都带明暗双份 8 槽色板，暗色自动换挡；生效后不再读取系列色令牌，宿主换主色不影响。

## 指定色值

- `options.theme.colors`：数组，直接指定 8 槽系列色（优先级最高）；
- 系列级 `color`：在单个 series / pieData 项上覆写；
- 结构色（网格、文字等）在 `options.theme` 里给 `gridColor`、`textColor` 等字段覆写。

## 全局换装

`applySeriesPalette` 把色系写到文档根，页面上所有二维、三维图一起换：

```js
import { applySeriesPalette, clearSeriesPalette } from '@wil-works/evoke-charts/3d'

applySeriesPalette('forest')            // 按内置 id
applySeriesPalette(['#1122aa', '#22aa44', '#aa2266']) // 或显式色值数组
applySeriesPalette({ light: [...], dark: [...] })     // 或明暗两套
clearSeriesPalette()                    // 恢复令牌默认
```

曲面、色标散点的连续色带同样有明暗两套，暗色下自动反转为低暗高亮，与画面对比一致。
