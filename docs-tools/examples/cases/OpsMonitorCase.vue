<template>
  <!-- 案例：运维监控台 —— 顶部工具区 + 三向停靠（服务/指标/事件）+ 大盘画布 + 折叠 + Toast -->
  <div class="case-ops">
    <et-workbench
      v-model:layout="layout"
      :default-layout="DEFAULT_LAYOUT"
      persist-key="case-ops-layout"
      @layout-corrupted="onCorrupted"
    >
      <template #titlebar>
        <et-title-bar title="运维监控台" doc-title="prod-cluster" @window-control="onWindowControl" />
      </template>

      <template #toolbar>
        <et-ribbon-bar
          v-model="activeTab"
          v-model:collapsed="collapsed"
          :schema="RIBBON_SCHEMA"
          :registry="registry"
          :ctx="ctx"
          persist-key="case-ops-ribbon"
          @command="onCommand"
        />
        <div class="case-ops__aux">
          <span class="case-ops__pulse" :class="auto ? 'is-on' : 'is-off'" />
          <span>{{ auto ? '自动刷新 · 3s' : '手动刷新' }}</span>
          <span class="case-ops__sep" />
          <span>{{ windowLabel }}</span>
          <span class="case-ops__spacer" />
          <span class="case-ops__tip">Ctrl+F1 折叠功能区</span>
        </div>
      </template>

      <template #panel="{ panel }">
        <et-scroll-area v-if="panel.id === 'services'" direction="vertical" class="case-ops__panel">
          <button
            v-for="s in SERVICES"
            :key="s.id"
            type="button"
            class="case-ops__service"
            :class="{ 'is-active': s.id === serviceId }"
            @click="selectService(s.id)"
          >
            <span class="case-ops__state" :class="`case-ops__state--${s.state}`" />
            <span class="case-ops__service-name">{{ s.name }}</span>
            <span class="case-ops__service-meta">{{ s.instances }} 实例</span>
          </button>
        </et-scroll-area>

        <et-scroll-area v-else-if="panel.id === 'metrics'" direction="vertical" class="case-ops__panel">
          <div v-for="m in metrics" :key="m.key" class="case-ops__metric">
            <div class="case-ops__metric-head">
              <span>{{ m.label }}</span>
              <strong :class="{ 'is-warn': m.warn }">{{ m.display }}</strong>
            </div>
            <div class="case-ops__bar">
              <span class="case-ops__bar-fill" :class="{ 'is-warn': m.warn }" :style="{ width: `${m.percent}%` }" />
            </div>
          </div>
        </et-scroll-area>

        <et-scroll-area v-else direction="vertical" class="case-ops__panel">
          <et-empty-state
            v-if="!visibleEvents.length"
            icon="inbox"
            title="时间窗内没有事件"
            desc="切服务，或手动刷一次。"
            action-label="手动刷新"
            @action="onCommand('refresh')"
          />
          <button
            v-for="e in visibleEvents"
            :key="e.id"
            type="button"
            class="case-ops__event"
            :class="{ 'is-active': e.id === eventId }"
            @click="eventId = e.id"
          >
            <span class="case-ops__event-time">{{ e.time }}</span>
            <span class="case-ops__level" :class="`case-ops__level--${e.level}`">{{ LEVEL_TEXT[e.level] }}</span>
            <span class="case-ops__event-msg">{{ e.message }}</span>
          </button>
        </et-scroll-area>
      </template>

      <et-theme-bridge />
      <main class="case-ops__canvas">
        <div class="case-ops__cards" :class="{ 'is-compact': compact }">
          <div v-for="c in cards" :key="c.key" class="case-ops__card">
            <span class="case-ops__card-label">{{ c.label }}</span>
            <strong class="case-ops__card-value">{{ c.value }}</strong>
            <span class="case-ops__card-delta" :class="`case-ops__card-delta--${c.tone}`">{{ c.delta }}</span>
          </div>
        </div>

        <div class="case-ops__detail">
          <template v-if="selectedEvent">
            <div class="case-ops__detail-head">
              <span class="case-ops__level" :class="`case-ops__level--${selectedEvent.level}`">{{ LEVEL_TEXT[selectedEvent.level] }}</span>
              <span>{{ selectedEvent.time }}</span>
              <span>{{ serviceName(selectedEvent.service) }}</span>
            </div>
            <p class="case-ops__detail-msg">{{ selectedEvent.message }}</p>
            <p class="case-ops__detail-trace">{{ selectedEvent.trace }}</p>
          </template>
          <p v-else class="case-ops__none">选一条事件看详情</p>
        </div>
      </main>

      <template #statusbar>
        <et-status-bar :items="statusItems" zoom="" @item-click="onStatusClick" />
      </template>
    </et-workbench>

    <et-toast v-model="toast.open" :message="toast.message" :type="toast.type" :duration="2200" />
  </div>
