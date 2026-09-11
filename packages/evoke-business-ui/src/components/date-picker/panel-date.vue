<template>
  <div
    class="eb-picker-panel eb-date-picker"
    :class="{ 'has-sidebar': !!shortcuts?.length, 'has-time': showTime }"
  >
    <!-- 快捷选项 -->
    <div v-if="shortcuts?.length" class="eb-picker-panel__sidebar">
      <button
        v-for="(sc, i) in shortcuts"
        :key="i"
        type="button"
        class="eb-picker-panel__shortcut"
        @click="emit('shortcut', sc)"
      >
        {{ sc.text }}
      </button>
    </div>

    <div class="eb-picker-panel__body-wrapper">
      <div class="eb-picker-panel__body">
        <!-- datetime：时间头 -->
        <div v-if="showTime" class="eb-date-picker__time-header">
          <span class="eb-date-picker__editor-wrap">
            <input
              class="eb-date-picker__editor"
              :value="dateText"
              readonly
            />
          </span>
          <span class="eb-date-picker__editor-wrap">
            <button
              type="button"
              class="eb-date-picker__editor eb-date-picker__time-btn"
              @click="timePanelVisible = !timePanelVisible"
            >
              {{ timeText }}
            </button>
          </span>
        </div>

        <!-- 头部导航 -->
        <div class="eb-date-picker__header eb-date-picker__header--bordered">
          <button
            type="button"
            class="eb-picker-panel__icon-btn eb-date-picker__prev-btn d-arrow-left"
            :aria-label="t('datepicker.prevYear')"
            @click="prevYear"
          >
            <eb-icon name="d-arrow-left" />
          </button>
          <button
            v-if="currentView === 'date'"
            type="button"
            class="eb-picker-panel__icon-btn eb-date-picker__prev-btn arrow-left"
            :aria-label="t('datepicker.prevMonth')"
            @click="prevMonth"
          >
            <eb-icon name="arrow-left" />
          </button>
          <span
            class="eb-date-picker__header-label"
            :class="{ active: currentView === 'year' }"
            @click="showYearView"
          >{{ yearLabel }}</span>
          <span
            v-if="currentView !== 'year'"
            class="eb-date-picker__header-label"
            :class="{ active: currentView === 'month' }"
            @click="showMonthView"
          >{{ monthLabel }}</span>
          <button
            v-if="currentView === 'date'"
            type="button"
            class="eb-picker-panel__icon-btn eb-date-picker__next-btn arrow-right"
            :aria-label="t('datepicker.nextMonth')"
            @click="nextMonth"
          >
            <eb-icon name="arrow-right" />
          </button>
          <button
            type="button"
            class="eb-picker-panel__icon-btn eb-date-picker__next-btn d-arrow-right"
            :aria-label="t('datepicker.nextYear')"
            @click="nextYear"
          >
            <eb-icon name="d-arrow-right" />
          </button>
        </div>

        <!-- 内容区 -->
        <div class="eb-picker-panel__content">
          <basic-date-table
            v-if="currentView === 'date'"
            :view-month="viewDate"
            :selected="pickedValue"
            :disabled-date="disabledDate"
            @pick="handleDatePick"
          />
          <basic-month-table
            v-else-if="currentView === 'month'"
            :view-year="viewDate"
            :selected="pickedValue"
            :disabled-date="disabledDate"
            @pick="handleMonthPick"
          />
          <basic-year-table
            v-else
            :view-year="viewDate"
            :selected="pickedValue"
            :disabled-date="disabledDate"
            @pick="handleYearPick"
          />
        </div>

        <!-- 时间滚轮 -->
        <div v-if="timePanelVisible" class="eb-date-picker__time-dropdown">
          <time-panel
            :model-value="timeValue"
            @pick="handleTimePick"
            @confirm="confirmTime"
            @cancel="timePanelVisible = false"
          />
        </div>
      </div>
    </div>

    <!-- datetime footer -->
    <div v-if="showTime" class="eb-picker-panel__footer">
      <button
        type="button"
        class="eb-picker-panel__btn eb-picker-panel__link-btn"
        @click="handleNow"
      >{{ t('datepicker.now') }}</button>
      <button
        type="button"
        class="eb-picker-panel__btn"
        @click="emit('confirm')"
      >{{ t('datepicker.confirm') }}</button>
    </div>
  </div>
</template>

<script setup>
/**
 * PanelDate — 单值面板（date/datetime/month/year）
 * 视图切换 date → month → year；datetime 带时间头 + footer（此刻/确定）
 * emit pick(dayjs)（含时间）；confirm → index 关闭
 */
