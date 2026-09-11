<template>
  <div class="case-monitor">
    <header class="case-monitor__header">
      <div>
        <h3 class="case-monitor__title">服务监控屏</h3>
        <p class="case-monitor__sub">
          <span class="case-monitor__dot" :class="running ? 'is-live' : 'is-paused'" />
          {{ running ? '实时刷新中 · 每秒推进一个点' : '已暂停' }}
        </p>
      </div>
      <button class="case-btn" type="button" @click="toggle">{{ running ? '暂停刷新' : '开始刷新' }}</button>
    </header>

    <div class="case-monitor__grid">
      <div v-for="m in optionsList" :key="m.key" class="case-panel">
        <EvChart :options="m.value" :height="240" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { EvChart } from '@wil-works/evoke-charts'

// 窗口固定 30 个点；初始数据写死保证文档构建（SSR）与浏览器首屏一致
const WINDOW = 30
const INIT_TIMES = Array.from({ length: WINDOW }, (_, i) => {
  const s = 14 * 3600 + 29 * 60 + 31 + i
  return `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
})

function wave(base, amp, drift) {
  return Array.from({ length: WINDOW }, (_, i) =>
    Math.round(base + amp * Math.sin(i / 3) + drift * i + (i % 5) * (amp / 12)),
  )
}

const buffers = reactive({
  qps: {
    labels: [...INIT_TIMES],
    series: [
      { name: '入口', data: wave(4200, 380, 12), showSymbol: false },
      { name: '出口', data: wave(3600, 320, 10), showSymbol: false },
    ],
  },
  rt: {
    labels: [...INIT_TIMES],
    series: [{ name: '平均响应', data: wave(86, 18, -0.4), showSymbol: false }],
  },
  cpu: {
    labels: [...INIT_TIMES],
    series: [{ name: 'CPU', data: wave(46, 12, 0.15), showSymbol: false }],
  },
  mem: {
    labels: [...INIT_TIMES],
    series: [{ name: '内存', data: wave(63, 6, 0.05), showSymbol: false }],
  },
})

function buildOptions(key, title) {
  return {
    type: key === 'rt' || key === 'mem' ? 'area' : 'line',
    title,
    connectGroup: 'monitor',
    labels: buffers[key].labels,
    series: buffers[key].series,
    xAxis: { interval: 5, formatter: (t) => t.slice(3) },
    dataZoom: { enabled: true, start: 0, end: 100, mouseWheel: true },
    legend: { show: true },
  }
}

const optionsList = computed(() => [
  { key: 'qps', value: buildOptions('qps', 'QPS（次/秒）') },
  { key: 'rt', value: buildOptions('rt', '平均响应（ms）') },
  { key: 'cpu', value: buildOptions('cpu', 'CPU 使用率（%）') },
  { key: 'mem', value: buildOptions('mem', '内存使用率（%）') },
])

const running = ref(false)
let timer = null

function nowLabel() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

/** 挂载后把初始窗口换成真实当前时间的连续 30 秒，避免演示里的时间轴与访客时钟对不上 */
function resetLabelsToNow() {
  const total = (h, m, s) => h * 3600 + m * 60 + s
  const now = new Date()
  const base = total(now.getHours(), now.getMinutes(), now.getSeconds()) - WINDOW + 1
  const labelAt = (sec) => {
    const s = ((sec % 86400) + 86400) % 86400
    return `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  }
  Object.values(buffers).forEach((b) => {
    b.labels = Array.from({ length: WINDOW }, (_, i) => labelAt(base + i))
  })
}

function tick() {
  const t = nowLabel()
  // 随机游走 + 轻微均值回复：amp 是单步摆幅，base 是回归中枢
  const walk = (seriesList, amps, bases) => {
    seriesList.forEach((s, i) => {
      const last = s.data[s.data.length - 1]
      const next = Math.max(0, Math.round(last + (bases[i] - last) * 0.06 + (Math.random() - 0.5) * 2 * amps[i]))
      s.data.push(next)
      s.data.shift()
    })
  }
  buffers.qps.labels.push(t)
  buffers.qps.labels.shift()
  walk(buffers.qps.series, [220, 190], [4200, 3600])
  buffers.rt.labels.push(t)
  buffers.rt.labels.shift()
  walk(buffers.rt.series, [7], [82])
  buffers.cpu.labels.push(t)
  buffers.cpu.labels.shift()
  walk(buffers.cpu.series, [4.5], [46])
  buffers.mem.labels.push(t)
  buffers.mem.labels.shift()
  walk(buffers.mem.series, [1.6], [63])
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
.case-monitor {
  padding: 20px;
  border: 1px solid var(--ev-app-card-border);
  border-radius: 12px;
  background: var(--ev-bg-color);
}
.case-monitor__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}
.case-monitor__title {
  margin: 0;
  font-size: 17px;
  color: var(--ev-text-color-primary);
}
.case-monitor__sub {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--ev-text-color-secondary);
}
.case-monitor__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.case-monitor__dot.is-live {
  background: var(--ev-color-success);
  animation: case-monitor-pulse 1.2s ease-in-out infinite;
}
.case-monitor__dot.is-paused {
  background: var(--ev-text-color-tertiary, var(--ev-border-color-dark));
}
@keyframes case-monitor-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
}
.case-btn {
  padding: 7px 16px;
  border: 1px solid var(--ev-border-color-dark);
  border-radius: 6px;
  background: var(--ev-color-primary);
  color: #fff;
  font-size: 13px;
  cursor: pointer;
  transition: opacity 0.15s;
}
.case-btn:hover {
  opacity: 0.88;
}
.case-monitor__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
  gap: 12px;
}
.case-panel {
  padding: 8px 10px;
  border: 1px solid var(--ev-app-card-border);
  border-radius: 10px;
  background: var(--ev-bg-color-overlay);
}
</style>
