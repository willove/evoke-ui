<template>
  <span class="comp-art" v-html="svg" aria-hidden="true"></span>
</template>

<script setup>
/**
 * CompArt — 组件总览简笔画
 * 设计规范：构图绘制在 72×48 内容网格（translate 24,24），viewBox "14 14 92 68"
 * （四周 10px 呼吸边，避免撑满显笨重）；描边统一 1.6~1.8 细线、浅灰；
 * 文本条为中浅灰；每个构图至多一处 BLUE 强调；元素间距 ≥4px 不重叠；
 * 描边一律最后画（压在填充之上保持边线完整）；颜色走 CSS 变量适配暗色。
 */
import { computed } from 'vue'

const props = defineProps({
  name: { type: String, default: '' },
})

// 统一色板（浅色回退值，暗色由 .comp-art 变量覆盖）
const GRAY = 'var(--art-gray, #C5CEDB)'
const BLUE = 'var(--art-blue, #175DFF)'
const SOFT = 'var(--art-soft, #EEF2F8)'
const DARK = 'var(--art-dark, #9AA6B8)'
const R = (x, y, w, h, o = {}) => {
  const { f = 'none', st = GRAY, sw = 1.8, rx = 4 } = o
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${f}"${st ? ` stroke="${st}" stroke-width="${sw}"` : ''}/>`
}
const C = (cx, cy, r, o = {}) => {
  const { f = 'none', st = GRAY, sw = 1.8 } = o
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${f}"${st ? ` stroke="${st}" stroke-width="${sw}"` : ''}/>`
}
const L = (x1, y1, x2, y2, o = {}) => {
  const { c = GRAY, w = 1.8, dash = '' } = o
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`
}
const P = (d, o = {}) => {
  const { c = GRAY, w = 1.8, f = 'none' } = o
  return `<path d="${d}" stroke="${c}" stroke-width="${w}" fill="${f}" stroke-linecap="round" stroke-linejoin="round"/>`
}
const bar = (x, y, w, h = 6, f = SOFT) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${f}"/>`
const wrap = (inner) => `<g transform="translate(24,24)">${inner}</g>`
const check = (x, y) => P(`M${x} ${y} l3.5 3.5 L${x + 9} ${y - 3.5}`, { c: '#fff', w: 1.8 })

const ARTS = {
  // ─── 业务组件 ───
  SearchFilter: wrap(
    `${bar(0, 4, 14, 6, DARK)}${R(20, 1, 52, 12)}
     ${bar(0, 22, 14, 6, DARK)}${R(20, 19, 52, 12)}
     ${R(20, 37, 26, 10, { f: BLUE, st: '', rx: 5 })}${L(27, 42, 39, 42, { c: '#fff', w: 1.8 })}
     ${bar(52, 39, 20, 6)}`,
  ),
  DataTable: wrap(
    `${bar(5, 3, 14, 5, DARK)}${bar(29, 3, 14, 5, DARK)}${bar(53, 3, 12, 5, DARK)}
     ${L(0, 12, 72, 12)}${L(0, 24, 72, 24)}${L(0, 35, 72, 35)}
     ${C(9, 18, 3)}${bar(16, 15.5, 16, 5)}${bar(38, 15.5, 14, 5, BLUE)}
     ${C(9, 29.5, 3)}${bar(16, 27, 20, 5)}${bar(44, 27, 12, 5)}
     ${C(9, 40.5, 3)}${bar(16, 38, 14, 5)}${bar(36, 38, 16, 5)}
     ${R(0, 0, 72, 46)}`,
  ),
  StatusTag: wrap(
    `${R(2, 14, 32, 20, { f: '#E8F7EE', st: '', rx: 10 })}${C(13, 24, 3.5, { f: '#22A45D', st: '' })}${bar(21, 21, 9, 6, '#8FD6AC')}
     ${R(38, 14, 32, 20, { f: '#FFF3E5', st: '', rx: 10 })}${C(49, 24, 3.5, { f: '#E67E17', st: '' })}${bar(57, 21, 9, 6, '#F2BC8A')}`,
  ),
  CellStack: wrap(`${bar(2, 13, 52, 8, DARK)}${bar(2, 28, 68, 6)}`),
  DetailDescriptions: wrap(
    `${bar(0, 2, 20, 7, DARK)}${bar(34, 2, 38, 7)}
     ${L(0, 16, 72, 16)}${bar(0, 22, 20, 6, DARK)}${bar(34, 22, 30, 6)}
     ${L(0, 35, 72, 35)}${bar(0, 41, 20, 6, DARK)}${bar(34, 41, 26, 6)}`,
  ),
  ImportExportPanel: wrap(
    `${R(6, 21, 60, 23)}
     ${P('M30 16 L36 7 L42 16 M36 7 L36 20', { c: BLUE })}
     ${L(14, 33, 58, 33, { dash: '4 4' })}${bar(22, 38, 28, 5)}`,
  ),
  AuditTimeline: wrap(
    `${L(8, 2, 8, 46, { w: 1.6 })}
     ${C(8, 6, 4, { f: BLUE, st: '' })}${bar(20, 3, 44, 6)}${bar(20, 12, 32, 5)}
     ${C(8, 24, 4)}${bar(20, 21, 48, 6)}${bar(20, 30, 30, 5)}
     ${C(8, 42, 4)}${bar(20, 39, 40, 6)}`,
  ),
  ColumnSettings: wrap(
    `${L(10, 0, 10, 48)}${L(34, 0, 34, 48, { dash: '4 4' })}${L(58, 0, 58, 48)}
     ${C(46, 24, 12, { f: 'var(--bd-bg-soft, #f7f8fa)', st: BLUE })}${C(46, 24, 4, { f: BLUE, st: '' })}
     ${P('M46 8 L46 14 M46 34 L46 40 M30 24 L36 24 M56 24 L62 24', { c: BLUE })}`,
  ),
  // ─── 通用 ───
  Button: wrap(`${R(4, 17, 64, 15, { f: BLUE, st: '', rx: 7.5 })}${L(22, 24.5, 50, 24.5, { c: '#fff', w: 2.2 })}`),
  Icon: wrap(
    `${C(12, 24, 10, { st: BLUE })}${P('M7.5 24 l3.2 3.2 L16.5 20.8', { c: BLUE })}
     ${C(36, 24, 10)}${P('M36 17.5 l2 4.6 5 .4 -3.8 3.3 1.1 4.9 -4.3 -2.6 -4.3 2.6 1.1 -4.9 -3.8 -3.3 5 -.4 Z', { w: 1.6 })}
     ${C(60, 24, 10)}${P('M55.5 24 a4.5 4.5 0 0 1 9 0 M55.5 24 h9', { w: 1.6 })}`,
  ),
  Tag: wrap(
    `${P('M8 13 L44 13 L63 24 L44 35 L8 35 Z', { c: BLUE })}
     ${C(17, 24, 3, { st: BLUE, w: 1.6 })}${bar(26, 21.5, 22, 5)}`,
  ),
  Text: wrap(`${bar(2, 9, 68, 8, DARK)}${bar(2, 24, 56, 6)}${bar(2, 36, 62, 6)}`),
  Link: wrap(
    `${bar(2, 20, 38, 7, BLUE)}
     ${L(2, 33, 40, 33, { c: BLUE, w: 1.6 })}
     ${P('M47 24 L68 24 M60 17 L68 24 L60 31', { c: BLUE })}`,
  ),
  Card: wrap(
    `${bar(10, 6, 20, 5, DARK)}${bar(10, 21, 48, 6)}${bar(10, 33, 38, 6)}
     ${R(4, 2, 64, 44)}`,
  ),
  Container: wrap(
    `${bar(5, 20, 10, 5)}${bar(5, 31, 10, 5)}${bar(27, 22, 38, 6)}${bar(27, 34, 30, 6)}
     ${R(0, 0, 72, 46)}
     ${L(0, 12, 72, 12)}${L(20, 12, 20, 46)}
     ${L(0, 12, 20, 12, { c: BLUE, w: 2.2 })}`,
  ),
  Row: wrap(`${R(2, 13, 20, 22, { f: SOFT, st: '' })}${R(26, 13, 20, 22, { f: BLUE, st: '' })}${R(50, 13, 20, 22, { f: SOFT, st: '' })}`),
  Col: wrap(`${R(25, 1, 22, 12, { f: SOFT, st: '' })}${R(25, 18, 22, 12, { f: BLUE, st: '' })}${R(25, 35, 22, 12, { f: SOFT, st: '' })}`),
  Space: wrap(
    `${R(0, 16, 22, 16, { f: SOFT, st: '' })}
     ${P('M29 24 L43 24 M38 19 L43 24 L38 29', { c: BLUE })}
     ${R(50, 16, 22, 16, { f: SOFT, st: '' })}`,
  ),
  Divider: wrap(
    `${R(0, 6, 30, 15, { f: SOFT, st: '' })}${R(42, 6, 30, 15, { f: SOFT, st: '' })}
     ${L(0, 36, 72, 36, { c: BLUE, w: 2.2 })}`,
  ),
  // ─── 数据录入 ───
  Input: wrap(
    `${bar(6, 22, 26, 5, DARK)}${L(58, 19, 58, 29, { c: BLUE, w: 1.8 })}${C(65, 24, 4)}
     ${R(0, 15, 72, 18)}`,
  ),
  Select: wrap(
    `${bar(11, 5, 24, 6, DARK)}${P('M57 6 L62 11 L67 6')}
     ${R(5, 0, 62, 16)}
     ${bar(11, 30, 30, 6)}${bar(11, 40, 24, 6, BLUE)}
     ${R(5, 23, 62, 24)}`,
  ),
  InputNumber: wrap(
    `${P('M13 24 L20 24', { c: BLUE, w: 2.2 })}${bar(28, 21, 16, 6, DARK)}
     ${P('M52 20 L52 28 M48 24 L56 24', { c: BLUE, w: 2.2 })}
     ${R(5, 14, 62, 20)}`,
  ),
  Radio: wrap(
    `${C(16, 24, 10)}${C(16, 24, 3.5, { f: GRAY, st: '' })}
     ${C(56, 24, 10, { st: BLUE })}${C(56, 24, 4.5, { f: BLUE, st: '' })}`,
  ),
  Checkbox: wrap(
    `${R(12, 14, 20, 20)}
     ${R(40, 14, 20, 20, { f: BLUE, st: BLUE })}${check(44, 24)}`,
  ),
  Switch: wrap(
    `${R(4, 14, 42, 20, { f: BLUE, st: '', rx: 10 })}${C(37, 24, 7, { f: '#fff', st: '' })}
     ${R(52, 15, 17, 18, { rx: 8.5 })}${C(60.5, 24, 5.5, { f: '#C9D2E0', st: '' })}`,
  ),
  DatePicker: wrap(
    `${bar(0, 1, 72, 10, SOFT)}
     ${bar(5, 3.5, 16, 5, DARK)}
     ${[0, 1, 2].map((r_) => [0, 1, 2, 3, 4].map((c_) => bar(6 + c_ * 13, 17 + r_ * 10, 8, 6, r_ === 1 && c_ === 2 ? BLUE : SOFT)).join('')).join('')}
     ${R(0, 1, 72, 46)}`,
  ),
  Rate: wrap(
    `${[0, 1, 2, 3, 4].map((i) => {
      const x = 4 + i * 13.5
      const d = `M${x + 6} 9 L${x + 8} 16 L${x + 15} 16 L${x + 9.5} 20.4 L${x + 11.5} 27.4 L${x + 6} 23.2 L${x + 0.5} 27.4 L${x + 2.5} 20.4 L${x - 3} 16 L${x + 4} 16 Z`
      return `<path d="${d}" fill="${i < 3 ? BLUE : SOFT}"/>`
    }).join('')}${bar(20, 38, 32, 6)}`,
  ),
  Slider: wrap(
    `${L(0, 20, 72, 20, { w: 3 })}${L(0, 20, 46, 20, { c: BLUE, w: 3 })}
     ${C(46, 20, 6.5, { f: '#fff', st: BLUE })}${bar(18, 36, 36, 6)}`,
  ),
  Upload: wrap(
    `${L(12, 27, 60, 27, { dash: '4 4' })}
     ${P('M28 20 L36 10 L44 20 M36 10 L36 25', { c: BLUE })}
     ${bar(18, 39, 36, 6)}
     ${R(4, 2, 64, 31)}`,
  ),
  Form: wrap(
    `${bar(0, 2, 18, 6, DARK)}${bar(0, 24, 18, 6, DARK)}
     ${L(24, 43, 36, 43, { c: '#E34D59', w: 1.8 })}
     ${P('M2 45 L6 39 L10 45 L14 39', { c: '#E34D59', w: 1.6 })}
     ${R(24, 0, 48, 13)}
     ${R(24, 22, 48, 13, { st: BLUE })}`,
  ),
  // ─── 数据展示 ───
  Table: wrap(
    `${bar(5, 3, 12, 5, DARK)}${bar(29, 3, 12, 5, DARK)}${bar(53, 3, 12, 5, DARK)}
     ${bar(5, 15, 14, 5)}${bar(29, 15, 14, 5, BLUE)}${bar(53, 15, 14, 5)}
     ${bar(5, 26, 12, 5)}${bar(29, 26, 12, 5)}${bar(5, 37, 14, 5)}${bar(29, 37, 10, 5)}
     ${L(0, 11, 72, 11)}${L(0, 22, 72, 22)}${L(0, 33, 72, 33)}
     ${L(24, 0, 24, 46)}${L(48, 0, 48, 46)}
     ${R(0, 0, 72, 46)}`,
  ),
  Descriptions: wrap(
    `${bar(0, 0, 28, 8, DARK)}
     ${L(0, 14, 72, 14)}${bar(0, 20, 20, 6, DARK)}${bar(40, 20, 30, 6)}
     ${L(0, 32, 72, 32)}${bar(0, 38, 20, 6, DARK)}${bar(40, 38, 26, 6)}`,
  ),
  Timeline: wrap(
    `${L(6, 0, 6, 46, { w: 1.6 })}
     ${C(6, 5, 4, { f: BLUE, st: '' })}${bar(16, 1, 44, 6)}
     ${C(6, 23, 4)}${bar(16, 19, 48, 6)}
     ${C(6, 41, 4)}${bar(16, 37, 34, 6)}`,
  ),
  Steps: wrap(
    `${L(15, 20, 29, 20, { c: BLUE, w: 2.2 })}
     ${L(44, 20, 56.5, 20)}
     ${bar(22, 38, 28, 5)}
     ${C(8, 20, 7.5, { st: BLUE })}${P('M4.8 20 L7 22.2 L11.4 17.6', { c: BLUE })}
     ${C(36, 20, 7.5, { st: BLUE })}${C(36, 20, 3, { f: BLUE, st: '' })}
     ${C(63.5, 20, 6.5)}`,
  ),
  Badge: wrap(
    `${bar(18, 22, 24, 5)}${bar(18, 32, 18, 5)}
     ${C(56, 14, 9, { f: '#E34D59', st: '' })}
     ${L(52, 14, 60, 14, { c: '#fff', w: 1.8 })}${L(56, 10, 56, 18, { c: '#fff', w: 1.8 })}
     ${R(12, 12, 38, 34, { rx: 6 })}`,
  ),
  Avatar: wrap(
    `${C(36, 14, 11)}
     ${P('M14 46 C14 33 23.5 28.5 36 28.5 C48.5 28.5 58 33 58 46', { w: 1.8 })}`,
  ),
  Collapse: wrap(
    `${P('M60 4 L64 6.5 L68 4', { w: 1.6 })}
     ${P('M60 21 L64 23.5 L68 21', { c: BLUE, w: 1.6 })}
     ${P('M60 38 L64 40.5 L68 38', { w: 1.6 })}
     ${R(0, 0, 72, 13, { rx: 3 })}
     ${R(0, 17, 72, 13, { st: BLUE, rx: 3 })}
     ${R(0, 34, 72, 13, { rx: 3 })}`,
  ),
  Empty: wrap(
    `${bar(16, 43, 40, 5)}
     ${P('M16 6 L12 28 Q12 35 20 35 L52 35 Q60 35 60 28 L56 6 Q56 0 48 0 L24 0 Q16 0 16 6 Z')}
     ${C(30, 17, 2, { f: GRAY, st: '' })}${C(42, 17, 2, { f: GRAY, st: '' })}
     ${P('M30 25 Q36 30 42 25')}`,
  ),
  // ─── 反馈 ───
  Message: wrap(
    `${L(38, 17, 58, 17)}${L(38, 25, 52, 25)}
     ${C(23, 21, 4, { st: BLUE })}${P('M19.5 21 L23 24.5 L29 17', { c: BLUE, w: 1.7 })}
     ${P('M8 12 Q8 4 16 4 L60 4 Q68 4 68 12 L68 30 Q68 38 60 38 L26 38 L12 47 L14.5 38 Q8 38 8 30 Z')}`,
  ),
  Dialog: wrap(
    `${R(2, 0, 68, 12, { f: SOFT, st: '', rx: 5 })}
     ${bar(10, 22, 48, 6)}${bar(10, 33, 34, 5)}
     ${R(44, 38, 20, 8, { f: BLUE, st: '', rx: 4 })}
     ${P('M58 4 L64 10 M64 4 L58 10')}
     ${R(2, 0, 68, 48, { rx: 5 })}`,
  ),
  Drawer: wrap(
    `${bar(48, 8, 18, 5, DARK)}${bar(48, 20, 20, 5)}${bar(48, 30, 16, 5)}
     ${R(42, 0, 30, 48, { f: SOFT, st: '', rx: 5 })}
     ${P('M32 24 L20 24 M26 18 L20 24 L26 30', { c: BLUE })}
     ${R(0, 0, 72, 48, { rx: 5 })}`,
  ),
  Alert: wrap(
    `${bar(26, 18, 34, 6)}${bar(26, 28, 24, 5)}
     ${C(12, 24, 8, { f: '#FFF3E5', st: '' })}
     ${L(12, 20, 12, 25, { c: '#E67E17', w: 1.8 })}${C(12, 28.5, 1.3, { f: '#E67E17', st: '' })}
     ${R(0, 10, 72, 28)}`,
  ),
  Progress: wrap(
    `${R(0, 12, 72, 14, { rx: 7 })}${R(0, 12, 48, 14, { f: BLUE, st: '', rx: 7 })}
     ${bar(0, 38, 72, 6)}${bar(0, 38, 30, 6, BLUE)}`,
  ),
  Skeleton: wrap(
    `${C(10, 10, 9, { f: SOFT, st: '' })}${bar(24, 2, 44, 9, SOFT)}${bar(24, 15, 34, 8, '#E9EEF6')}
     ${bar(2, 32, 68, 8, SOFT)}${bar(2, 42, 56, 6, '#E9EEF6')}`,
  ),
  // ─── 导航 ───
  Menu: wrap(
    `${bar(8, 24, 18, 5)}${bar(8, 33, 20, 5)}${bar(8, 42, 14, 5)}
     ${bar(44, 6, 26, 6)}${bar(44, 20, 24, 6)}${bar(44, 34, 28, 6)}
     ${R(4, 6, 26, 11, { f: BLUE, st: '', rx: 3 })}
     ${R(0, 0, 34, 48, { rx: 4 })}`,
  ),
  Tabs: wrap(
    `${bar(34, 4, 22, 6)}${bar(0, 24, 56, 6)}${bar(0, 36, 44, 6)}
     ${bar(0, 2, 26, 8, DARK)}
     ${L(0, 15, 72, 15)}${L(0, 15, 26, 15, { c: BLUE, w: 2.2 })}`,
  ),
  Breadcrumb: wrap(
    `${bar(0, 19, 16, 7, DARK)}
     ${P('M22 18 L27 23 L22 28')}
     ${bar(32, 19, 16, 7)}
     ${P('M54 18 L59 23 L54 28', { c: BLUE })}
     ${bar(63, 19, 9, 7, BLUE)}`,
  ),
  Pagination: wrap(
    `${P('M8 18 L2 24 L8 30', { c: BLUE, w: 1.8 })}
     ${R(13, 16, 13, 16, { f: BLUE, st: '', rx: 3 })}${R(30, 16, 13, 16, { rx: 3 })}${R(47, 16, 13, 16, { rx: 3 })}
     ${C(65, 21, 1.4, { f: GRAY, st: '' })}${C(65, 24, 1.4, { f: GRAY, st: '' })}${C(65, 27, 1.4, { f: GRAY, st: '' })}
     ${P('M69 18 L75 24 L69 30', { c: BLUE, w: 1.8 })}`,
  ),
  Dropdown: wrap(
    `${R(12, 20, 48, 26, { rx: 4 })}${bar(18, 27, 30, 6)}${bar(18, 37, 24, 6, BLUE)}
     ${R(12, 0, 48, 14, { f: BLUE, st: '', rx: 4 })}${L(24, 7, 48, 7, { c: '#fff', w: 2 })}`,
  ),
  // ─── 补齐（此前走兜底图） ───
  CreditsProgress: wrap(
    `${bar(0, 0, 34, 5, DARK)}
     ${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21].map((i) =>
      `<rect x="${2 + i * 3}" y="11" width="1.8" height="19" rx="0.9" fill="${i < 17 ? BLUE : SOFT}"/>`,
    ).join('')}
     ${bar(2, 37, 26, 7, DARK)}${bar(50, 39, 20, 5)}`,
  ),
  GanttProgress: wrap(
    `${bar(0, 4, 12, 5, DARK)}${R(16, 1, 40, 10, { f: BLUE, st: '', rx: 5 })}
     ${bar(0, 20, 12, 5, DARK)}${R(22, 17, 40, 10, { f: SOFT, st: '', rx: 5 })}${R(22, 17, 26, 10, { f: BLUE, st: '', rx: 5 })}
     ${bar(0, 36, 12, 5, DARK)}${R(10, 33, 28, 10, { f: SOFT, st: '', rx: 5 })}`,
  ),
  Overview: wrap(
    `${R(2, 2, 32, 20, { f: SOFT, st: '', rx: 4 })}${R(38, 2, 32, 20, { f: BLUE, st: '', rx: 4 })}
     ${R(2, 26, 32, 20, { f: SOFT, st: '', rx: 4 })}${R(38, 26, 32, 20, { f: SOFT, st: '', rx: 4 })}`,
  ),
  // 中文name兜底（meta.js 中「组件总览」入口的 name 即中文）
  '组件总览': wrap(
    `${R(2, 2, 32, 20, { f: SOFT, st: '', rx: 4 })}${R(38, 2, 32, 20, { f: BLUE, st: '', rx: 4 })}
     ${R(2, 26, 32, 20, { f: SOFT, st: '', rx: 4 })}${R(38, 26, 32, 20, { f: SOFT, st: '', rx: 4 })}`,
  ),
}

const FALLBACK = wrap(`${bar(14, 20, 44, 7)}${R(2, 8, 68, 32)}`)

const svg = computed(() => `<svg viewBox="14 14 92 68" xmlns="http://www.w3.org/2000/svg">${ARTS[props.name] || FALLBACK}</svg>`)
</script>

<style>
.comp-art {
  --art-gray: #c5cedb;
  --art-blue: #175dff;
  --art-soft: #eef2f8;
  --art-dark: #9aa6b8;
  display: block;
  width: 100%;
  height: 100%;
}
.comp-art svg {
  display: block;
  width: 100%;
  height: 100%;
}
html.dark .comp-art {
  --art-gray: #5d6a84;
  --art-blue: #4d82ff;
  --art-soft: rgba(255, 255, 255, 0.07);
  --art-dark: #8492a8;
}
</style>
