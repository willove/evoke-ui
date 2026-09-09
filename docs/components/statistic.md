# Statistic 统计数值

展示统计数值：千分位、精度、前后缀、自定义 formatter 与 loading 占位。适用于仪表盘、看板、详情页的指标区块。

## 基础用法

<DemoBlock>
  <div style="display: flex; gap: 48px; flex-wrap: wrap;">
    <ev-statistic title="今日订单" :value="12893"></ev-statistic>
    <ev-statistic title="本月 GMV" :value="3984721.56"></ev-statistic>
    <ev-statistic title="系统在线用户" :value="867"></ev-statistic>
  </div>
</DemoBlock>

## 精度与千分位

`precision` 控制小数位（四舍五入），`separator` 自定义千分位符号（传空字符串关闭分组）：

<DemoBlock>
  <div style="display: flex; gap: 48px; flex-wrap: wrap;">
    <ev-statistic title="转化率" :value="0.9752" :precision="2"></ev-statistic>
    <ev-statistic title="账户余额" :value="1234567.891" :precision="2"></ev-statistic>
    <ev-statistic title="欧式分组" :value="98765" separator="."></ev-statistic>
    <ev-statistic title="无分组" :value="98765" separator=""></ev-statistic>
  </div>
</DemoBlock>

## 前缀 / 后缀 / 数值样式

支持 `prefix` / `suffix` 属性或同名插槽（可放图标）；`value-style` 级联到整个数值区：

<DemoBlock>
  <div style="display: flex; gap: 48px; flex-wrap: wrap;">
    <ev-statistic title="营收" :value="286530" prefix="¥" :value-style="{ color: 'var(--ev-color-success)' }"></ev-statistic>
    <ev-statistic title="退款" :value="9820" prefix="¥" :value-style="{ color: 'var(--ev-color-danger)' }"></ev-statistic>
    <ev-statistic title="库存周转" :value="12" suffix="天"></ev-statistic>
    <ev-statistic title="同比" :value="18">
      <template #suffix>
        <span style="font-size: 14px; color: var(--ev-color-danger);">↑ 18%</span>
      </template>
    </ev-statistic>
  </div>
</DemoBlock>

## 自定义 formatter

传入 `formatter` 后内建的千分位/精度不再生效，完全由函数决定展示：

<DemoBlock>
  <div style="display: flex; gap: 48px; flex-wrap: wrap;">
    <ev-statistic title="处理人次" :value="20486" :formatter="(v) => v + ' 人次'"></ev-statistic>
    <ev-statistic title="任务耗时" :value="3725" :formatter="(v) => formatDuration(v)"></ev-statistic>
  </div>
</DemoBlock>

## loading 与数值翻动

`loading` 用占位点替代数值（拉取接口时）；`flip` 在数值变化时播放上下翻动过渡，适合大屏轮询刷新：

<DemoBlock>
  <div style="display: flex; gap: 48px; flex-wrap: wrap; align-items: flex-start;">
    <ev-statistic title="接口拉取中" :value="0" loading></ev-statistic>
    <ev-statistic title="实时 QPS（每秒刷新）" :value="qps" flip :value-style="{ color: 'var(--ev-color-primary)' }"></ev-statistic>
  </div>
</DemoBlock>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { formatDuration } from '@wil-works/evoke-business-ui'

const qps = ref(3241)
let timer = null
onMounted(() => {
  timer = setInterval(() => {
    qps.value = 2800 + Math.round(Math.random() * 900)
  }, 1000)
})
onBeforeUnmount(() => clearInterval(timer))
</script>

## Statistic API

### Props

| 名称 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| value | Number / String | `0` | 数值；字符串原样展示（如单号） |
| precision | Number | — | 小数位精度 |
| separator | String | `','` | 千分位符号；`''` 关闭分组 |
| prefix / suffix | String | `''` | 前后缀（同名插槽优先） |
| title | String | `''` | 标题（`title` 插槽优先） |
| value-style | Object | — | 作用于数值区的样式（字号/颜色等） |
| formatter | Function | — | 自定义格式化 `(value) => string`，设置后 separator/precision 失效 |
| loading | Boolean | `false` | 加载占位 |
| flip | Boolean | `false` | 数值变化时的翻动过渡 |

### Slots

| 名称 | 说明 |
| --- | --- |
| title | 标题 |
| prefix / suffix | 前后缀（可放图标） |

## 配套工具

配合 [format 工具](/utils/format) 的 `formatNumber` / `formatDuration` / `formatPercent` 使用；指标区块布局可搭配业务组件 `EvStatCard` / `EvStatRow`。
