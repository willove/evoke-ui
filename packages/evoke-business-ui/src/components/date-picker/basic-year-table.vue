<template>
  <table class="ev-year-table" cellspacing="0" cellpadding="0">
    <tbody>
      <tr v-for="(row, ri) in rows" :key="ri">
        <td
          v-for="cell in row"
          :key="cell.key"
          :class="cellClass(cell)"
          @click="handleClick(cell)"
        >
          <div>
            <span class="cell">{{ cell.year }}</span>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script setup>
/**
 * BasicYearTable — 年份网格（十年视图：前十年灰格 + 10 年 + 后十年灰格，3 行 × 4 列）
 * .ev-year-table 结构类（td 文本使用 .cell）
 */
import { computed } from 'vue'
import { dayjs, isSameYear } from './utils'

defineOptions({ name: 'EvBasicYearTable' })

const props = defineProps({
  /** 视图年份（dayjs，取 year） */
  viewYear: { type: Object, required: true },
  selected: { type: Object, default: null },
  disabledDate: { type: Function, default: null },
})

const emit = defineEmits(['pick'])

const cells = computed(() => {
  const startYear = Math.floor(props.viewYear.year() / 10) * 10
  const list = []
  // 前十年灰格 + 10 年 + 后十年灰格 = 12 格
  for (let y = startYear - 1; y <= startYear + 10; y++) {
    let decade = 'current'
    if (y === startYear - 1) decade = 'prev-decade'
    else if (y === startYear + 10) decade = 'next-decade'
    list.push({ year: y, decade, key: String(y) })
  }
  return list
})

const rows = computed(() => {
  const out = []
  for (let i = 0; i < 3; i++) out.push(cells.value.slice(i * 4, i * 4 + 4))
  return out
})

const today = dayjs()

function cellOf(cell) {
  return props.viewYear.year(cell.year)
}

function isDisabled(cell) {
  return props.disabledDate ? !!props.disabledDate(cellOf(cell).endOf('year').toDate()) : false
}

function cellClass(cell) {
  const cls = []
  if (cell.decade !== 'current') cls.push(cell.decade)
  if (isSameYear(cellOf(cell), today)) cls.push('today')
  if (isDisabled(cell)) {
    cls.push('disabled')
    return cls
  }
  if (props.selected && isSameYear(cellOf(cell), props.selected)) cls.push('current')
  return cls
}

function handleClick(cell) {
  if (isDisabled(cell)) return
  emit('pick', cellOf(cell))
}
</script>
