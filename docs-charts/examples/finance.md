# 财务月度结算

财务复盘的完整版面：KPI 行给出结论，利润桥拆「钱怎么变成净利润」，费用构成环看结构，部门报销堆叠柱看结算节奏——月度经营会一张页面讲完。

<DocExample :code="financeSource"><FinanceCase /></DocExample>

## 用到的图表

- [瀑布图](/chart/waterfall) —— 利润桥：营业收入逐项扣到净利润
- [饼图](/chart/pie) —— 费用构成（`piePercentMode` 百分比直读）
- [堆叠柱状图](/chart/stacked-bar) —— 部门报销结算的月度节奏

## 实现要点

- KPI 行用普通排版实现（数字大、标签小），图表只负责「过程与结构」，不与 KPI 抢读数；
- 利润桥的 `labels` 写流程语义（营业收入/原材料/…/净利润），负值项自动向下悬浮；
- 报表嵌进宿主系统时，图表去自带底色、颜色全部走 `--ev-*` 令牌，暗色模式整版自动跟随。

<script setup>
import FinanceCase from './cases/FinanceCase.vue'
import financeSource from './cases/FinanceCase.vue?raw'
</script>
