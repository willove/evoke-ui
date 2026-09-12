# 人力资源年度盘点

HR 盘面的四个切面：招聘漏斗看年度供给效率，薪酬箱线对照市场分位，年龄直方看结构断层，人效散点看部门产出——年度人才盘点一张页面讲完。

<DocExample :code="hrSource"><HrCase /></DocExample>

## 用到的图表

- [漏斗图](/chart/funnel) —— 年度招聘漏斗（简历 → Offer）
- [箱线图](/chart/boxplot) —— 各岗位年薪五分位（min / q1 / median / q3 / max）
- [直方图](/chart/bin) —— 全员年龄结构（原始数值自动分桶）
- [散点图](/chart/scatter) —— 部门人效（人均工时 × 人均产出）

## 实现要点

- 四个切面各用一种「最诚实」的图：转化效率用漏斗、群体分布用箱线、结构峰值用直方、两变量关系用散点；
- 薪酬五分位由调研报告口径预先算好传入，与统计口径保持一致；
- KPI 行（入职 / 流失 / 人均工时）用排版表达，图表负责回答「为什么」。

<script setup>
import HrCase from './cases/HrCase.vue'
import hrSource from './cases/HrCase.vue?raw'
</script>
