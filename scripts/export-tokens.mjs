#!/usr/bin/env node
/**
 * export-tokens — 设计令牌导出（ROADMAP「设计令牌导出」条目）
 *
 * 从两库的令牌源文件（CSS 自定义属性）解析出明 / 暗两组令牌，
 * 生成 W3C Design Tokens 草案格式的 JSON（$value / $type，按类目分组），
 * 供设计工具消费：Figma Variables 可通过支持该格式的插件直接导入，
 * 或作为 CI 侧令牌对账的事实源。
 *
 * 用法：pnpm tokens:export（在仓库根执行）
 * 输出：design-tokens/<pkg>.light.json / <pkg>.dark.json
 *   - light.json：全部 :root 令牌（后块覆盖前块）
 *   - dark.json：仅 html.dark 覆盖项（叠加在 light 之上即为完整暗色集）
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outDir = path.join(root, 'design-tokens')

const SOURCES = [
  {
    pkg: 'evoke-ui',
    label: '@wil-works/evoke-ui（--ev-*）',
    ns: 'ev',
    files: ['packages/evoke-ui/src/styles/variables.css'],
  },
  {
    pkg: 'evoke-business-ui',
    label: '@wil-works/evoke-business-ui（--eb-*）',
    ns: 'eb',
    files: [
      'packages/evoke-business-ui/src/styles/variables.css',
      'packages/evoke-business-ui/src/styles/dark.css',
    ],
  },
]

/** 抽取某选择器块内本包命名空间的自定义属性声明（按出现顺序，后块覆盖前块）。
 *  跨命名空间行（如 business 里的 --ev-* 图表适配映射）不属于本包令牌集，跳过 */
function extractBlocks(css, selectorRe, ns) {
  const map = new Map()
  const re = new RegExp(`${selectorRe}\\s*\\{`, 'g')
  let m
  while ((m = re.exec(css))) {
    // 花括号配对取整块
    let depth = 1
    let i = re.lastIndex
    while (i < css.length && depth > 0) {
      if (css[i] === '{') depth++
      else if (css[i] === '}') depth--
      i++
    }
    const body = css.slice(re.lastIndex, i - 1)
    const declRe = /--([\w-]+)\s*:\s*([^;{}]+);/g
    let d
    while ((d = declRe.exec(body))) {
      if (!d[1].startsWith(`${ns}-`)) continue
      map.set(d[1], d[2].trim().replace(/\s+/g, ' '))
    }
  }
  return map
}

/** 按值推断 W3C $type */
function inferType(value) {
  if (/^(#[0-9a-fA-F]{3,8}|rgb|hsl|color-mix|light-dark|transparent)/.test(value)) return 'color'
  if (/^-?[\d.]+(px|rem|em|%)$/.test(value)) return 'dimension'
  if (/^-?[\d.]+m?s$/.test(value)) return 'duration'
  if (/^-?[\d.]+$/.test(value)) return 'number'
  return undefined
}

/** --ns-group-name → { group, leaf }；首段是命名空间（ev/eb），剥离后取下一段为组 */
function splitName(full) {
  const parts = full.split('-') // full 已剥掉 --，parts[0] 是命名空间
  if (parts.length < 2) return { group: 'base', leaf: full }
  return { group: parts[1], leaf: parts.slice(2).join('-') || parts[1] }
}

function buildTokens(map) {
  const out = {}
  for (const [full, value] of map) {
    const { group, leaf } = splitName(full)
    out[group] ??= {}
    const token = { $value: value }
    const type = inferType(value)
    if (type) token.$type = type
    out[group][leaf] = token
  }
  return out
}

fs.mkdirSync(outDir, { recursive: true })

let totalLight = 0
let totalDark = 0

for (const src of SOURCES) {
  const css = src.files
    .map((f) => fs.readFileSync(path.join(root, f), 'utf8'))
    .join('\n')

  const light = extractBlocks(css, ':root', src.ns)
  const dark = extractBlocks(css, 'html\\.dark', src.ns)

  const lightJson = {
    $description: `${src.label} 设计令牌 — light（:root）`,
    ...buildTokens(light),
  }
  const darkJson = {
    $description: `${src.label} 设计令牌 — dark（html.dark 覆盖项，叠加在 light 之上使用）`,
    ...buildTokens(dark),
  }

  const lightPath = path.join(outDir, `${src.pkg}.light.json`)
  const darkPath = path.join(outDir, `${src.pkg}.dark.json`)
  fs.writeFileSync(lightPath, JSON.stringify(lightJson, null, 2) + '\n')
  fs.writeFileSync(darkPath, JSON.stringify(darkJson, null, 2) + '\n')

  totalLight += light.size
  totalDark += dark.size
  console.log(
    `${src.pkg}: light ${light.size} 项 → ${path.relative(root, lightPath)}；dark 覆盖 ${dark.size} 项 → ${path.relative(root, darkPath)}`
  )
}

console.log(`完成：共导出明色 ${totalLight} 项、暗色覆盖 ${totalDark} 项。`)
