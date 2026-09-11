# 报表嵌入

图表嵌进报表页：表格行内放迷你趋势图回答「最近在涨还是在跌」，表格下方一整幅子弹图回答「各指标目标完成了没有」。这是报表类页面最省空间的指标排版。

<DocExample :code="reportSource"><ReportCase /></DocExample>

## 用到的图表

- [迷你趋势图](/chart/sparkline) —— 行内趋势列
- [子弹图](/chart/bullet) —— 整幅目标达成图（`bulletData` 的 `value` / `target`）

## 实现要点

- 行内 sparkline 去掉标题与图例，`height` 压到 56，跟随表格行高；
- 子弹图自带指标名与数值文本，需要足够宽度——按整幅放而不塞进窄列；
- 环比涨跌用 `--ev-color-success` / `--ev-color-danger` 令牌取色，暗色模式自动跟随；
- 「工单量」这类越低越好的指标，涨跌颜色按业务语义手动指定，不依赖涨跌方向。

<script setup>
import ReportCase from './cases/ReportCase.vue'
import reportSource from './cases/ReportCase.vue?raw'
</script>
