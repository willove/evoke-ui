<template>
  <table class="ev-date-table" cellspacing="0" cellpadding="0">
    <tbody>
      <tr>
        <th v-for="w in weekHeaders" :key="w">{{ w }}</th>
      </tr>
      <tr v-for="(row, ri) in rows" :key="ri" class="ev-date-table__row">
        <td
          v-for="cell in row"
          :key="cell.key"
          :class="cellClass(cell)"
          @click="handleClick(cell)"
          @mouseenter="handleMouseEnter(cell)"
        >
          <div class="ev-date-table-cell">
            <span class="ev-date-table-cell__text">{{ cell.day.date() }}</span>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script setup>
/**
 * BasicDateTable — 日期网格（.ev-date-table / .ev-date-table-cell 结构类）
 * 单选高亮 current；区间：start-date/end-date/in-range（selecting 时 maxDate 为 hover 预览）
 */
import { computed } from 'vue'
import { dayjs, getDateCells, isSameDay } from './utils'
import { useLocale } from '../../composables/useLocale'

defineOptions({ name: 'EvBasicDateTable' })

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

const emit = defineEmits(['pick', 'hover'])

const { locale } = useLocale()

const weekHeaders = computed(() => {
  const weeks = locale.value?.ev?.datepicker?.weeks || {}
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

function isDisabled(cell) {
  return props.disabledDate ? !!props.disabledDate(cell.day.toDate()) : false
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

function handleClick(cell) {
  if (isDisabled(cell)) return
  emit('pick', cell.day)
}

function handleMouseEnter(cell) {
  if (isDisabled(cell)) return
  emit('hover', cell.day)
}
</script>