</template>

<script setup>
/**
 * 案例：运维监控台
 *
 * 刷新与时间窗是命令（工具区唯一入口），停靠树持久化，折叠由功能区自己管。
 * 指标与事件是产品内容的最小替身：数值由 step 推演（可复现，不用随机数），
 * 自动刷新开着时每 3s 走一次与手动刷新完全相同的路径。
 */
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { createCommandRegistry } from '@wil-works/evoke-tools-ui/runtime'

const WINDOWS = [
  { id: '15m', label: '近 15 分钟', factor: 0.35 },
  { id: '1h', label: '近 1 小时', factor: 1 },
  { id: '24h', label: '近 24 小时', factor: 8.4 },
]
const SERVICES = [
  { id: 'api', name: 'api-gateway', state: 'ok', instances: 6 },
  { id: 'db', name: 'orders-db', state: 'warn', instances: 3 },
  { id: 'cache', name: 'session-cache', state: 'ok', instances: 4 },
  { id: 'queue', name: 'job-queue', state: 'down', instances: 2 },
]
const STATE_TEXT = { ok: '心跳正常', warn: '1 个实例抖动', down: '1 个实例离线' }
const LEVEL_TEXT = { error: '错误', warn: '警告', info: '信息' }
const BASE = {
  api: { cpu: 42, mem: 58, qps: 1240, err: 0.4, p95: 210 },
  db: { cpu: 71, mem: 76, qps: 320, err: 1.8, p95: 480 },
  cache: { cpu: 21, mem: 34, qps: 5400, err: 0.1, p95: 46 },
  queue: { cpu: 35, mem: 46, qps: 860, err: 2.6, p95: 330 },
}
/** 指标抖动序列：按 step 取，截图与断言可复现 */
const JITTER = [0, 4, -3, 6, -5, 2, 7, -2]
const EVENTS = [
  { id: 'ev1', service: 'api', level: 'error', message: '上游 502 连续 3 次', time: '10:02:11', trace: 'trace 8f2c1a · 重试已耗尽' },
  { id: 'ev2', service: 'api', level: 'info', message: '灰度发布完成', time: '10:04:40', trace: 'release v1.8.2 · 6 实例' },
  { id: 'ev3', service: 'db', level: 'warn', message: '慢查询 820ms', time: '10:06:03', trace: 'trace 41d0be · orders 表' },
  { id: 'ev4', service: 'db', level: 'error', message: '连接池耗尽', time: '10:07:52', trace: 'trace 9c73ff · pool 32/32' },
  { id: 'ev5', service: 'cache', level: 'info', message: '命中率回升至 0.96', time: '10:09:18', trace: 'trace 2a91c4' },
]
/** 刷新时按序补的事件（循环取，不用随机） */
const EVENT_POOL = [
  { level: 'info', message: '健康检查通过' },
  { level: 'warn', message: '实例抖动 1 次' },
  { level: 'error', message: '上游超时 504' },
  { level: 'info', message: '配置热更新生效' },
]
const DEFAULT_LAYOUT = {
  docks: [
    {
      id: 'left',
      side: 'left',
      panels: [{ id: 'services', title: '服务列表', size: 190, min: 150, max: 280 }],
    },
    {
      id: 'right',
      side: 'right',
      panels: [{ id: 'metrics', title: '指标', size: 250, min: 200, max: 360 }],
    },
    {
      id: 'bottom',
      side: 'bottom',
      panels: [{ id: 'events', title: '事件流', size: 150, min: 110, max: 300 }],
    },
  ],
  maximized: null,
}

