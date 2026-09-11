<template>
  <div
    class="eb-picker-panel eb-date-range-picker"
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
        <!-- datetimerange：双时间头 -->
        <div v-if="showTime" class="eb-date-range-picker__time-header">
          <div class="eb-date-range-picker__editors-wrap is-left">
            <div class="eb-date-range-picker__time-picker-wrap">
              <input class="eb-date-picker__editor" :value="startText" readonly />
            </div>
            <div class="eb-date-range-picker__time-picker-wrap">
              <button
                type="button"
                class="eb-date-picker__editor eb-date-picker__time-btn"
                @click="activeTimePanel = activeTimePanel === 'left' ? null : 'left'"
              >{{ startTimeText }}</button>
            </div>
          </div>
          <eb-icon name="arrow-right" class="eb-date-range-picker__time-header-icon" />
          <div class="eb-date-range-picker__editors-wrap is-right">
            <div class="eb-date-range-picker__time-picker-wrap">
              <input class="eb-date-picker__editor" :value="endText" readonly />
            </div>
            <div class="eb-date-range-picker__time-picker-wrap">
              <button
                type="button"
                class="eb-date-picker__editor eb-date-picker__time-btn"
                @click="activeTimePanel = activeTimePanel === 'right' ? null : 'right'"
              >{{ endTimeText }}</button>
            </div>
          </div>
        </div>

        <!-- 左面板 -->
        <div class="eb-picker-panel__content eb-date-range-picker__content is-left">
          <div class="eb-date-range-picker__header">
            <button
              type="button"
              class="eb-picker-panel__icon-btn eb-date-picker__prev-btn d-arrow-left"
              :aria-label="t('datepicker.prevYear')"
              @click="prevYear('left')"
            >
              <eb-icon name="d-arrow-left" />
            </button>
            <button
              v-if="type !== 'monthrange'"
              type="button"
              class="eb-picker-panel__icon-btn eb-date-picker__prev-btn arrow-left"
              :aria-label="t('datepicker.prevMonth')"
              @click="prevMonth('left')"
            >
              <eb-icon name="arrow-left" />
            </button>
            <div>{{ leftLabel }}</div>
          </div>
          <basic-date-table
            v-if="type !== 'monthrange'"
            :view-month="leftDate"
            :range="true"
            :min-date="rangeMin"
            :max-date="rangeMax"
            :selecting="selecting"
            :disabled-date="disabledDate"
            @pick="handleRangePick"
            @hover="handleHover"
          />
          <basic-month-table
            v-else
            :view-year="leftDate"
            :range="true"
            :min-date="rangeMin"
            :max-date="rangeMax"
            :selecting="selecting"
            :disabled-date="disabledDate"
            @pick="handleRangeMonthPick"
          />
        </div>

        <!-- 右面板 -->
        <div class="eb-picker-panel__content eb-date-range-picker__content is-right">
          <div class="eb-date-range-picker__header">
            <div>{{ rightLabel }}</div>
            <button
              v-if="type !== 'monthrange'"
              type="button"
              class="eb-picker-panel__icon-btn eb-date-picker__next-btn arrow-right"
              :aria-label="t('datepicker.nextMonth')"
              @click="nextMonth('right')"
            >
              <eb-icon name="arrow-right" />
            </button>
            <button
              type="button"
              class="eb-picker-panel__icon-btn eb-date-picker__next-btn d-arrow-right"
              :aria-label="t('datepicker.nextYear')"
              @click="nextYear('right')"
            >
              <eb-icon name="d-arrow-right" />
            </button>
          </div>
          <basic-date-table
            v-if="type !== 'monthrange'"
            :view-month="rightDate"
            :range="true"
            :min-date="rangeMin"
            :max-date="rangeMax"
            :selecting="selecting"
            :disabled-date="disabledDate"
            @pick="handleRangePick"
            @hover="handleHover"
          />
          <basic-month-table
            v-else
            :view-year="rightDate"
            :range="true"
            :min-date="rangeMin"
            :max-date="rangeMax"
            :selecting="selecting"
            :disabled-date="disabledDate"
            @pick="handleRangeMonthPick"
          />
        </div>

        <!-- 时间滚轮（datetimerange） -->
        <div
          v-if="activeTimePanel"
          class="eb-date-picker__time-dropdown"
          :class="activeTimePanel === 'right' ? 'is-right' : 'is-left'"
        >
          <time-panel
            :model-value="activeTimePanel === 'left' ? startTimeValue : endTimeValue"
            @pick="handleTimePick"
            @confirm="activeTimePanel = null"
            @cancel="activeTimePanel = null"
          />
        </div>
      </div>
    </div>

    <!-- datetimerange footer -->
    <div v-if="showTime" class="eb-picker-panel__footer">
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
 * PanelDateRange — 区间面板（daterange/datetimerange/monthrange）
 * 首击定起点（calendar-change），次击定终点 pick([start, end])；
 * selecting 时 hover 预览区间；unlink-panels 双面板独立翻页
 */
import { computed, ref, watch } from 'vue'
import EbIcon from '../icon/index.vue'
import BasicDateTable from './basic-date-table.vue'
import BasicMonthTable from './basic-month-table.vue'
import TimePanel from './time-panel.vue'
import { dayjs, applyDefaultTime } from './utils'
import { useLocale } from '../../composables/useLocale'

defineOptions({ name: 'EbPanelDateRange' })

