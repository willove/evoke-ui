<template>
  <div class="case-mon">
    <header class="case-mon__header">
      <div>
        <h3 class="case-mon__title">服务器指标监控</h3>
        <p class="case-mon__sub">近 60 秒 · 每秒推进一个点 · Max / Min / Avg 为窗口内全部点的统计值</p>
      </div>
      <button class="case-mon__btn" type="button" @click="toggle">{{ running ? '暂停刷新' : '开始刷新' }}</button>
    </header>

    <section v-for="g in groups" :key="g.name" class="case-mon__group">
      <h4 class="case-mon__group-name">{{ g.name }}</h4>
      <div v-for="m in g.metrics" :key="m.key" class="case-mon__row">
        <div class="case-mon__name">
          {{ m.name }}<span class="case-mon__unit">{{ m.unit }}</span>
        </div>
        <div class="case-mon__chart">
          <EvChart type="line" :options="m.options" :height="64" />
        </div>
        <div class="case-mon__stat">
          <span>Max:</span>
          <strong>{{ m.stats.max }}</strong>
        </div>
        <div class="case-mon__stat">
          <span>Min:</span>
          <strong>{{ m.stats.min }}</strong>
        </div>
        <div class="case-mon__stat">
          <span>Avg:</span>
          <strong>{{ m.stats.avg }}</strong>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { EvChart } from '@wil-works/evoke-charts'

// 窗口固定 60 个点；初始数据写死保证文档构建（SSR）与浏览器首屏一致
const WINDOW = 60
const fmtDateTime = (ms) => {
  const d = new Date(ms)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}
const INIT_TIMES = Array.from({ length: WINDOW }, (_, i) => fmtDateTime(new Date(2026, 8, 12, 9, 41, 1, 0).getTime() + i * 1000))

/** 确定性伪噪声（SSR 与浏览器首屏一致）：平缓底噪 + 指定位置的偶发尖峰，贴近云监控曲线的毛刺观感 */
function noise(i) {
  const x = Math.sin(i * 12.9898) * 43758.5453
  return x - Math.floor(x)
}
function gen(base, amp, spikes = []) {
  return Array.from({ length: WINDOW }, (_, i) => {
    let v = base + (noise(i) - 0.5) * 2 * amp
    if (spikes.includes(i)) v += base * 1.4 + amp * 5
    return Math.round(v * 1000) / 1000
  })
}

const defs = [
  { key: 'cpu', group: 'CPU 监控', name: 'CPU 利用率', unit: '%', decimals: 1, base: 8, amp: 2, spikeAmp: 26, spikes: [24, 43, 44], max: 100 },
  { key: 'memMB', group: '内存监控', name: '内存使用量', unit: 'MB', decimals: 0, base: 580, amp: 6, spikeAmp: 0, spikes: [] },
  { key: 'memPct', group: '内存监控', name: '内存利用率', unit: '%', decimals: 2, base: 39, amp: 1.2, spikeAmp: 0, spikes: [], max: 100 },
  { key: 'netOut', group: '内网带宽监控', name: '内网出带宽', unit: 'Mbps', decimals: 3, base: 0.04, amp: 0.01, spikeAmp: 0.5, spikes: [17, 33] },
  { key: 'netIn', group: '内网带宽监控', name: '内网入带宽', unit: 'Mbps', decimals: 3, base: 0.035, amp: 0.01, spikeAmp: 0.45, spikes: [29, 52] },
  { key: 'pktOut', group: '内网带宽监控', name: '内网出包量', unit: '个/秒', decimals: 0, base: 12, amp: 3, spikeAmp: 52, spikes: [12, 26, 44] },
  { key: 'pktIn', group: '内网带宽监控', name: '内网入包量', unit: '个/秒', decimals: 0, base: 14, amp: 3, spikeAmp: 55, spikes: [20, 47, 48] },
]

const store = reactive({
  labels: [...INIT_TIMES],
  series: Object.fromEntries(defs.map((d) => [d.key, gen(d.base, d.amp, d.spikes)])),
})

function buildOptions(def) {
  return {
    type: 'line',
    labels: store.labels,
    series: [{ name: def.name, data: store.series[def.key], lineWidth: 1.25 }],
    // 云监控小图定制：无横网格、3 档 y 刻度（库内按绘图高度自动保密度）、
    // 整条 x 轴隐藏（行分隔线由容器提供）；left 留白交刻度标签实测自适应，杜绝截断；
    // padding 收紧静态留白，绘图区几乎占满画布高度
    yAxis: { grid: { show: false }, ticks: 3 },
    xAxis: { show: false },
    // 云监控小图定制：无横网格、3 档小字 y 刻度、整条 x 轴隐藏（行分隔线由容器提供）；
    // padding 收紧到贴边，画布几乎全给曲线——长条监控带的观感
    padding: { top: 6, right: 8, bottom: 6 },
    animation: { enabled: false },
    legend: { show: false },
    tooltip: {
      show: true,
      formatter: (p) => `
        <div class="ev-chart__tooltip-title">${p.name}</div>
        <div style="font-size:16px;font-weight:700;line-height:1.5;color:var(--ev-text-color-primary,#1f2329);">${fmtVal(def, p.value)}</div>
        <div style="font-size:12px;color:var(--ev-text-color-tertiary,#8f959e);margin-top:2px;">粒度：1秒</div>
      `,
    },
  }
}