const layout = ref(JSON.parse(JSON.stringify(DEFAULT_LAYOUT)))
const serviceId = ref('api')
const windowId = ref('1h')
const auto = ref(false)
const compact = ref(false)
const step = ref(0)
const events = ref([...EVENTS])
const eventId = ref('ev1')
const activeTab = ref('monitor')
const collapsed = ref(false)
const toast = reactive({ open: false, message: '', type: 'success' })
let timer = null
let seq = 0

const service = computed(() => SERVICES.find((s) => s.id === serviceId.value))
const windowLabel = computed(() => WINDOWS.find((w) => w.id === windowId.value)?.label ?? '')
const jitter = computed(() => JITTER[step.value % JITTER.length])
const visibleEvents = computed(() => events.value.filter((e) => e.service === serviceId.value))
const selectedEvent = computed(() => visibleEvents.value.find((e) => e.id === eventId.value) ?? null)

const metrics = computed(() => {
  const b = BASE[serviceId.value]
  const j = jitter.value
  const factor = WINDOWS.find((w) => w.id === windowId.value)?.factor ?? 1
  const cpu = b.cpu + j
  const mem = b.mem + Math.round(j / 2)
  const qps = Math.round(b.qps * factor)
  const err = Math.round((b.err + j / 10) * 10) / 10
  return [
    { key: 'cpu', label: 'CPU 使用率', display: `${cpu}%`, percent: share(cpu), warn: cpu >= 70 },
    { key: 'mem', label: '内存占用', display: `${mem}%`, percent: share(mem), warn: mem >= 75 },
    { key: 'qps', label: '请求速率', display: `${qps} req/s`, percent: share((qps / 6000) * 100), warn: false },
    { key: 'err', label: '错误率', display: `${err.toFixed(1)}%`, percent: share(err * 12), warn: err >= 2 },
  ]
})

const cards = computed(() => {
  const b = BASE[serviceId.value]
  const j = jitter.value
  const online = service.value.state === 'down' ? Math.max(1, service.value.instances - 1) : service.value.instances
  const err = b.err + j / 10
  const p95 = b.p95 + j * 6
  return [
    { key: 'instances', label: '在线实例', value: `${online} / ${service.value.instances}`, delta: STATE_TEXT[service.value.state], tone: service.value.state === 'ok' ? 'flat' : 'down' },
    { key: 'qps', label: '请求速率', value: `${Math.round(b.qps * (WINDOWS.find((w) => w.id === windowId.value)?.factor ?? 1))} req/s`, delta: windowLabel.value, tone: 'up' },
    { key: 'err', label: '错误率', value: `${err.toFixed(1)}%`, delta: err >= 2 ? '高于 2% 阈值' : '低于 2% 阈值', tone: err >= 2 ? 'down' : 'flat' },
    { key: 'p95', label: 'P95 延迟', value: `${p95} ms`, delta: '阈值 500 ms', tone: p95 >= 500 ? 'down' : 'flat' },
  ]
})

/** 大盘上下文：喂给 registry.state —— enabled/active 全从这一份推演 */
const ctx = computed(() => ({
  auto: auto.value,
  window: windowId.value,
  compact: compact.value,
  service: serviceId.value,
  hasEvents: visibleEvents.value.length > 0,
  hasEvent: Boolean(selectedEvent.value),
}))

const statusItems = computed(() => [
  { key: 'cluster', label: '集群', value: 'prod-cluster' },
  { key: 'service', label: '服务', value: service.value.name },
  { key: 'window', label: '时间窗', value: windowLabel.value },
  { key: 'auto', label: '自动刷新', value: auto.value ? '开' : '关' },
  { key: 'events', label: '事件', value: String(visibleEvents.value.length) },
])

