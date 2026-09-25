#!/usr/bin/env node
/**
 * Fluent System Icons 对比资产生成（tools-ui 计划 04 §七 M0 交付物 5）
 *
 * 图标底座对比评测留档：同一屏真实工具区，一版用 business-ui 现成的 Remix 语义名，
 * 一版用 Fluent System Icons（MIT，官方 Office 血统，24 regular 档）——两版截图交设计
 * 评审决定是否切换（A-13 / D-6 已把 Fluent 列为对比项）。
 *
 * 本脚本把 @fluentui/svg-icons 的 SVG 抽成 business-ui 注册表可吃的 path 数据
 * （{ viewBox, paths:[{d}] }），产出 src/fluent-icons.js（提交进仓，运行时不依赖该包）。
 * 切换底座只改这张映射表 —— 模板里只写语义名的纪律因此成立（04 §二）。
 *
 * 用法: node scripts/gen-fluent-icons.mjs
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const iconsDir = resolve(__dirname, '../node_modules/@fluentui/svg-icons/icons')
const outFile = resolve(__dirname, '../src/fluent-icons.js')

if (!existsSync(iconsDir)) {
  console.error('[gen-fluent-icons] 未找到 @fluentui/svg-icons（examples/tools-workbench 的 devDependency）')
  process.exit(1)
}

/** 语义名 → Fluent 文件名（24 regular）。只收录 business-ui 内置集里同样有语义名的概念，
 *  保证两版是"同一屏同一批命令"的对比，不是两批命令 */
const MAPPING = {
  bold: 'text_bold_24_regular.svg',
  italic: 'text_italic_24_regular.svg',
  underline: 'text_underline_24_regular.svg',
  search: 'search_24_regular.svg',
  filter: 'filter_24_regular.svg',
  table: 'table_24_regular.svg',
  copy: 'copy_24_regular.svg',
  'zoom-in': 'zoom_in_24_regular.svg',
  brush: 'paint_brush_24_regular.svg',
  close: 'dismiss_24_regular.svg',
  more: 'more_horizontal_24_regular.svg',
}

/** 抽 <path d="...">（Fluent regular 多为单 path；多 path 图标按序保留） */
function extractPaths(svg) {
  const paths = []
  for (const m of svg.matchAll(/<path\b[^>]*\bd="([^"]+)"[^>]*\/>/g)) {
    paths.push({ d: m[1] })
  }
  if (paths.length === 0) {
    for (const m of svg.matchAll(/\bd="([^"]+)"/g)) paths.push({ d: m[1] })
  }
  return paths
}

const out = {}
for (const [semantic, file] of Object.entries(MAPPING)) {
  const p = resolve(iconsDir, file)
  if (!existsSync(p)) {
    console.error(`[gen-fluent-icons] 缺失 Fluent 资产: ${file}（语义名 ${semantic}）`)
    process.exit(1)
  }
  const paths = extractPaths(readFileSync(p, 'utf8'))
  if (paths.length === 0) {
    console.error(`[gen-fluent-icons] ${file} 未解析到 path`)
    process.exit(1)
  }
  out[semantic] = { viewBox: '0 0 24 24', paths }
}

const code =
  `/**\n` +
  ` * Fluent System Icons 对比资产（24 regular）— 由 scripts/gen-fluent-icons.mjs 生成，勿手改\n` +
  ` * 用途：tools-ui 计划 04 §七 的图标底座对比评测留档（Remix vs Fluent 同屏对比截图）\n` +
  ` * 形状数据格式与 business-ui remix-svg-paths.js 一致（{ viewBox, paths:[{ d }] }）\n` +
  ` */\n\n` +
  `export const FLUENT_ICON_PATHS = ${JSON.stringify(out, null, 2)}\n`

writeFileSync(outFile, code)
console.log(`[gen-fluent-icons] 生成 ${Object.keys(out).length} 个语义名 → src/fluent-icons.js`)
