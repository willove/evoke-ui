# Countdown 倒计时

目标时刻倒计时，到点自动停在零值并触发 `finish` 事件，适合秒杀开始、订单支付剩余时间、活动截止提醒等场景。与 Statistic 同族排版，可直接并排使用。

## 基础用法

`value` 传目标时刻（Date、时间戳或可解析的日期字符串），组件自动走秒：

<DemoBlock>
  <div style="display:flex;gap:32px;flex-wrap:wrap;align-items:flex-end">
    <eb-countdown title="距秒杀开始" :value="inOneHour" />
    <eb-countdown title="支付剩余时间" :value="inFifteenMinutes" />
    <eb-countdown title="距活动截止" :value="inTwoDays" />
  </div>
</DemoBlock>

## 格式与前后缀

`format` 令牌：`HH` 总小时（可超过 24）、`mm` 分、`ss` 秒，其余字符原样输出；`prefix` / `suffix` 适合「还剩 / 截止」类提示语：

<DemoBlock>
  <div style="display:flex;gap:32px;flex-wrap:wrap;align-items:flex-end">
    <eb-countdown :value="inThirtyMinutes" format="mm 分 ss 秒" prefix="还剩" />
    <eb-countdown :value="inTwentySixHours" format="HH 小时 mm 分" />
    <eb-countdown :value="inOneHour" format="HH:mm:ss" suffix="后截止" />
  </div>
</DemoBlock>

## 结束事件与重置

到点触发 `finish`；运行中每次走秒触发 `change`（载荷为剩余毫秒）。改 `value` 即重新计时：

<DemoBlock>
  <div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap">
    <eb-countdown ref="demo" :value="target" value-style="font-size:28px" />
    <eb-button @click="restart">重新计时（10 秒）</eb-button>
  </div>
  <div v-if="done" style="margin-top:8px;color:var(--eb-color-danger)">已到点（finish 已触发）</div>
</DemoBlock>

<script setup>
import { ref, onMounted } from 'vue'
const offset = (ms) => Date.now() + ms
const inOneHour = ref(offset(3600 * 1000))
const inFifteenMinutes = ref(offset(15 * 60 * 1000))
const inThirtyMinutes = ref(offset(30 * 60 * 1000))
const inTwentySixHours = ref(offset(26 * 3600 * 1000))
const inTwoDays = ref(offset(48 * 3600 * 1000))

const target = ref(offset(10 * 1000))
const done = ref(false)
const restart = () => {
  done.value = false
  target.value = offset(10 * 1000)
}
</script>

<ApiTable title="Countdown Props" :rows="[
  { name: 'value', desc: '目标时刻（Date / 时间戳 / dayjs 可解析字符串）；已过去则直接零值', type: 'date | string | number', default: '—' },
  { name: 'format', desc: '展示格式：HH 总小时（可超过 24）、mm 分、ss 秒，其余字符原样', type: 'string', default: 'HH:mm:ss' },
  { name: 'title', desc: '标题', type: 'string', default: '' },
  { name: 'prefix', desc: '数值前缀', type: 'string', default: '' },
  { name: 'suffix', desc: '数值后缀', type: 'string', default: '' },
  { name: 'valueStyle', desc: '数值区样式（字号/颜色等）', type: 'object', default: '—' },
]" />

<ApiTable title="Countdown Events" :rows="[
  { name: 'finish', desc: '倒计时归零时触发', type: '—', default: '—' },
  { name: 'change', desc: '走秒时触发，载荷为剩余毫秒数', type: 'number', default: '—' },
]" />

<ApiTable title="Countdown Slots" :rows="[
  { name: 'title', desc: '自定义标题区', type: '—', default: '—' },
  { name: 'prefix', desc: '自定义前缀区', type: '—', default: '—' },
  { name: 'suffix', desc: '自定义后缀区', type: '—', default: '—' },
]" />
