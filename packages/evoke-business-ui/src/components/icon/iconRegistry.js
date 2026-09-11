/**
 * 统一图标注册表（扁平命名空间）
 *
 * 无前缀解析优先级：custom（运行时注册）→ 内置 SVG（Remix 静态图标集，含文件类型别名）→ 完整图标库
 *
 * Usage:
 *   <eb-icon name="search" size="14" />
 *   registerIcons({ 'search': MySearchIcon })
 */
import { h } from 'vue'
import { remixSvgPaths } from './remix-svg-paths'

// ─── 完整图标库（Remix 全量原生命名，体积约 1.6MB，按需注册） ──────────────
const fullIconPaths = new Map()
let fullIconsLoaded = false
// 同步解析失败的负缓存：避免渲染层反复触发全量库的异步加载
const missedNames = new Set()
let fullLoadPromise = null

/**
 * 注册 Remix 全量图标库（原生命名，如 'arrow-down-s-line'）
 * 通常不直接调用，而是使用 '@wil-works/evoke-business-ui/full-icons' 的 loadFullIcons()
 */
export function registerFullIcons(pathsObject) {
  for (const [name, entry] of Object.entries(pathsObject)) fullIconPaths.set(name, entry)
  fullIconsLoaded = true
  missedNames.clear()
}

/** 全量图标库是否已加载 */
export function isFullIconsLoaded() {
  return fullIconsLoaded
}

/**
 * 按需加载完整图标库（动态 import，主包不含其体积）
 * 加载完成后，全部 3000+ Remix 原生名称可经 eb-icon 同步渲染
 */
export function loadFullIcons() {
  if (!fullLoadPromise) {
    fullLoadPromise = import('./remix-full-paths.js').then((m) => {
      registerFullIcons(m.remixFullPaths)
    })
  }
  return fullLoadPromise
}

// ─── 内置 SVG 图标（Remix Icon 静态快照，运行时零依赖） ──────────────
const svgIconCache = new Map()

function createSvgIcon(entry) {
  let cached = svgIconCache.get(entry)
  if (!cached) {
    cached = () =>
      h(
        'svg',
        {
          xmlns: 'http://www.w3.org/2000/svg',
          viewBox: entry.viewBox,
          'aria-hidden': 'true',
        },
        entry.paths.map((p) =>
          h('path', {
            fill: p.fill || 'currentColor',
            d: p.d,
            ...(p.fillRule ? { 'fill-rule': p.fillRule } : {}),
          })
        )
      )
    svgIconCache.set(entry, cached)
  }
  return cached
}

function resolveSvg(name) {
  const entry = remixSvgPaths[name]
  if (!entry) return undefined
  return createSvgIcon(entry)
}

/**
 * PascalCase → kebab-case 转换，用于兼容 `icon="CircleCheckFilled"` 写法
 * 例：CircleCheckFilled → circle-check-filled
 */
function pascalToKebab(str) {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '')
}

// 全量库固定 24 viewBox；紧凑格式（纯 d 字符串）在此补全
const FULL_DEFAULT_VIEWBOX = '0 0 24 24'

function resolveFull(name) {
  const entry = fullIconPaths.get(name)
  if (!entry) return undefined
  const normalized =
    typeof entry === 'string'
      ? { viewBox: FULL_DEFAULT_VIEWBOX, paths: [{ d: entry }] }
      : { viewBox: entry.viewBox ?? FULL_DEFAULT_VIEWBOX, paths: entry.paths }
  return createSvgIcon(normalized)
}

// ─── 自定义图标注册表（最高优先级） ──────────────
const customIconRegistry = {}

/**
 * 无前缀名称的统一解析：custom → 内置 SVG（含文件类型别名）→ 完整图标库
 */
function resolveUnprefixed(name) {
  // 1. 自定义图标：运行时注册，最高优先级（可覆盖同名默认图标）
  if (customIconRegistry[name]) return customIconRegistry[name]

  // 2. 内置 SVG：精确 kebab-case → PascalCase 容错（如 icon="CircleCheckFilled"）
  const svg = resolveSvg(name) ?? resolveSvg(pascalToKebab(name))
  if (svg) return svg

  // 3. 完整图标库（Remix 原生命名，需已通过 loadFullIcons 加载）
  return resolveFull(name) ?? resolveFull(pascalToKebab(name))
}

/** 同步获取图标 */
export function getIconByNameSync(name) {
  if (!name) return undefined

  // 自定义图标：custom: 前缀
  if (name.startsWith('custom:')) {
    return customIconRegistry[name.slice(7)]
  }

  return resolveUnprefixed(name)
}

/** 异步获取图标（同步未命中时按需拉起完整图标库，随后重试解析） */
export async function getIconByName(name) {
  const sync = getIconByNameSync(name)
  if (sync) return sync
  if (typeof name !== 'string' || name.startsWith('custom:')) return undefined
  // 记入负缓存，命中过且全量库仍未加载时不再重复触发加载
  if (missedNames.has(name) && !fullIconsLoaded) return undefined
  missedNames.add(name)
  try {
    await loadFullIcons()
  } catch {
    return undefined
  }
  return getIconByNameSync(name)
}

/**
 * 注册自定义图标
 * 无前缀使用时优先级最高，可覆盖品牌彩色 / 内置 SVG 的同名图标
 * @param {Record<string, import('vue').Component>} icons
 */
export function registerIcons(icons) {
  Object.assign(customIconRegistry, icons)
}

/**
 * 获取所有已注册的图标名称
 * @param {'custom'|'remix'|'full'|'all'} [library]
 *        'remix' 为核心内置 SVG 图标集（含文件类型别名）；
 *        'full' 为已加载的完整图标库（Remix 原生命名）；'iconfont' 字体图标族已退役，恒返回 []
 */
export function getIconNames(library = 'all') {
  switch (library) {
    case 'custom':
      return Object.keys(customIconRegistry).map((name) => `custom:${name}`)
    case 'remix':
      return Object.keys(remixSvgPaths)
    case 'full':
      return [...fullIconPaths.keys()]
    case 'iconfont':
      return []
    case 'all':
    default: {
      // 扁平命名空间：各族同名只保留一个入口名
      const names = new Set(Object.keys(remixSvgPaths))
      fullIconPaths.forEach((_, name) => names.add(name))
      for (const name of Object.keys(customIconRegistry)) names.add(name)
      return [...names]
    }
  }
}

// 导出各个注册表（供高级用户使用）
export { remixSvgPaths, customIconRegistry }
export default getIconByName
