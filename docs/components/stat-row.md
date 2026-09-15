# StatRow 指标卡行

[StatCard](/components/stat-card) 的批量编排：items 配置式一次渲染一排指标卡，cols 控制栅格列数，适合看板顶部的指标带。

## 基础用法

<DemoBlock>
  <eb-stat-row :items="kpis" />
</DemoBlock>

## 两列布局

cols 取 2 / 3 / 4，窄容器建议 2 列：

<DemoBlock>
  <eb-stat-row :items="kpis.slice(0, 2)" :cols="2" />
</DemoBlock>

<script setup>
import { ref } from 'vue'
const kpis = ref([
  { label: '销售额', value: 128430, icon: 'funds', type: 'primary', trend: 12.4 },
  { label: '订单量', value: 3568, icon: 'shopping-cart', type: 'success', trend: 8.1 },
  { label: '退款单', value: 86, icon: 'inbox', type: 'danger', trend: -3.5 },
  { label: '复购率', value: 38, icon: 'history', type: 'info', trend: 1.2 },
])
</script>

<ApiTable title="StatRow Props" :rows="[
  { name: 'items', desc: '指标配置数组，项为 { label, value, icon, type, trend }', type: 'array', default: '[]' },
  { name: 'cols', desc: '栅格列数', type: '2 | 3 | 4', default: '4' },
]" />