const props = defineProps({
  type: { type: String, default: 'daterange' },
  /** [start, end]（dayjs|null） */
  value: { type: Array, default: () => [null, null] },
  defaultValue: { type: Object, default: null },
  /** datetimerange 默认时间 [HH:mm:ss, HH:mm:ss] */
  defaultTime: { type: Array, default: () => [] },
  disabledDate: { type: Function, default: null },
  shortcuts: { type: Array, default: null },
  unlinkPanels: { type: Boolean, default: false },
})

const emit = defineEmits(['pick', 'confirm', 'shortcut', 'calendar-change'])

const { t } = useLocale()

const showTime = computed(() => props.type === 'datetimerange')

const leftDate = ref(dayjs().startOf('month'))
const rightDate = ref(dayjs().add(1, 'month').startOf('month'))
const minDate = ref(null)
const maxDate = ref(null)
const selecting = ref(false)
const hoverDate = ref(null)
const activeTimePanel = ref(null)

// ─── 值同步/视图初始化 ───
watch(
  () => props.value,
  ([s, e]) => {
    minDate.value = s || null
    maxDate.value = e || null
    selecting.value = false
    const base = s || props.defaultValue || dayjs()
    leftDate.value = base.startOf('month')
    rightDate.value = (e || base.add(1, 'month')).startOf('month')
  },
  { immediate: true }
)

const rangeMin = computed(() => minDate.value)
const rangeMax = computed(() => (selecting.value ? hoverDate.value : maxDate.value))

const leftLabel = computed(() => `${leftDate.value.year()} 年 ${leftDate.value.month() + 1} 月`)
const rightLabel = computed(() => `${rightDate.value.year()} 年 ${rightDate.value.month() + 1} 月`)

const startText = computed(() => (minDate.value ? minDate.value.format('YYYY-MM-DD') : ''))
const endText = computed(() => (maxDate.value ? maxDate.value.format('YYYY-MM-DD') : ''))
const startTimeText = computed(() => {
  if (!minDate.value) return props.defaultTime?.[0] || dayjs().format('HH:mm:ss')
  return minDate.value.format('HH:mm:ss')
})
const endTimeText = computed(() => {
  if (!maxDate.value) return props.defaultTime?.[1] || dayjs().format('HH:mm:ss')
  return maxDate.value.format('HH:mm:ss')
})
const startTimeValue = computed(() => (minDate.value ? minDate.value.toDate() : new Date()))
const endTimeValue = computed(() => (maxDate.value ? maxDate.value.toDate() : new Date()))

// ─── 导航（未 unlink 时左右联动） ───
function prevYear(side) {
  if (side === 'left') {
    leftDate.value = leftDate.value.subtract(1, 'year')
    if (!props.unlinkPanels) rightDate.value = leftDate.value.add(1, 'month')
  } else {
    rightDate.value = rightDate.value.subtract(1, 'year')
  }
}

function nextYear(side) {
  if (side === 'left') {
    leftDate.value = leftDate.value.add(1, 'year')
    if (!props.unlinkPanels) rightDate.value = leftDate.value.add(1, 'month')
  } else {
    rightDate.value = rightDate.value.add(1, 'year')
  }
}

function prevMonth(side) {
  if (side === 'left') {
    leftDate.value = leftDate.value.subtract(1, 'month')
    if (!props.unlinkPanels) rightDate.value = leftDate.value.add(1, 'month')
  } else {
    rightDate.value = rightDate.value.subtract(1, 'month')
  }
}

function nextMonth(side) {
  if (side === 'left') {
    leftDate.value = leftDate.value.add(1, 'month')
    if (!props.unlinkPanels) rightDate.value = leftDate.value.add(1, 'month')
  } else {
    rightDate.value = rightDate.value.add(1, 'month')
  }
}

// ─── 选择流程 ───
function handleHover(d) {
  if (selecting.value) hoverDate.value = d
}

function unitOfCompare() {
  return props.type === 'monthrange' ? 'month' : 'day'
}

function handleRangePick(d) {
  pickRange(d, 'day')
}

function handleRangeMonthPick(m) {
  pickRange(m, 'month')
}

function pickRange(date, unit) {
  if (!selecting.value) {
    minDate.value = unit === 'month' ? date.startOf('month') : date
    maxDate.value = null
    selecting.value = true
    hoverDate.value = null
    emit('calendar-change', minDate.value.toDate(), null)
    return
  }
  if (date.isBefore(minDate.value, unit)) {
    // 早于起点：重新开始
    minDate.value = unit === 'month' ? date.startOf('month') : date
    maxDate.value = null
    hoverDate.value = null
    emit('calendar-change', minDate.value.toDate(), null)
    return
  }
  maxDate.value = unit === 'month' ? date.endOf('month') : date
  selecting.value = false
  hoverDate.value = null
  // default-time：为区间两端补时间（datetimerange 常用）
  if (props.defaultTime?.length) {
    minDate.value = applyDefaultTime(minDate.value, props.defaultTime[0])
    maxDate.value = applyDefaultTime(maxDate.value, props.defaultTime[1])
  }
  emit('calendar-change', minDate.value.toDate(), maxDate.value.toDate())
  emit('pick', [minDate.value, maxDate.value])
}

function handleTimePick(date) {
  const d = dayjs(date)
  if (activeTimePanel.value === 'left' && minDate.value) {
    minDate.value = minDate.value.hour(d.hour()).minute(d.minute()).second(d.second())
  } else if (activeTimePanel.value === 'right' && maxDate.value) {
    maxDate.value = maxDate.value.hour(d.hour()).minute(d.minute()).second(d.second())
  }
}

/** 确认时同步草稿到 pick（时间可能已调整） */
function confirmPick() {
  if (minDate.value && maxDate.value) {
    emit('pick', [minDate.value, maxDate.value])
  }
}

defineExpose({ confirmPick })
</script>