function fmtVal(def, v) {
  return `${Number(v).toFixed(def.decimals)}${def.unit}`
}

function fmt(def, v) {
  return `${v.toFixed(def.decimals)}${def.unit}`
}

const groups = computed(() => {
  const byGroup = new Map()
  for (const def of defs) {
    if (!byGroup.has(def.group)) byGroup.set(def.group, [])
    const data = store.series[def.key]
    const max = Math.max(...data)
    const min = Math.min(...data)
    const avg = data.reduce((s, v) => s + v, 0) / data.length
    byGroup.get(def.group).push({
      ...def,
      options: buildOptions(def),
      stats: { max: fmt(def, max), min: fmt(def, min), avg: fmt(def, avg) },
    })
  }
  return [...byGroup.entries()].map(([name, metrics]) => ({ name, metrics }))
})

const running = ref(false)
let timer = null

function nowLabel() {
  return fmtDateTime(Date.now())
}

/** 挂载后把初始窗口换成真实当前时间的连续 60 秒，避免时间轴与访客时钟对不上 */
function resetLabelsToNow() {
  const now = Date.now()
  store.labels = Array.from({ length: WINDOW }, (_, i) => fmtDateTime(now - (WINDOW - 1 - i) * 1000))
}

function tick() {
  const t = nowLabel()
  store.labels.push(t)
  store.labels.shift()
  for (const def of defs) {
    const data = store.series[def.key]
    const last = data[data.length - 1]
    const ceiling = def.max ?? Infinity
    let next = last + (def.base - last) * 0.08 + (Math.random() - 0.5) * 2 * def.amp
    // 尖峰只在远离上限时注入，且最终值钳制在指标上限内（利用率不超 100%）
    if (def.spikeAmp > 0 && last < ceiling * 0.9 && Math.random() < 0.05) next += def.base * 1.4 + def.spikeAmp
    next = Math.min(next, ceiling)
    data.push(Math.max(0, Math.round(next * 1000) / 1000))
    data.shift()
  }
}

function start() {
  if (timer) return
  running.value = true
  timer = setInterval(tick, 1000)
}
function stop() {
  clearInterval(timer)
  timer = null
  running.value = false
}
function toggle() {
  if (running.value) stop()
  else start()
}

onMounted(() => {
  resetLabelsToNow()
  start()
})
onUnmounted(stop)
</script>

<style scoped>
.case-mon {
  border: 1px solid var(--ev-app-card-border);
  border-radius: 12px;
  background: var(--ev-bg-color);
  padding: 16px 20px 8px;
}
.case-mon__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 10px;
}
.case-mon__title {
  margin: 0;
  font-size: 17px;
  color: var(--ev-text-color-primary);
}
.case-mon__sub {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--ev-text-color-secondary);
}
.case-mon__btn {
  padding: 6px 14px;
  border: 1px solid var(--ev-border-color-dark);
  border-radius: 6px;
  background: var(--ev-color-primary);
  color: #fff;
  font-size: 12px;
  white-space: nowrap;
  cursor: pointer;
  transition: opacity 0.15s;
}
.case-mon__btn:hover {
  opacity: 0.88;
}
.case-mon__group {
  padding: 14px 0 8px;
  border-top: 1px solid var(--ev-border-color);
}
/* 层级：组名为主（加重、主色），行标签为次（常规字重、次级色），单位再次一级 */
.case-mon__group-name {
  margin: 0 0 2px;
  font-size: 13px;
  font-weight: 600;
  color: var(--ev-text-color-primary);
}
.case-mon__row {
  display: grid;
  grid-template-columns: 132px minmax(0, 1fr) repeat(3, 78px);
  align-items: center;
  gap: 16px;
  padding: 5px 0;
}
.case-mon__row + .case-mon__row {
  border-top: 1px dashed var(--ev-border-color-light);
}
.case-mon__name {
  font-size: 13px;
  font-weight: 400;
  color: var(--ev-text-color-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.case-mon__unit {
  margin-left: 3px;
  font-weight: 400;
  font-size: 12px;
  color: var(--ev-text-color-tertiary, var(--ev-text-color-secondary));
}
.case-mon__chart {
  min-width: 0;
}
/* 图表小图的定制外观：去掉自带白底/圆角/描边，直接浮在行底色上 */
.case-mon__chart :deep(.ev-chart) {
  background: transparent;
  border: none;
  border-radius: 0;
}
.case-mon__stat {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}
.case-mon__stat span {
  font-size: 11px;
  color: var(--ev-text-color-tertiary, var(--ev-text-color-secondary));
}
.case-mon__stat strong {
  font-size: 12.5px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  color: var(--ev-text-color-primary);
}
@media (max-width: 900px) {
  .case-mon__row {
    grid-template-columns: 110px minmax(0, 1fr);
  }
  .case-mon__stat {
    grid-column: 2;
    flex-direction: row;
    align-items: baseline;
    gap: 10px;
  }
}
</style>
