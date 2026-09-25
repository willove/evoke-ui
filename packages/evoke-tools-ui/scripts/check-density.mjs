#!/usr/bin/env node
/**
 * 密度与 chrome 预算自动对照（tools-ui 计划 07 M0 出口条件 1）
 *
 * "三档密度切换后，同一组件的实测高度/字号/间距与设计文档表格逐项一致"
 * 拆成两半，各司其职：
 *   1. 本脚本（纯 node，构建期）：variables.css 的令牌值 vs 计划 03 §3.2 / §四 / §五
 *      的设计表格逐项一致；chrome 预算的 calc 链路求值 = 156 / 180 / 84。
 *   2. visual/tools.spec.mjs（浏览器）：真实渲染下组件实测尺寸 = 令牌值。
 *
 * 用法: node scripts/check-density.mjs （已挂入 build）
 */
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const variablesPath = resolve(__dirname, '../src/styles/variables.css')
const css = readFileSync(variablesPath, 'utf8')

/** 取某选择器块内的自定义属性声明（后块覆盖前块） */
function blockDefs(selectorHead) {
  const re = new RegExp(`${selectorHead}\\s*\\{`, 'g')
  const map = new Map()
  let m
  while ((m = re.exec(css))) {
    let depth = 1
    let i = re.lastIndex
    while (i < css.length && depth > 0) {
      if (css[i] === '{') depth++
      else if (css[i] === '}') depth--
      i++
    }
    const body = css.slice(re.lastIndex, i - 1)
    for (const d of body.matchAll(/(--[\w-]+)\s*:\s*([^;{}]+);/g)) {
      map.set(d[1], d[2].trim().replace(/\s+/g, ' '))
    }
  }
  return map
}

const rootDefs = blockDefs(':root')
const compactDefs = blockDefs("\\[data-density='compact'\\]")
const relaxedDefs = blockDefs("\\[data-density='relaxed'\\]")

/** 逐层覆盖后的三档视图（compact 覆盖默认，relaxed 覆盖默认） */
function tierDefs(tier) {
  const map = new Map(rootDefs)
  if (tier === 'compact') for (const [k, v] of compactDefs) map.set(k, v)
  if (tier === 'relaxed') for (const [k, v] of relaxedDefs) map.set(k, v)
  return map
}

/** var() 链解析 + calc 求值（本库令牌只用到 + 与 *，够用则不多做） */
function resolveValue(name, defs, depth = 0) {
  if (depth > 24) throw new Error(`[check-density] var() 链过深：${name}`)
  const raw = defs.get(name)
  if (raw === undefined) throw new Error(`[check-density] 令牌未定义：${name}`)
  if (!raw.includes('var(') && !raw.includes('calc(')) return raw
  const expanded = raw.replace(/var\((--[\w-]+)\)/g, (_, n) => {
    const v = resolveValue(n, defs, depth + 1)
    return v
  })
  const calc = /^calc\((.*)\)$/.exec(expanded.trim())
  if (!calc) return expanded.trim()
  const expr = calc[1]
    .replace(/(\d*\.?\d+)px/g, '$1')
    .replace(/\s+/g, '')
  if (!/^[\d.+*\-]+$/.test(expr)) {
    throw new Error(`[check-density] 不支持的 calc 表达式：${expanded}`)
  }
  const value = Function(`"use strict"; return (${expr})`)()
  return `${value}px`
}

const failures = []
function expectToken(defs, tier, name, expected) {
  const actual = resolveValue(name, defs)
  const ok = actual === expected
  if (!ok) failures.push(`${tier}  --${name}: 期望 ${expected}，实际 ${actual}`)
  return actual
}

/** 密度三档对照表（计划 03 §3.2） */
const DENSITY_TABLE = {
  '--et-density-base-font': ['12px', '13px', '14px'],
  '--et-density-caption-font': ['11px', '12px', '13px'],
  '--et-density-control-height': ['24px', '32px', '40px'],
  '--et-size-toolbtn-large': ['48px', '56px', '64px'],
  '--et-size-toolbtn-small': ['24px', '28px', '36px'],
  '--et-size-row': ['20px', '24px', '28px'],
  '--et-icon-sm': ['14px', '16px', '20px'],
  '--et-icon-lg': ['20px', '24px', '28px'],
  '--et-space-inline': ['2px', '4px', '6px'],
  '--et-space-block': ['6px', '8px', '12px'],
}

