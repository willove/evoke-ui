<template>
  <table class="ev-month-table" cellspacing="0" cellpadding="0">
    <tbody>
      <tr v-for="(row, ri) in rows" :key="ri">
        <td
          v-for="cell in row"
          :key="cell.key"
          :class="cellClass(cell)"
          @click="handleClick(cell)"
        >
          <div class="ev-date-table-cell">
            <span class="ev-date-table-cell__text">{{ cell.text }}</span>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script setup>
/**
 * BasicMonthTable — 月份网格（12 个月，3 行 × 4 列，.ev-month-table 结构类）
 */
import { computed } from 'vue'
import { dayjs, isSameMonth } from './utils'
import { useLocale } from '../../composables/useLocale'

defineOptions({ name: 'EvBasicMonthTable' })

const props = defineProps({
  /** 视图年份（dayjs，取 year） */
  viewYear: { type: Object, required: true },
  /** 单选选中（dayjs|null） */
  selected: { type: Object, default: null },
  minDate: { type: Object, default: null },
  maxDate: { type: Object, default: null },
  selecting: { type: Boolean, default: false },
  range: { type: Boolean, default: false },
  disabledDate: { type: Function, default: null },
})

const emit = defineEmits(['pick'])

const { locale } = useLocale()

const monthTexts = computed(() => {
  const months = locale.value?.ev?.datepicker?.months || {}
  const keys = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
  return keys.map((k, i) => months[k] || `${i + 1} 月`)
})

const cells = computed(() =>
  monthTexts.value.map((text, i) => ({
    month: props.viewYear.month(i),
    text,
    key: `${props.viewYear.year()}-${i}`,
  }))
)

const rows = computed(() => {
  const out = []
  for (let i = 0; i < 3; i++) out.push(cells.value.slice(i * 4, i * 4 + 4))
  return out
})

const today = dayjs()

function isDisabled(cell) {
  return props.disabledDate ? !!props.disabledDate(cell.month.endOf('month').toDate()) : false
}

function cellClass(cell) {
  const cls = []
  if (isSameMonth(cell.month, today)) cls.push('today')
  if (isDisabled(cell)) {
    cls.push('disabled')
    return cls
  }
  if (props.range) {
    const min = props.minDate
    const max = props.maxDate
    if (min && max) {
      const lo = min.isBefore(max, 'month') ? min : max
      const hi = min.isBefore(max, 'month') ? max : min
      if (cell.month.isAfter(lo, 'month') && cell.month.isBefore(hi, 'month')) cls.push('in-range')
      if (isSameMonth(cell.month, lo)) cls.push('start-date', 'current')
      if (isSameMonth(cell.month, hi)) cls.push('end-date', 'current')
    } else if (min && props.selecting && isSameMonth(cell.month, min)) {
      cls.push('start-date', 'end-date')
    }
  } else if (props.selected && isSameMonth(cell.month, props.selected)) {
    cls.push('current')
  }
  return cls
}

function handleClick(cell) {
  if (isDisabled(cell)) return
  emit('pick', cell.month)
}
</script>
