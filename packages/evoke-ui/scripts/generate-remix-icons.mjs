/**
 * 从 Remix Icon（devDependency）生成 Evoke UI 内置 SVG 图标集
 *
 * 用法: node scripts/generate-remix-icons.mjs
 * 输出:
 *   src/components/icon/svg-paths.js       — 核心图标集（EvIcon 静态内置，组件内部 + 常用语义名）
 *   src/components/icon/showcase-paths.js  — 展示图标集（EvIconGrid 动态加载，每类限量配对采样）
 *   src/components/icon/showcase-meta.js   — 展示集元数据（分类目录 + Remix 原名 + 中文分类名）
 *
 * 核心集键名为 kebab-case 语义命名（如 arrow-right、close）；
 * 展示集键名为 Remix 原生命名（如 arrow-right-line / arrow-right-fill）。
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ICONS_ROOT = resolve(__dirname, '../node_modules/remixicon/icons')

// ─── 核心图标集：组件语义名 → [Remix 分类目录, Remix 图标文件名] ───
const MAPPING = {
  // ─── 方向 / 导航 ───
  'arrow-up': ['Arrows', 'arrow-up-line'],
  'arrow-down': ['Arrows', 'arrow-down-line'],
  'arrow-left': ['Arrows', 'arrow-left-line'],
  'arrow-right': ['Arrows', 'arrow-right-line'],
  'arrow-up-right': ['Arrows', 'arrow-right-up-line'],
  'chevron-up': ['Arrows', 'arrow-up-s-line'],
  'chevron-down': ['Arrows', 'arrow-down-s-line'],
  'chevron-left': ['Arrows', 'arrow-left-s-line'],
  'chevron-right': ['Arrows', 'arrow-right-s-line'],
  // ─── 操作 / 状态 ───
  close: ['System', 'close-line'],
  check: ['System', 'check-line'],
  plus: ['System', 'add-line'],
  minus: ['System', 'subtract-line'],
  search: ['System', 'search-line'],
  menu: ['System', 'menu-line'],
  more: ['System', 'more-line'],
  copy: ['Document', 'file-copy-line'],
  download: ['System', 'download-2-line'],
  'external-link': ['System', 'external-link-line'],
  loading: ['System', 'loader-4-line'],
  refresh: ['System', 'refresh-line'],
  warning: ['System', 'alert-line'],
  info: ['System', 'information-line'],
  music: ['Media', 'music-line'],
  'play-fill': ['Media', 'play-fill'],
  folder: ['Document', 'folder-line'],
  box: ['Others', 'box-3-line'],
  'folder-open': ['Document', 'folder-open-line'],
  'line-chart': ['Business', 'line-chart-line'],
  global: ['Business', 'global-line'],
  heart: ['Health & Medical', 'heart-line'],
  star: ['System', 'star-line'],
  'star-fill': ['System', 'star-fill'],
  quote: ['Editor', 'double-quotes-l'],
  mail: ['Business', 'mail-line'],
  link: ['Editor', 'link'],
  // ─── Markdown 编辑器工具栏 ───
  bold: ['Editor', 'bold'],
  italic: ['Editor', 'italic'],
  strikethrough: ['Editor', 'strikethrough'],
  heading: ['Editor', 'heading'],
  'list-unordered': ['Editor', 'list-unordered'],
  'list-ordered': ['Editor', 'list-ordered'],
  code: ['Development', 'code-line'],
  markdown: ['Document', 'markdown-fill'],
  // ─── 主题 ───
  sun: ['Weather', 'sun-line'],
  moon: ['Weather', 'moon-line'],
  // ─── 品牌（社交/生态，展示官网语境常用）───
  github: ['Logos', 'github-fill'],
  npmjs: ['Logos', 'npmjs-line'],
  x: ['Logos', 'twitter-x-fill'],
  discord: ['Logos', 'discord-fill'],
  wechat: ['Logos', 'wechat-fill'],
  vue: ['Logos', 'vuejs-fill'],
  react: ['Logos', 'reactjs-fill'],
  apple: ['Logos', 'apple-fill'],
  // ─── 移动端常用（个人中心 / 商详 / 登录等 H5 高频语义）───
  user: ['User & Faces', 'user-line'],
  settings: ['System', 'settings-line'],
  home: ['Buildings', 'home-5-line'],
  'map-pin': ['Map', 'map-pin-2-line'],
  bell: ['Media', 'notification-3-line'],
  chat: ['Communication', 'chat-1-line'],
  'customer-service': ['Business', 'customer-service-2-line'],
  lock: ['System', 'lock-line'],
  eye: ['System', 'eye-line'],
  'eye-off': ['System', 'eye-off-line'],
  wallet: ['Finance', 'wallet-3-line'],
  truck: ['Map', 'truck-line'],
  gift: ['Finance', 'gift-line'],
  coupon: ['Finance', 'coupon-3-line'],
  'shopping-cart': ['Finance', 'shopping-cart-line'],
  'shopping-bag': ['Finance', 'shopping-bag-3-line'],
  smartphone: ['Device', 'smartphone-line'],
  desktop: ['Device', 'computer-line'],
  'shield-check': ['System', 'shield-check-line'],
  'file-list': ['Document', 'file-list-3-line'],
  book: ['Document', 'book-2-line'],
  refund: ['Finance', 'refund-line'],
  history: ['System', 'history-line'],
  // ─── 文档站首页特性卡在用（2026-09-22 补：此前名不存在，卡片图标渲染空白）───
  zap: ['Weather', 'flashlight-line'],
  layers: ['Business', 'stack-line'],
  shield: ['System', 'shield-line'],
}

/** 分类中文名（文档与图标网格分组标题用） */
const CATEGORY_ZH = {
  Arrows: '箭头与方向',
  Buildings: '建筑',
  Business: '商务',
  Communication: '通讯',
  Design: '设计',
  Development: '开发',
  Device: '设备',
  Document: '文档',
  Editor: '编辑器',
  Finance: '金融',
  Food: '美食',
  'Game & Sports': '游戏与运动',
  'Health & Medical': '健康与医疗',
  Logos: '品牌 Logo',
  Map: '地图',
  Media: '媒体',
  Others: '其他',
  System: '系统',
  'User & Faces': '用户',
  Weather: '天气',
}

