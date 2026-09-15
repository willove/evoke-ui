# StatCard 指标卡

单指标数据卡：图标 + 标签 + 数值 + 涨跌趋势，适合看板顶部、列表页头部的关键指标展示。数值默认带滚动动画，千分位自动格式化。

## 基础用法

<DemoBlock>
  <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px">
    <eb-stat-card label="本月销售额" :value="128430" icon="funds" type="primary" :trend="12.4" />
    <eb-stat-card label="新增订单" :value="3568" icon="shopping-cart" type="success" :trend="8.1" />
    <eb-stat-card label="新增用户" :value="942" icon="user" type="warning" :trend="-2.3" />
    <eb-stat-card label="客单价" :value="286" suffix="元" icon="wallet" type="info" :trend="1.8" />
  </div>
</DemoBlock>

## 后缀与字符串值

suffix 适合「万元 / % / 单」这类单位；value 传字符串时原样展示（不再做千分位）：

<DemoBlock>
  <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px">
    <eb-stat-card label="月活跃设备" value="3.2" suffix="万台" icon="dashboard" />
    <eb-stat-card label="剩余库存" value="8,641" icon="inbox" :count-up="false" />
  </div>
</DemoBlock>

## 关闭滚动动画

`count-up` 设为 false 后数值直接呈现，适合实时频繁刷新的场景：

<DemoBlock>
  <eb-stat-card label="今日访问（实时）" :value="realtime" icon="line-chart" type="success" :count-up="false" :trend="4.2" />
  <div style="margin-top: 8px">
    <eb-button size="small" @click="refresh">模拟刷新数据</eb-button>
  </div>
</DemoBlock>

## 插槽

value / trend 均可自定义；trend 插槽带 `trend` 作用域值：

<DemoBlock>
  <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px">
    <eb-stat-card label="任务完成率" :value="76" suffix="%" icon="file-list" type="primary">
      <template #value>
        <span style="font-weight:600">76<small style="font-size:14px"> / 100</small></span>
      </template>
    </eb-stat-card>
    <eb-stat-card label="服务可用性" :value="99" suffix="%" icon="sunny" type="success" :trend="0.2">
      <template #trend>
        <span style="font-size:12px">近 30 天保持稳定</span>
      </template>
    </eb-stat-card>
  </div>
</DemoBlock>

<script setup>
import { ref } from 'vue'
const realtime = ref(1024)
const refresh = () => {
  realtime.value = Math.round(800 + Math.random() * 1200)
}
</script>

<ApiTable title="StatCard Props" :rows="[
  { name: 'label', desc: '指标名称', type: 'string', default: '' },
  { name: 'value', desc: '指标值；数字带滚动动画与千分位，字符串原样展示', type: 'string | number', default: '—' },
  { name: 'icon', desc: '图标名', type: 'string', default: '' },
  { name: 'type', desc: '图标底色语义', type: 'primary | success | warning | danger | info', default: 'primary' },
  { name: 'trend', desc: '涨跌百分比：正数涨（上箭头）、负数跌（下箭头）', type: 'number', default: '—' },
  { name: 'countUp', desc: '数值滚动动画（仅数字生效）', type: 'boolean', default: 'true' },
  { name: 'countDuration', desc: '滚动动画时长（ms）', type: 'number', default: '800' },
  { name: 'suffix', desc: '数值后缀单位', type: 'string', default: '' },
]" />

<ApiTable title="StatCard Slots" :rows="[
  { name: 'icon', desc: '自定义图标区', type: '—', default: '—' },
  { name: 'label', desc: '自定义指标名', type: '—', default: '—' },
  { name: 'value', desc: '自定义数值区（替换数值与后缀）', type: '—', default: '—' },
  { name: 'trend', desc: '自定义趋势区，作用域插槽：{ trend }', type: '—', default: '—' },
]" />
