# 基金持仓体检

股票基金的个人盘面：持仓列表每行自带近 7 日净值迷你图，收益排行看相对强弱，风险-收益散点定去留，资产配置环守住大类的比例纪律。

<DocExample :code="fundSource"><FundCase /></DocExample>

## 用到的图表

- [迷你趋势图](/chart/sparkline) —— 表格行内的近 7 日净值走势
- [条形图](/chart/horizontal-bar) —— 今年以来收益排行（正负自然分色）
- [散点图](/chart/scatter) —— 波动率 × 年化收益，左上角的基金最优秀
- [环形图](/chart/doughnut) —— 资产配置（`innerRadius` + `piePercentMode`）

## 实现要点

- 持仓列表用普通表格排版，迷你图压到 52px 高，只回答「最近在涨还是在跌」；
- 收益排行按数值降序传入，正收益与负收益同图对照；
- 散点每点挂 `label`（基金名），悬浮即读——选基看的是「左上角」，不用逐个点开；
- 涨跌颜色遵循 A 股约定（红涨绿跌），走 `--ev-color-danger / --ev-color-success` 令牌。

<script setup>
import FundCase from './cases/FundCase.vue'
import fundSource from './cases/FundCase.vue?raw'
</script>