const registry = createCommandRegistry()
registry.registerAll([
  { id: 'refresh', title: '手动刷新', icon: 'refresh', group: '刷新',
    surfaces: ['toolbar', 'palette'], run: () => doRefresh('手动') },
  { id: 'auto-refresh', title: '自动刷新', icon: 'repeat', group: '刷新',
    surfaces: ['toolbar', 'palette'], active: (c) => c.auto, run: () => toggleAuto() },
  { id: 'window-15m', title: '近 15 分钟', icon: 'time', group: '时间窗',
    surfaces: ['toolbar', 'palette'], active: (c) => c.window === '15m', run: () => setWindow('15m') },
  { id: 'window-1h', title: '近 1 小时', icon: 'time', group: '时间窗',
    surfaces: ['toolbar', 'palette'], active: (c) => c.window === '1h', run: () => setWindow('1h') },
  { id: 'window-24h', title: '近 24 小时', icon: 'time', group: '时间窗',
    surfaces: ['toolbar', 'palette'], active: (c) => c.window === '24h', run: () => setWindow('24h') },
  { id: 'toggle-compact', title: '紧凑指标卡', icon: 'layout-grid', group: '显示',
    surfaces: ['toolbar', 'palette'], active: (c) => c.compact, run: () => { compact.value = !compact.value } },
  { id: 'ack-event', title: '确认事件', icon: 'check-circle', group: '处置',
    surfaces: ['toolbar', 'palette'], enabled: (c) => c.hasEvent, run: () => ackEvent() },
  { id: 'clear-events', title: '清空事件流', icon: 'eraser', group: '处置',
    surfaces: ['toolbar', 'palette'], enabled: (c) => c.hasEvents, run: () => clearEvents() },
])

const RIBBON_SCHEMA = [
  {
    key: 'monitor',
    type: 'tab',
    label: '监控',
    children: [
      { key: 'g-refresh', type: 'group', label: '刷新', children: [
        { key: 'i-refresh', type: 'item', command: 'refresh', grid: { rowSpan: 2 } },
        { key: 'i-auto', type: 'item', command: 'auto-refresh', grid: { rowSpan: 2 } },
      ] },
      { key: 'g-window', type: 'group', label: '时间窗', children: [
        { key: 'i-15m', type: 'item', command: 'window-15m', grid: { rowSpan: 2 } },
        { key: 'i-1h', type: 'item', command: 'window-1h', grid: { rowSpan: 2 } },
        { key: 'i-24h', type: 'item', command: 'window-24h', grid: { rowSpan: 2 } },
      ] },
      { key: 'g-view', type: 'group', label: '显示', children: [
        { key: 'i-compact', type: 'item', command: 'toggle-compact', grid: { rowSpan: 2 } },
      ] },
    ],
  },
  {
    key: 'events',
    type: 'tab',
    label: '事件',
    children: [
      { key: 'g-handle', type: 'group', label: '处置', children: [
        { key: 'i-ack', type: 'item', command: 'ack-event', grid: { rowSpan: 2 } },
        { key: 'i-clear', type: 'item', command: 'clear-events', grid: { rowSpan: 2 } },
      ] },
    ],
  },
]

function share(value) {
  return Math.max(2, Math.min(100, Math.round(value)))
}

function serviceName(id) {
  return SERVICES.find((s) => s.id === id)?.name ?? id
}