import { computed, ref, watch } from 'vue'
import EbIcon from '../icon/index.vue'
import BasicDateTable from './basic-date-table.vue'
import BasicMonthTable from './basic-month-table.vue'
import BasicYearTable from './basic-year-table.vue'
import TimePanel from './time-panel.vue'
import { dayjs, applyDefaultTime } from './utils'
import { useLocale } from '../../composables/useLocale'

defineOptions({ name: 'EbPanelDate' })

const props = defineProps({
  type: { type: String, default: 'date' },
  /** 当前值（dayjs|null） */
  value: { type: Object, default: null },
  /** 空值时面板默认视图（dayjs|null） */
  defaultValue: { type: Object, default: null },
  /** datetime 默认时间 HH:mm:ss */
  defaultTime: { type: String, default: '' },
  disabledDate: { type: Function, default: null },
  shortcuts: { type: Array, default: null },
})

const emit = defineEmits(['pick', 'confirm', 'shortcut'])

const { t, locale } = useLocale()

const showTime = computed(() => props.type === 'datetime')

const viewDate = ref(dayjs())
const currentView = ref(props.type === 'month' ? 'month' : props.type === 'year' ? 'year' : 'date')
const timePanelVisible = ref(false)

// ─── 视图初始化/同步 ───
watch(
  () => props.value,
  (v) => {
    const base = v || props.defaultValue || dayjs()
    viewDate.value = base.startOf('month')
  },
  { immediate: true }
)

const yearLabel = computed(() => {
  if (currentView.value === 'year') {
    const startYear = Math.floor(viewDate.value.year() / 10) * 10
    return `${startYear} - ${startYear + 9}`
  }
  return `${viewDate.value.year()} ${t('datepicker.year')}`
})

const monthLabel = computed(() => {
  const months = locale.value?.eb?.datepicker?.months || {}
  const keys = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
  return months[keys[viewDate.value.month()]] || `${viewDate.value.month() + 1} 月`
})

// ─── 导航 ───
function prevYear() {
  if (currentView.value === 'year') viewDate.value = viewDate.value.subtract(10, 'year')
  else viewDate.value = viewDate.value.subtract(1, 'year')
}

function nextYear() {
  if (currentView.value === 'year') viewDate.value = viewDate.value.add(10, 'year')
  else viewDate.value = viewDate.value.add(1, 'year')
}

function prevMonth() {
  viewDate.value = viewDate.value.subtract(1, 'month')
}

function nextMonth() {
  viewDate.value = viewDate.value.add(1, 'month')
}

function showYearView() {
  currentView.value = 'year'
}

function showMonthView() {
  currentView.value = 'month'
}

// ─── 选中值 ───
/** 面板内草稿（datetime 模式连续选日期不关闭，时间跟随） */
const pickedValue = computed(() => props.value)

const dateText = computed(() =>
  pickedValue.value ? pickedValue.value.format('YYYY-MM-DD') : ''
)

const timeValue = computed(() => (pickedValue.value ? pickedValue.value.toDate() : new Date()))

const timeText = computed(() => {
  if (!pickedValue.value) {
    // 未选时按 defaultTime 展示
    if (props.defaultTime) return props.defaultTime
    return dayjs().format('HH:mm:ss')
  }
  return pickedValue.value.format('HH:mm:ss')
})

function handleDatePick(d) {
  if (showTime.value) {
    // 保留已有时间 / defaultTime
    const base = pickedValue.value
    let next = d.hour(base ? base.hour() : 0).minute(base ? base.minute() : 0).second(base ? base.second() : 0)
    if (!base && props.defaultTime) next = applyDefaultTime(next, props.defaultTime)
    emit('pick', next)
  } else {
    emit('pick', d.startOf('day'))
  }
}

function handleMonthPick(m) {
  if (props.type === 'month') {
    emit('pick', m.startOf('month'))
    return
  }
  // date/datetime：切到该月的日期视图
  viewDate.value = m.startOf('month')
  currentView.value = 'date'
}

function handleYearPick(y) {
  if (props.type === 'year') {
    emit('pick', y.startOf('year'))
    return
  }
  viewDate.value = y.startOf('year')
  currentView.value = 'month'
}

function handleTimePick(date) {
  const d = dayjs(date)
  const base = pickedValue.value || dayjs().startOf('day')
  emit('pick', base.hour(d.hour()).minute(d.minute()).second(d.second()))
}

function confirmTime() {
  timePanelVisible.value = false
}

function handleNow() {
  emit('pick', dayjs())
  emit('confirm')
}

defineExpose({
  /** 供外部（shortcut 后）重置视图 */
  resetView: () => {
    currentView.value = props.type === 'month' ? 'month' : props.type === 'year' ? 'year' : 'date'
  },
})
</script>
