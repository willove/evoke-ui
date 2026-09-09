/**
 * B 端格式化工具 — 与组件零耦合，可独立按需引入
 * import { formatNumber } from '@wil-works/evoke-business-ui'
 */

/** 补零 */
function pad(num, len = 2) {
  return String(Math.abs(num)).padStart(len, '0')
}

/**
 * 数字格式化：千分位 + 精度
 * @param {number} value
 * @param {{ precision?: number, separator?: string, decimalSeparator?: string }} [options]
 * @returns {string} 非法输入原样返回 String(value)
 */
export function formatNumber(value, options = {}) {
  const { precision, separator = ',', decimalSeparator = '.' } = options
  if (typeof value !== 'number' || Number.isNaN(value) || !Number.isFinite(value)) {
    return String(value ?? '')
  }
  let [int, decimal] = String(value).split('.')
  if (precision != null) {
    decimal = value.toFixed(precision).split('.')[1]
  }
  if (separator) {
    int = int.replace(/\B(?=(\d{3})+(?!\d))/g, separator)
  }
  return decimal != null ? `${int}${decimalSeparator}${decimal}` : int
}

/**
 * 文件大小格式化：1536 → '1.5 KB'
 * @param {number} bytes
 * @param {{ precision?: number, base?: 1024 | 1000 }} [options]
 */
export function formatFileSize(bytes, options = {}) {
  const { precision = 1, base = 1024 } = options
  if (typeof bytes !== 'number' || Number.isNaN(bytes) || bytes < 0) return ''
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
  let idx = 0
  let size = bytes
  while (size >= base && idx < units.length - 1) {
    size /= base
    idx += 1
  }
  if (idx === 0) return `${Math.round(size)} B`
  return `${size.toFixed(precision)} ${units[idx]}`
}

/**
 * 日期格式化：pattern 支持 YYYY MM DD HH mm ss SSS
 * @param {Date | number | string} date
 * @param {string} [pattern='YYYY-MM-DD HH:mm:ss']
 */
export function formatDate(date, pattern = 'YYYY-MM-DD HH:mm:ss') {
  const d = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(d.getTime())) return ''
  return pattern
    .replace(/YYYY/g, String(d.getFullYear()))
    .replace(/MM/g, pad(d.getMonth() + 1))
    .replace(/DD/g, pad(d.getDate()))
    .replace(/HH/g, pad(d.getHours()))
    .replace(/mm/g, pad(d.getMinutes()))
    .replace(/ss/g, pad(d.getSeconds()))
    .replace(/SSS/g, pad(d.getMilliseconds(), 3))
}

/**
 * 相对时间：3 分钟前 / 2 小时前 / 刚刚 / 昨天 14:30 / 2026-01-05
 * @param {Date | number | string} date
 * @param {Date | number} [now=Date.now()]
 */
export function formatRelativeTime(date, now = Date.now()) {
  const d = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(d.getTime())) return ''
  const diff = now instanceof Date ? now.getTime() - d.getTime() : now - d.getTime()
  const abs = Math.abs(diff)
  const MIN = 60 * 1000
  const HOUR = 60 * MIN
  const DAY = 24 * HOUR
  if (abs < 30 * 1000) return '刚刚'
  if (abs < HOUR) return `${Math.round(abs / MIN)} 分钟前`
  if (abs < DAY) return `${Math.round(abs / HOUR)} 小时前`
  if (abs < 2 * DAY) return `昨天 ${pad(d.getHours())}:${pad(d.getMinutes())}`
  if (d.getFullYear() === new Date(now).getFullYear()) {
    return `${d.getMonth() + 1} 月 ${d.getDate()} 日`
  }
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/**
 * 时长格式化：秒 → '03:25' / '01:02:03'
 * @param {number} seconds
 * @param {{ forceHours?: boolean }} [options]
 */
export function formatDuration(seconds, options = {}) {
  const { forceHours = false } = options
  if (typeof seconds !== 'number' || Number.isNaN(seconds) || seconds < 0) return ''
  const total = Math.round(seconds)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return h > 0 || forceHours
    ? `${pad(h)}:${pad(m)}:${pad(s)}`
    : `${pad(m)}:${pad(s)}`
}

/**
 * 千分比/百分数：0.1234 → '12.34%'
 * @param {number} ratio
 * @param {{ precision?: number }} [options]
 */
export function formatPercent(ratio, options = {}) {
  const { precision = 2 } = options
  if (typeof ratio !== 'number' || Number.isNaN(ratio) || !Number.isFinite(ratio)) return ''
  return `${(ratio * 100).toFixed(precision)}%`
}
