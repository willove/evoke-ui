# 服务器指标监控

云控制台式的批量指标监控：每个指标一行，细线小图看走势，右侧 Max / Min / Avg 统计列看量化区间。定时器每秒推进一个数据点，曲线即时重绘、统计列同步刷新，可随时暂停。

<DocExample :code="monitorSource"><MonitorCase /></DocExample>

## 用到的能力

- [折线图](/chart/line) —— 批量指标小图
- `showSymbol: false` + 细 `lineWidth` —— 密集点位下的心电图式细线
- `animation: { enabled: false }` —— 实时推进数据点时不做补间
- [迷你趋势图](/chart/sparkline) —— 同款「为嵌入而生」的思路，本例在完整折线上实现

## 实现要点

- 七个指标共用一套 `labels`，每行一个独立的 60 点窗口；行高只有 56px，靠 `showSymbol: false` 与 `lineWidth: 1.5` 压成细线；
- `animation: { enabled: false }` 是实时刷新的关键——数据点每秒都在推进，若走默认补间，整条曲线会跟着反复变形；关掉后新点即划即走，观感才稳定；
- Max / Min / Avg 在每次推进后对窗口内全部点重新求值，展示格式按指标各自的小数位走；
- 曲线形态是「平缓底噪 + 偶发尖峰」：底噪用正弦叠加生成，尖峰按小概率随机注入，写死的初始数据保证文档构建（SSR）与浏览器首屏渲染一致；
- 组件卸载时 `clearInterval`，避免定时器泄漏。

<script setup>
import MonitorCase from './cases/MonitorCase.vue'
import monitorSource from './cases/MonitorCase.vue?raw'
</script>
