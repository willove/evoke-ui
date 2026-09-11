<template>
  <div class="eb-calendar" :class="{ 'eb-calendar--year': currentMode === 'year' }">
    <!-- 头部 -->
    <div class="eb-calendar__header">
      <slot name="header" :data="headerData">
        <div class="eb-calendar__title">{{ headerData.title }}</div>
        <div class="eb-calendar__nav">
          <button type="button" class="eb-calendar__nav-btn" :disabled="isPrevDisabled" aria-label="上个月" @click="goPrev">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button type="button" class="eb-calendar__nav-btn eb-calendar__nav-btn--today" @click="goToday">今天</button>
          <button type="button" class="eb-calendar__nav-btn" :disabled="isNextDisabled" aria-label="下个月" @click="goNext">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </slot>
    </div>

    <!-- 月视图 -->
    <div v-if="currentMode === 'month'" class="eb-calendar__body">
      <div class="eb-calendar__weekdays">
        <div v-for="wd in weekdayLabels" :key="wd" class="eb-calendar__weekday">{{ wd }}</div>
      </div>

      <div class="eb-calendar__grid">
        <div
          v-for="(cell, idx) in calendarCells"
          :key="idx"
          class="eb-calendar__cell"
          :class="{
            'is-other-month': !cell.isCurrentMonth,
            'is-today': cell.isToday,
            'is-selected': isSelected(cell.dateObj),
            'is-disabled': isDisabled(cell.dateObj),
            'is-in-range': isInRange(cell.dateObj),
          }"
          @click="handleCellClick(cell)"
        >
          <div class="eb-calendar__cell-day">{{ cell.day }}</div>
          <div v-if="cell.events.length > 0" class="eb-calendar__cell-events">
            <slot name="date-cell" :data="cell">
              <div
                v-for="evt in cell.events.slice(0, 3)"
                :key="evt.id ?? evt.content"
                class="eb-calendar__cell-event"
                :class="[`is-type-${evt.type || 'default'}`, evt.class]"
                @click.stop="emit('event-click', evt, cell)"
              >
                {{ evt.content }}
              </div>
              <div v-if="cell.events.length > 3" class="eb-calendar__cell-event eb-calendar__cell-event--more">
                +{{ cell.events.length - 3 }} 更多
              </div>
            </slot>
          </div>
          <slot v-else name="date-cell" :data="cell" />
        </div>
      </div>
    </div>

    <!-- 年视图 -->
    <div v-else class="eb-calendar__year-grid">
      <div v-for="m in 12" :key="m" class="eb-calendar__year-month" @click="switchToMonth(m)">
        <div class="eb-calendar__year-month-label">{{ monthLabels[m - 1] }}</div>
        <div class="eb-calendar__year-mini-grid">
          <div v-for="wd in ['一', '二', '三', '四', '五', '六', '日']" :key="wd" class="eb-calendar__year-mini-weekday">
            {{ wd }}
          </div>
          <div
            v-for="(day, didx) in yearMiniDays(m)"
            :key="didx"
            class="eb-calendar__year-mini-day"
            :class="{
              'is-other-month': !day.isCurrentMonth,
              'is-today': day.isToday,
              'has-event': hasEventsOnDate(day.date),
            }"
          >
            {{ day.day }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * EbCalendar — 日历
 * 月视图（事件条 + date-cell 插槽）/ 年视图迷你格；firstDayOfWeek、range、disabledDate；
 * emits: update:modelValue / select / panel-change / event-click
 */
import { ref, computed, watch } from 'vue'

defineOptions({ name: 'EbCalendar' })

const props = defineProps({
  modelValue: { type: Date, default: undefined },
  mode: {
    type: String,
    default: 'month',
    validator: (v) => ['month', 'year'].includes(v),
  },
  events: { type: Array, default: () => [] },
  disabledDate: { type: Function, default: undefined },
  firstDayOfWeek: {
    type: Number,
    default: 1,
    validator: (v) => [0, 1].includes(v),
  },
  range: { type: Array, default: undefined },
  weekdays: { type: Array, default: undefined },
  titleFormat: { type: Function, default: undefined },
})

const emit = defineEmits(['update:modelValue', 'select', 'panel-change', 'event-click'])

// ══════ 当前状态 ══════
const displayDate = ref(props.modelValue ? new Date(props.modelValue) : new Date())
const currentMode = ref(props.mode)

watch(
  () => props.modelValue,
  (val) => {
    if (val) displayDate.value = new Date(val)
  },
)
watch(
  () => props.mode,
  (val) => {
    currentMode.value = val
  },
)

// ══════ 工具函数 ══════
function formatDateStr(year, month, day) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function sameDay(d1, d2) {
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate()
}

// ══════ 默认周标签 ══════
const monthLabels = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
const defaultWeekdays = ['一', '二', '三', '四', '五', '六', '日']
const weekdayLabels = computed(() => {
  if (props.weekdays) return props.weekdays
  if (props.firstDayOfWeek === 0) return ['日', '一', '二', '三', '四', '五', '六']
  return defaultWeekdays
})

const headerData = computed(() => {
  const y = displayDate.value.getFullYear()
  const m = displayDate.value.getMonth() + 1
  const title = props.titleFormat ? props.titleFormat(y, m) : `${y}年${m}月`
  return {
    title,
    year: y,
    month: m,
    mode: currentMode.value,
    prev: goPrev,
    next: goNext,
    today: goToday,
    setMode: (mode) => {
      currentMode.value = mode
    },
  }
})

// ══════ 导航 ══════
function goPrev() {
  const d = new Date(displayDate.value)
  if (currentMode.value === 'year') d.setFullYear(d.getFullYear() - 1)
  else d.setMonth(d.getMonth() - 1)
  displayDate.value = d
  emit('select', new Date(d), { source: 'header' })
  emitPanelChange()
}

function goNext() {
  const d = new Date(displayDate.value)
  if (currentMode.value === 'year') d.setFullYear(d.getFullYear() + 1)
  else d.setMonth(d.getMonth() + 1)
  displayDate.value = d
  emit('select', new Date(d), { source: 'header' })
  emitPanelChange()
}

function goToday() {
  displayDate.value = new Date()
  emit('update:modelValue', new Date())
  emit('select', new Date(), { source: 'header' })
  emitPanelChange()
}

function switchMode(mode) {
  currentMode.value = mode
}

function switchToMonth(month) {
  const d = new Date(displayDate.value)
  d.setMonth(month - 1)
  displayDate.value = d
  currentMode.value = 'month'
  emit('select', new Date(d), { source: 'header' })
  emitPanelChange()
}

function emitPanelChange() {
  const d = displayDate.value
  emit('panel-change', { year: d.getFullYear(), month: d.getMonth() + 1 })
}

const isPrevDisabled = computed(() => false)
const isNextDisabled = computed(() => false)

function isDisabled(date) {
  return props.disabledDate ? props.disabledDate(date) : false
}

function isSelected(date) {
  return !!props.modelValue && sameDay(date, new Date(props.modelValue))
}

function isInRange(date) {
  if (!props.range || props.range.length !== 2) return false
  const [start, end] = props.range
  const t = date.getTime()
  return t >= new Date(start).setHours(0, 0, 0, 0) && t <= new Date(end).setHours(0, 0, 0, 0)
}

function getEventsForDate(dateStr) {
  return props.events.filter((e) => e.date === dateStr)
}

function hasEventsOnDate(dateStr) {
  return props.events.some((e) => e.date === dateStr)
}

// ══════ 月视图格子 ══════
const calendarCells = computed(() => {
  const year = displayDate.value.getFullYear()
  const month = displayDate.value.getMonth()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const cells = []
  const firstDay = new Date(year, month, 1)
  const firstDow = firstDay.getDay()
  const offset = props.firstDayOfWeek === 1 ? (firstDow === 0 ? 6 : firstDow - 1) : firstDow

  // 从本月第一天往前推 offset 天，铺满 6*7
  for (let i = 0; i < 42; i++) {
    const cellDate = new Date(year, month, 1 - offset + i)
    cellDate.setHours(0, 0, 0, 0)
    const day = cellDate.getDate()
    const dateStr = formatDateStr(cellDate.getFullYear(), cellDate.getMonth() + 1, day)
    const isCurrentMonth = cellDate.getMonth() === month
    const isToday = cellDate.getTime() === today.getTime()
    cells.push({
      day,
      date: dateStr,
      isCurrentMonth,
      isToday,
      events: getEventsForDate(dateStr),
      dateObj: new Date(cellDate),
    })
  }
  return cells
})

// ══════ 年视图迷你格 ══════
function yearMiniDays(month) {
  const year = displayDate.value.getFullYear()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)
  const totalDays = lastDay.getDate()
  const firstDow = firstDay.getDay()
  const offset = props.firstDayOfWeek === 1 ? (firstDow === 0 ? 6 : firstDow - 1) : firstDow

  const days = []
  for (let i = 0; i < offset; i++) {
    days.push({ day: 0, date: '', isCurrentMonth: false, isToday: false })
  }
  for (let d = 1; d <= totalDays; d++) {
    const dateStr = formatDateStr(year, month, d)
    const cellDate = new Date(year, month - 1, d)
    cellDate.setHours(0, 0, 0, 0)
    days.push({
      day: d,
      date: dateStr,
      isCurrentMonth: true,
      isToday: cellDate.getTime() === today.getTime(),
    })
  }
  return days
}

// ══════ 点击处理 ══════
function handleCellClick(cell) {
  if (isDisabled(cell.dateObj)) return
  emit('update:modelValue', new Date(cell.dateObj))
  emit('select', new Date(cell.dateObj), { source: 'cell' })
}

defineExpose({ prev: goPrev, next: goNext, today: goToday, setMode: switchMode, mode: currentMode })
</script>

<style src="./style.css"></style>
