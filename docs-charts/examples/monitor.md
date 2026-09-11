# 监控大屏

四张时序图共用一个 `connectGroup` 联动组：图例显隐与 dataZoom 缩放范围在四图间同步；定时器每秒推进一个数据点，数值补间动画让曲线平滑生长。顶栏按钮可暂停/恢复刷新。

<DocExample :code="monitorSource"><MonitorCase /></DocExample>

## 用到的能力

- [折线图](/chart/line) / [面积图](/chart/area) —— 时序曲线
- [交互与联动](/chart/interaction) —— `connectGroup` 多图联动与 `dataZoom` 滚轮缩放
- 运行时更新 —— `options` 响应式变化后自动增量重绘，无需手动调方法

## 实现要点

- 四张图 `options` 里的 `connectGroup` 设为同名即可联动，图例点选与缩放窗口全组同步；
- 定时器只做一件事：往 `labels` 尾部推新时间点、`series` 尾部推新值并 `shift` 掉最旧的点，窗口长度固定；
- 初始 30 个点写死在代码里，保证文档构建（SSR）与浏览器首屏渲染一致；
- 组件卸载时 `clearInterval`，避免定时器泄漏。

<script setup>
import MonitorCase from './cases/MonitorCase.vue'
import monitorSource from './cases/MonitorCase.vue?raw'
</script>
