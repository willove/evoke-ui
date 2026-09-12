# 交付效能看板

企业级应用交付的效能盘：月度发布节奏与变更失败率同轴对照，各服务构建时长一箱一服务，发布窗口热力回答「团队的发布纪律」——DORA 四指标里可量化的部分都在这张页面。

<DocExample :code="deliverySource"><DeliveryCase /></DocExample>

## 用到的图表

- [混合图](/chart/mixed) —— 发布次数（柱）与变更失败率（线）双轴对照
- [箱线图](/chart/boxplot) —— 各服务构建时长的中位数与波动
- [热力图](/chart/heatmap) —— 发布窗口分布（星期 × 时段）

## 实现要点

- 发布次数与失败率量纲不同，混合图各占一轴；失败率走低而发布频次走高，说明提效没有牺牲质量；
- 构建时长箱线按服务分组，箱体最长（数据平台）就是流水线优化的第一优先级；
- 发布窗口热力用于审视发布纪律：周五深夜应接近零，格子发深就是纪律在松动；
- KPI 行（年度发布 / 成功率 / 平均构建）用排版表达，看板嵌入时随 `--ev-*` 令牌明暗跟随。

<script setup>
import DeliveryCase from './cases/DeliveryCase.vue'
import deliverySource from './cases/DeliveryCase.vue?raw'
</script>
