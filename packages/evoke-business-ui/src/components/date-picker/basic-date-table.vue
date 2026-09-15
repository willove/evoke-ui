<template>
  <table ref="tableRef" class="eb-date-table" cellspacing="0" cellpadding="0" role="grid" @keydown="handleKeydown">
    <tbody>
      <tr role="row">
        <th v-for="w in weekHeaders" :key="w" scope="col" role="columnheader">{{ w }}</th>
      </tr>
      <tr v-for="(row, ri) in rows" :key="ri" class="eb-date-table__row" role="row">
        <td
          v-for="cell in row"
          :key="cell.key"
          role="gridcell"
          :class="cellClass(cell)"
          :tabindex="isActive(cell) ? 0 : -1"
          :aria-selected="isSelected(cell)"
          :aria-disabled="isDisabled(cell) ? 'true' : undefined"
          :aria-current="isSameDay(cell.day, today) ? 'date' : undefined"
          :aria-label="cell.day.format('YYYY-MM-DD')"
          @click="handleClick(cell)"
          @mouseenter="handleMouseEnter(cell)"
        >
          <div class="eb-date-table-cell">
            <span class="eb-date-table-cell__text">{{ cell.day.date() }}</span>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script setup>
/**
 * BasicDateTable — 日期网格（.eb-date-table / .eb-date-table-cell 结构类）
 * 单选高亮 current；区间：start-date/end-date/in-range（selecting 时 maxDate 为 hover 预览）
 * 键盘：方向键移动一天 / ±7 天跨周，Home/End 周首尾，PageUp/PageDown 翻月（Shift 翻年），
 * Enter/Space 选中；跨出视图月时 emit view-change 让面板翻页；禁用日自动顺延跳过
 */
import { computed, nextTick, ref, watch } from 'vue'
import { dayjs, getDateCells, isSameDay } from './utils'
import { useLocale } from '../../composables/useLocale'

defineOptions({ name: 'EbBasicDateTable' })

const props = defineProps({
  /** 视图月份（dayjs） */
  viewMonth: { type: Object, required: true },
  /** 单选选中（dayjs|null） */
  selected: { type: Object, default: null },
  /** 区间起点（dayjs|null） */
  minDate: { type: Object, default: null },
  /** 区间终点（dayjs|null；选择中作为 hover 预览） */
  maxDate: { type: Object, default: null },
  /** 区间选择中（第二击前） */
  selecting: { type: Boolean, default: false },
  range: { type: Boolean, default: false },
  disabledDate: { type: Function, default: null },
})

const emit = defineEmits(['pick', 'hover', 'view-change'])

const { locale } = useLocale()

const tableRef = ref(null)

const weekHeaders = computed(() => {
  const weeks = locale.value?.eb?.datepicker?.weeks || {}
  // dayjs zh-cn 周日起始：日一二三四五六
  const keys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
  return keys.map((k, i) => weeks[k] || `${i}`)
})

const cells = computed(() =>
  getDateCells(props.viewMonth).map((d) => ({ day: d, key: d.format('YYYY-MM-DD') }))
)

const rows = computed(() => {
  const out = []
  for (let i = 0; i < 6; i++) out.push(cells.value.slice(i * 7, i * 7 + 7))
  return out
})

const today = dayjs()

// ─── 键盘巡历 ───
/** 活动日（roving tabindex 落点） */
const activeDate = ref(null)
/** 自身键盘导航触发的翻月：面板 viewDate 回流时不再重置活动日 */
const navLock = ref(false)

function isDisabledDay(d) {
  return props.disabledDate ? !!props.disabledDate(d.toDate()) : false
}

/** 视图月内默认活动日：选中 > 今天 > 1 号；禁用则向后顺延 */
function defaultActive(vm) {
  let base = null
  if (props.selected && props.selected.isSame(vm, 'month')) base = props.selected
  else if (today.isSame(vm, 'month')) base = today
  else base = vm.date(1)
  for (let i = 0; i < 31 && isDisabledDay(base); i++) base = base.add(1, 'day')
  return base
}