/** 展示集每个分类最多收录的图标对数（line + fill 为一对） */
const SHOWCASE_PER_CATEGORY = 24

function parseSvg(svg) {
  const viewBox = svg.match(/viewBox="([^"]+)"/)?.[1] || '0 0 24 24'
  const paths = []
  for (const m of svg.matchAll(/<path([^>]*)\/>/g)) {
    const attrs = m[1]
    const d = attrs.match(/\bd="([^"]+)"/)?.[1]
    if (!d) continue
    const fillRule = attrs.match(/fill-rule="([^"]+)"/)?.[1]
    const fill = attrs.match(/\bfill="([^"]+)"/)?.[1]
    paths.push({
      d,
      ...(fillRule && fillRule !== 'nonzero' ? { fillRule } : {}),
      ...(fill && fill !== 'currentColor' ? { fill } : {}),
    })
  }
  return { viewBox, paths }
}

const version = JSON.parse(
  readFileSync(resolve(ICONS_ROOT, '../package.json'), 'utf-8')
).version
const srcDir = resolve(__dirname, '../src/components/icon')
mkdirSync(srcDir, { recursive: true })

// ══════ 1. 核心图标集 ══════
const core = {}
const missing = []
for (const [name, [cat, file]] of Object.entries(MAPPING)) {
  const p = resolve(ICONS_ROOT, cat, `${file}.svg`)
  if (!existsSync(p)) {
    missing.push(`${name} -> ${cat}/${file}.svg`)
    continue
  }
  core[name] = parseSvg(readFileSync(p, 'utf-8'))
}
if (missing.length) {
  console.error(`[gen:icons] 以下图标在 remixicon 包中不存在:\n  ${missing.join('\n  ')}`)
  process.exit(1)
}

writeFileSync(
  resolve(srcDir, 'svg-paths.js'),
  `/**
 * EvIcon 核心图标集（${Object.keys(core).length} 个，静态快照数据）
 * 图标形状源自 Remix Icon v${version}（https://remixicon.com/，Remix Icon License v1.0，免费商用）
 * 由 scripts/generate-remix-icons.mjs 生成，键名为 kebab-case 语义命名，请勿手动修改；
 * 需增删图标时在脚本 MAPPING 中登记后重新执行生成
 */

export const evSvgPaths = ` + JSON.stringify(core, null, 1) + '\n'
)

// ══════ 2. 展示图标集（每类限量、line/fill 配对采样、Remix 原生命名）══════
const showcase = {}
const showcaseMeta = {}
let categories = []
for (const cat of readdirSync(ICONS_ROOT, { withFileTypes: true })) {
  if (!cat.isDirectory()) continue
  categories.push(cat.name)
}
categories.sort()

let total = 0
for (const cat of categories) {
  const files = readdirSync(resolve(ICONS_ROOT, cat))
    .filter((f) => f.endsWith('.svg'))
    .map((f) => f.replace(/\.svg$/, ''))
    .sort()

  // 以基础名配对（xxx-line / xxx-fill 归并为一对，保持两种风格相邻呈现）
  const pairs = new Map()
  for (const name of files) {
    const base = name.replace(/-(line|fill)$/, '')
    if (!pairs.has(base)) pairs.set(base, [])
    pairs.get(base).push(name)
  }

  let taken = 0
  for (const [base, names] of pairs) {
    if (taken >= SHOWCASE_PER_CATEGORY) break
    for (const name of names) {
      const p = resolve(ICONS_ROOT, cat, `${name}.svg`)
      showcase[name] = parseSvg(readFileSync(p, 'utf-8'))
      showcaseMeta[name] = { category: cat, categoryZh: CATEGORY_ZH[cat] || cat, remix: name }
      total++
    }
    taken++
  }
}

writeFileSync(
  resolve(srcDir, 'showcase-paths.js'),
  `/**
 * 展示图标集（${total} 个，Remix 原生命名，EvIconGrid 动态加载，不进主包）
 * 每分类限量 ${SHOWCASE_PER_CATEGORY} 对（line/fill）配对采样，源自 Remix Icon v${version}
 * （Remix Icon License v1.0，免费商用）。由 scripts/generate-remix-icons.mjs 生成，请勿手动修改
 */

export const evShowcasePaths = ` + JSON.stringify(showcase, null, 1) + '\n'
)

writeFileSync(
  resolve(srcDir, 'showcase-meta.js'),
  `/**
 * 展示图标集元数据（分类 / Remix 原名，供图标网格与文档消费）
 * 由 scripts/generate-remix-icons.mjs 生成，请勿手动修改
 */

export const REMIX_ICON_VERSION = '${version}'

export const EV_SHOWCASE_META = ` + JSON.stringify(showcaseMeta, null, 1) + '\n'
)

console.log(
  `[gen:icons] 完成：核心集 ${Object.keys(core).length} 个；展示集 ${total} 个（${categories.length} 个分类 × ≤${SHOWCASE_PER_CATEGORY} 对）`
)
