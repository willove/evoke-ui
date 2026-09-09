/**
 * DatePicker 内部工具 — dayjs 封装（值解析/格式化/视图计算，纯函数可测）
 */
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import 'dayjs/locale/zh-cn'

dayjs.extend(customParseFormat)
dayjs.locale('zh-cn')

export { dayjs }

/** 各 type 的默认展示格式 */
export const DEFAULT_FORMATS = {
  date: 'YYYY-MM-DD',
  dates: 'YYYY-MM-DD',
  datetime: 'YYYY-MM-DD HH:mm:ss',
  datetimerange: 'YYYY-MM-DD HH:mm:ss',
  daterange: 'YYYY-MM-DD',
  month: 'YYYY-MM',
  monthrange: 'YYYY-MM',
  year: 'YYYY',
  week: 'YYYY-MM-DD',
}

/** 是否区间 type */
export function isRangeType(type) {
  return /range$/.test(type)
}

/** 是否含时间选择（面板需确认按钮/时间头） */
export function hasTime(type) {
  return /^datetime/.test(type)
}

/** 外部值 → dayjs | [dayjs, dayjs]（无效归 null） */
export function parseAsDayjs(value, valueFormat) {
  if (value === undefined || value === null || value === '') return null
  if (dayjs.isDayjs(value)) return value
  const d = valueFormat
    ? dayjs(value, valueFormat)
    : value instanceof Date
      ? dayjs(value)
      : dayjs(value)
  return d.isValid() ? d : null
}

/** 单值 → dayjs 或 null */
export function toSingleDayjs(value, valueFormat) {
  return parseAsDayjs(value, valueFormat)
}

/** 区间值 → [dayjs|null, dayjs|null] */
export function toRangeDayjs(value, valueFormat) {
  if (Array.isArray(value)) {
    return [parseAsDayjs(value[0], valueFormat), parseAsDayjs(value[1], valueFormat)]
  }
  return [null, null]
}

/** dayjs → 对外值（value-format 存在时输出字符串） */
export function toOutValue(d, valueFormat) {
  if (!d) return null
  if (valueFormat) return d.format(valueFormat)
  return d.toDate()
}

export function formatDisplay(d, format) {
  return d ? d.format(format) : ''
}

/** 同一天（含时间清零比较） */
export function isSameDay(a, b) {
  return !!a && !!b && a.year() === b.year() && a.month() === b.month() && a.date() === b.date()
}

export function isSameMonth(a, b) {
  return !!a && !!b && a.year() === b.year() && a.month() === b.month()
}

export function isSameYear(a, b) {
  return !!a && !!b && a.year() === b.year()
}

/** default-time 字符串（HH:mm:ss）应用到 dayjs */
export function applyDefaultTime(d, timeStr) {
  if (!d || !timeStr) return d
  const t = dayjs(timeStr, 'HH:mm:ss')
  if (!t.isValid()) return d
  return d.hour(t.hour()).minute(t.minute()).second(t.second())
}

/** 生成 6×7 日期网格（以周日为一列起点） */
export function getDateCells(viewMonth) {
  const first = viewMonth.startOf('month')
  // dayjs day(): 0=周日
  const offset = first.day()
  const start = first.subtract(offset, 'day')
  const cells = []
  for (let i = 0; i < 42; i++) {
    cells.push(start.add(i, 'day'))
  }
  return cells
}