function stamp() {
  const m = 10 + Math.floor(seq / 60)
  const s = (seq * 7) % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}:00`
}

function selectService(id) {
  serviceId.value = id
  eventId.value = ''
  toast.type = 'info'
  toast.message = `切换服务：${serviceName(id)}`
  toast.open = true
}

function setWindow(id) {
  windowId.value = id
  toast.type = 'info'
  toast.message = `时间窗：${WINDOWS.find((w) => w.id === id)?.label ?? ''}`
  toast.open = true
}

function pushEvent(event) {
  const list = [...events.value, event]
  const same = list.filter((e) => e.service === event.service)
  // 单个服务只留最近 6 条：事件流是「最近发生了什么」，不是审计台账
  events.value = same.length > 6 ? list.filter((e) => e.id !== same[0].id) : list
}

function doRefresh(kind) {
  step.value += 1
  seq += 1
  const pool = EVENT_POOL[seq % EVENT_POOL.length]
  const event = {
    id: `gen-${seq}`,
    service: serviceId.value,
    level: pool.level,
    message: pool.message,
    time: stamp(),
    trace: `trace ${(seq * 7919 % 0xfffff).toString(16)} · ${kind}刷新`,
  }
  pushEvent(event)
  eventId.value = event.id
  toast.type = pool.level === 'error' ? 'warn' : 'success'
  toast.message = `${kind}刷新 · ${service.value.name}`
  toast.open = true
}

function toggleAuto() {
  auto.value = !auto.value
  toast.type = 'success'
  toast.message = auto.value ? '自动刷新已开启（3s）' : '自动刷新已关闭'
  toast.open = true
}

function ackEvent() {
  const target = selectedEvent.value
  if (!target) return
  events.value = events.value.map((e) =>
    e.id === target.id ? { ...e, level: 'info', message: `已确认 · ${e.message}` } : e,
  )
  toast.type = 'success'
  toast.message = `已确认：${target.message}`
  toast.open = true
}

function clearEvents() {
  events.value = events.value.filter((e) => e.service !== serviceId.value)
  eventId.value = ''
  toast.type = 'success'
  toast.message = `${service.value.name} 的事件已清空`
  toast.open = true
}

function onCommand(id) {
  registry.run(id, ctx.value)
}

function onStatusClick(key) {
  toast.type = 'info'
  toast.message = `状态栏条目：${key}`
  toast.open = true
}

function onWindowControl(name) {
  toast.type = 'info'
  toast.message = `窗口控制：${name}`
  toast.open = true
}

function onCorrupted() {
  toast.type = 'warn'
  toast.message = '布局已重置为默认'
  toast.open = true
}

watch(serviceId, () => {
  eventId.value = visibleEvents.value[0]?.id ?? ''
})

watch(auto, (on) => {
  clearInterval(timer)
  timer = null
  if (on) timer = setInterval(() => doRefresh('自动'), 3000)
})

onBeforeUnmount(() => clearInterval(timer))
</script>

<style scoped>
.case-ops {
  height: 460px;
  border: 1px solid var(--eb-border-color-lighter);
  border-radius: var(--eb-border-radius-base, 4px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.case-ops :deep(.et-workbench) {
  height: 100%;
}
.case-ops__aux {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 26px;
  padding: 0 var(--et-space-band-inline);
  border-top: 1px solid var(--eb-border-color-lighter);
  background: var(--eb-bg-color);
  font-size: 12px;
  color: var(--eb-text-color-secondary);
}
.case-ops__pulse {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.case-ops__pulse.is-on {
  background: var(--eb-color-success);
}
.case-ops__pulse.is-off {
  background: var(--eb-fill-color-darker);
}
.case-ops__sep {
  width: 1px;
  height: 12px;
  background: var(--eb-border-color);
}
.case-ops__spacer {
  flex: 1;
}
.case-ops__tip {
  color: var(--eb-text-color-placeholder);
}
.case-ops__panel {
  display: block;
  height: 100%;
  padding: var(--et-space-inline) var(--et-space-block);
}
.case-ops__service {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 6px 8px;
  border: none;
  border-radius: var(--eb-border-radius-base, 4px);
  background: transparent;
  text-align: left;
  font-size: var(--eb-font-size-sm);
  color: var(--eb-text-color-regular);
  cursor: pointer;
}
.case-ops__service:hover {
  background: var(--eb-fill-color-light);
}
.case-ops__service.is-active {
  color: var(--eb-color-primary);
  background: var(--eb-color-primary-light-9);
}
.case-ops__state {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.case-ops__state--ok {
  background: var(--eb-color-success);
}
.case-ops__state--warn {
  background: var(--eb-color-warning);
}
.case-ops__state--down {
  background: var(--eb-color-danger);
}
.case-ops__service-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.case-ops__service-meta {
  flex-shrink: 0;
  font-size: 11px;
  color: var(--eb-text-color-placeholder);
}
.case-ops__metric {
  padding: 6px 8px;
}
.case-ops__metric-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  font-size: 12.5px;
  color: var(--eb-text-color-secondary);
}
.case-ops__metric-head strong {
  font-family: var(--eb-font-family-code, monospace);
  font-weight: 600;
  color: var(--eb-text-color-primary);
}
.case-ops__metric-head strong.is-warn {
  color: var(--eb-color-danger);
}
.case-ops__bar {
  height: 6px;
  margin-top: 6px;
  border-radius: 3px;
  background: var(--eb-fill-color);
  overflow: hidden;
}
.case-ops__bar-fill {
  display: block;
  height: 100%;
  border-radius: 3px;
  background: var(--eb-color-primary);
}
.case-ops__bar-fill.is-warn {
  background: var(--eb-color-danger);
}
.case-ops__event {
  display: flex;
  align-items: baseline;
  gap: 8px;
  width: 100%;
  padding: 5px 8px;
  border: none;
  border-radius: var(--eb-border-radius-base, 4px);
  background: transparent;
  text-align: left;
  font-size: 12.5px;
  color: var(--eb-text-color-regular);
  cursor: pointer;
}
.case-ops__event:hover {
  background: var(--eb-fill-color-light);
}
.case-ops__event.is-active {
  background: var(--eb-color-primary-light-9);
}
.case-ops__event-time {
  flex-shrink: 0;
  font-family: var(--eb-font-family-code, monospace);
  color: var(--eb-text-color-secondary);
}
.case-ops__level {
  flex-shrink: 0;
  padding: 0 6px;
  border-radius: 3px;
  font-size: 11px;
}
.case-ops__level--error {
  color: var(--eb-color-danger);
  background: var(--eb-color-danger-light-9);
}
.case-ops__level--warn {
  color: var(--eb-color-warning);
  background: var(--eb-color-warning-light-9);
}
.case-ops__level--info {
  color: var(--eb-text-color-secondary);
  background: var(--eb-fill-color);
}
.case-ops__event-msg {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.case-ops__canvas {
  height: 100%;
  padding: 12px 14px;
  overflow: auto;
  background: var(--eb-bg-color);
}
.case-ops__cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}
.case-ops__cards.is-compact {
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}
.case-ops__card {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 12px;
  border: 1px solid var(--eb-border-color-lighter);
  border-radius: var(--eb-border-radius-base, 4px);
  background: var(--eb-bg-color);
}
.case-ops__cards.is-compact .case-ops__card {
  padding: 7px 9px;
}
.case-ops__card-label {
  font-size: 12px;
  color: var(--eb-text-color-secondary);
}
.case-ops__card-value {
  font-size: 20px;
  font-weight: 650;
  color: var(--eb-text-color-primary);
}
.case-ops__cards.is-compact .case-ops__card-value {
  font-size: 16px;
}
.case-ops__card-delta {
  font-size: 11.5px;
  color: var(--eb-text-color-placeholder);
}
.case-ops__card-delta--up {
  color: var(--eb-color-success);
}
.case-ops__card-delta--down {
  color: var(--eb-color-danger);
}
.case-ops__detail {
  margin-top: 10px;
  padding: 10px 12px;
  border: 1px solid var(--eb-border-color-lighter);
  border-radius: var(--eb-border-radius-base, 4px);
  background: var(--eb-fill-color-light);
}
.case-ops__detail-head {
  display: flex;
  align-items: baseline;
  gap: 10px;
  font-size: 12px;
  color: var(--eb-text-color-secondary);
}
.case-ops__detail-msg {
  margin: 6px 0 2px;
  font-size: 13.5px;
  color: var(--eb-text-color-primary);
}
.case-ops__detail-trace,
.case-ops__none {
  margin: 0;
  font-family: var(--eb-font-family-code, monospace);
  font-size: 11.5px;
  color: var(--eb-text-color-placeholder);
}
</style>