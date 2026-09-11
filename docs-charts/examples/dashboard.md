# 运营数据看板

看板的经典骨架：一排带迷你趋势的 KPI 卡，配趋势、构成、排行三张主图。右上加导出按钮，把趋势图存成本地 PNG。

<DocExample :code="dashboardSource"><DashboardCase /></DocExample>

## 用到的图表

- [迷你趋势图](/chart/sparkline) —— KPI 卡内的趋势指纹
- [面积图](/chart/area) —— 营收趋势主图
- [环形图](/chart/doughnut) —— 渠道构成
- [条形图](/chart/horizontal-bar) —— 区域排行（按数值降序传入）

## 实现要点

- KPI 卡把图表 `height` 压到 56 并只放一条系列，只回答「在涨还是在跌」；
- 导出按钮取趋势图组件 ref 调 `toDataURL()`，用返回的 dataURL 触发浏览器下载；
- 卡片与面板的颜色全部走宿主 `--ev-*` 令牌，暗色模式下整版自动跟随，见[主题接入](/guide/theme)。

<script setup>
import DashboardCase from './cases/DashboardCase.vue'
import dashboardSource from './cases/DashboardCase.vue?raw'
</script>
