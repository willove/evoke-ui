# Statistic 指标

`EwStatistic` 展示关键数字：用户量、可用性、评分等。数值用强字重展示体并带
等宽数字（tabular-nums），多值并排时构成页面中最有说服力的一行。

<script setup>
import { ref } from 'vue'
const countKey = ref(0)
</script>

## 基础用法

<DemoBlock title="并排数据位" center>

<div style="display:flex; gap:48px; justify-content:center;">
  <EwStatistic value="120K+" label="注册用户" align="center" />
  <EwStatistic value="99.99%" label="服务可用性" align="center" />
  <EwStatistic value="4.9" label="应用商店评分" align="center" />
</div>

```vue
<EwStatistic value="120K+" label="注册用户" align="center" />
<EwStatistic value="99.99%" label="服务可用性" align="center" />
```

</DemoBlock>

## 数字滚动

<DemoBlock title="animated 入视口滚动" description="数值进入视口时从 0 缓动滚到目标值（easeOutExpo：起步迅猛收尾徐缓）；自动解析前后缀。点「重新播放」复现。">

<div style="display:flex; justify-content:flex-end; margin-bottom:12px;">
  <EwButton size="small" variant="outline" icon="refresh" @click="countKey++">重新播放</EwButton>
</div>
<div :key="countKey" style="display:flex; gap:48px; justify-content:center;">
  <EwStatistic value="1,200+" label="周下载" align="center" animated />
  <EwStatistic value="99.99%" label="可用性" align="center" animated />
  <EwStatistic value="¥68" label="客单价" align="center" animated />
</div>

```vue
<EwStatistic value="1,200+" label="周下载" align="center" animated :duration="1600" />
```

</DemoBlock>

::: tip 场景建议
数字位通常出现在定价区上方或页脚之前，搭配 [EwLogoCloud](./logo-cloud) 构成完整的信任背书段落。
更多动效见[动效指南](/guide/motion)。
:::

## API

### Props

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| value | 数值 | string / number | — |
| label | 标签 | string | — |
| align | 对齐 | `'left' \| 'center'` | `'left'` |
| animated | 进入视口时数字从 0 滚动到目标值 | boolean | `false` |
| duration | 滚动时长 ms | number | `1200` |

### 插槽

| 插槽 | 说明 |
| --- | --- |
| value | 数值覆写（如追加动画计数） |
| label | 标签覆写 |
