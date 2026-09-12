# 核心链路 SLO 看板

服务可观测性的标准版面：请求量与 P95 延迟同轴看「量涨延迟稳不稳」，延迟直方看请求集中在哪一段，SLO 子弹图把「该保什么」变成可对照的线——错误预算烧没烧完，一眼可见。

<DocExample :code="sloSource"><SloCase /></DocExample>

## 用到的图表

- [混合图](/chart/mixed) —— 近 30 日请求量（柱）与 P95 延迟（线）
- [直方图](/chart/bin) —— 网关响应延迟分布（原始值自动分桶）
- [子弹图](/chart/bullet) —— 可用性 / P95 / 错误率 / 错误预算四条 SLO

## 实现要点

- 请求量与延迟量纲不同，混合图各占一轴：量在涨而 P95 不跟着抬，说明容量还健康；
- 延迟分布用直方图承接原始打点，长尾是否变厚是容量预警的前兆；
- SLO 子弹图的「目标线」来自 SLO 定义而不是随便画线；错误预算剩余是发布节奏的硬约束；
- 看板嵌入监控体系时颜色全部走 `--ev-*` 令牌，暗色值守屏自动跟随。

<script setup>
import SloCase from './cases/SloCase.vue'
import sloSource from './cases/SloCase.vue?raw'
</script>