watch(
  () => props.viewMonth,
  (vm) => {
    if (navLock.value) {
      navLock.value = false
      return
    }
    activeDate.value = defaultActive(vm)
  },
  { immediate: true }
)

function isActive(cell) {
  return activeDate.value != null && isSameDay(cell.day, activeDate.value)
}

function isSelected(cell) {
  if (props.range) {
    const min = props.minDate
    const max = props.maxDate
    if (min && max) return isSameDay(cell.day, min) || isSameDay(cell.day, max)
    return false
  }
  return !!(props.selected && isSameDay(cell.day, props.selected))
}

function cellClass(cell) {
  const cls = []
  if (cell.day.month() !== props.viewMonth.month()) {
    cls.push(cell.day.isBefore(props.viewMonth, 'month') ? 'prev-month' : 'next-month')
  } else {
    cls.push('available')
  }
  if (isSameDay(cell.day, today)) cls.push('today')
  if (isDisabled(cell)) {
    cls.push('disabled')
    return cls
  }
  if (props.range) {
    const min = props.minDate
    const max = props.maxDate
    if (min && max) {
      const lo = min.isBefore(max, 'day') ? min : max
      const hi = min.isBefore(max, 'day') ? max : min
      if (cell.day.isAfter(lo, 'day') && cell.day.isBefore(hi, 'day')) cls.push('in-range')
      if (isSameDay(cell.day, lo)) cls.push('start-date', 'current')
      if (isSameDay(cell.day, hi)) cls.push('end-date', 'current')
    } else if (min && props.selecting && isSameDay(cell.day, min)) {
      cls.push('start-date', 'end-date')
    }
  } else if (props.selected && isSameDay(cell.day, props.selected)) {
    cls.push('current')
  }
  return cls
}

function isDisabled(cell) {
  return isDisabledDay(cell.day)
}

/** 沿 stepFn 前进，跳过禁用日（最多试探 400 步防死循环） */
function shiftActive(stepFn) {
  let next = stepFn(activeDate.value)
  for (let i = 0; i < 400 && isDisabledDay(next); i++) next = stepFn(next)
  return next
}

function moveActive(stepFn) {
  if (activeDate.value == null) return
  const next = shiftActive(stepFn)
  if (next.isSame(activeDate.value, 'day')) return
  activeDate.value = next
  if (!next.isSame(props.viewMonth, 'month')) {
    // 跨月：面板翻页导致网格重渲，下一帧把焦点带回新活动日
    navLock.value = true
    emit('view-change', next.startOf('month'))
    nextTick(() => focusActive())
  }
}

function handleKeydown(e) {
  const stepFns = {
    ArrowLeft: (d) => d.subtract(1, 'day'),
    ArrowRight: (d) => d.add(1, 'day'),
    ArrowUp: (d) => d.subtract(7, 'day'),
    ArrowDown: (d) => d.add(7, 'day'),
    PageUp: (d) => (e.shiftKey ? d.subtract(1, 'year') : d.subtract(1, 'month')),
    PageDown: (d) => (e.shiftKey ? d.add(1, 'year') : d.add(1, 'month')),
    Home: (d) => d.startOf('week'),
    End: (d) => d.endOf('week').startOf('day'),
  }
  const stepFn = stepFns[e.key]
  if (stepFn) {
    e.preventDefault()
    moveActive(stepFn)
    return
  }
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    if (activeDate.value != null && !isDisabledDay(activeDate.value)) {
      emit('pick', activeDate.value)
    }
  }
}

function handleClick(cell) {
  if (isDisabled(cell)) return
  activeDate.value = cell.day
  emit('pick', cell.day)
}

function handleMouseEnter(cell) {
  if (isDisabled(cell)) return
  emit('hover', cell.day)
}

/** 键盘入口：把焦点落到当前活动日单元格（打开面板后调用） */
function focusActive() {
  tableRef.value?.querySelector('td[tabindex="0"]')?.focus()
}

defineExpose({ focusActive })
</script>