const tiers = ['compact', 'default', 'relaxed']
console.log('三档密度对照（compact / default / relaxed）：')
for (const [name, expected] of Object.entries(DENSITY_TABLE)) {
  const actual = tiers.map((tier, i) => {
    const defs = tierDefs(tier)
    const value = resolveValue(name, defs)
    if (value !== expected[i]) failures.push(`${tier}  --${name}: 期望 ${expected[i]}，实际 ${value}`)
    return value
  })
  console.log(`  ${name.padEnd(32)} ${actual.map((v) => v.padStart(7)).join(' / ')}`)
}

/** chrome 度量与预算（计划 03 §四；预算为 calc 派生，默认档应得 156/180/84） */
const CHROME_TABLE = {
  '--et-chrome-titlebar-height': '32px',
  '--et-chrome-tabstrip-height': '26px',
  '--et-chrome-auxbar-height': '26px',
  '--et-chrome-statusbar-height': '24px',
  '--et-chrome-group-label-height': '16px',
  '--et-chrome-toolarea-height': '72px',
  '--et-chrome-toolarea-collapsed': '0px',
  '--et-chrome-top-budget': '156px',
  '--et-chrome-total-budget': '180px',
  '--et-chrome-collapsed-top-budget': '84px',
}

console.log('\nchrome 度量与预算（默认档）：')
const defaultDefs = tierDefs('default')
for (const [name, expected] of Object.entries(CHROME_TABLE)) {
  const actual = resolveValue(name, defaultDefs)
  if (actual !== expected) failures.push(`default  --${name}: 期望 ${expected}，实际 ${actual}`)
  console.log(`  ${name.padEnd(34)} ${actual.padStart(8)}  期望 ${expected}`)
}

/** 控件尺寸与状态（计划 03 §五，默认档） */
const CONTROL_TABLE = {
  '--et-toolbtn-caption-line-height': '16px',
  '--et-toolbtn-icon-box': '24px',
  '--et-menu-item-height': '32px',
  '--et-menu-icon-gutter': '20px',
  '--et-panel-header-height': '28px',
  '--et-statusbar-item-gap': '12px',
  '--et-focus-ring-width': '2px',
  '--et-focus-ring-offset': '1px',
}
console.log('\n控件尺寸与状态（默认档）：')
for (const [name, expected] of Object.entries(CONTROL_TABLE)) {
  const actual = resolveValue(name, defaultDefs)
  if (actual !== expected) failures.push(`default  --${name}: 期望 ${expected}，实际 ${actual}`)
  console.log(`  ${name.padEnd(34)} ${actual.padStart(8)}  期望 ${expected}`)
}

/** 派生一致性：菜单项高 = 控件高；大钮图标盒 = 图标档（三档都要成立） */
for (const tier of tiers) {
  const defs = tierDefs(tier)
  const control = resolveValue('--et-density-control-height', defs)
  const menuItem = resolveValue('--et-menu-item-height', defs)
  if (control !== menuItem) failures.push(`${tier}  --et-menu-item-height (${menuItem}) 与控件高 (${control}) 不一致`)
  const iconLg = resolveValue('--et-icon-lg', defs)
  const box = resolveValue('--et-toolbtn-icon-box', defs)
  if (iconLg !== box) failures.push(`${tier}  --et-toolbtn-icon-box (${box}) 与 --et-icon-lg (${iconLg}) 不一致`)
}

if (failures.length) {
  console.error(`\n[check-density] 与设计文档表格不一致，共 ${failures.length} 处：`)
  for (const f of failures) console.error('  ' + f)
  console.error('\n口径：令牌文件是单一事实源；设计文档表格随文件同步（计划 03 §九）。')
  process.exit(1)
}

console.log('\n[check-density] 通过：三档密度 / chrome 预算 / 控件尺寸与设计文档表格逐项一致')
