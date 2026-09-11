/**
 * EvIcon 图标注册表（扁平命名空间）
 *
 * 解析优先级：custom（运行时注册）→ 核心 SVG 集（Remix 静态快照，运行时零依赖）→ 展示集（已加载时）
 *
 * Usage:
 *   <ev-icon name="search" :size="16" />
 *   registerIcons({ 'my-logo': MyLogoComponent })
 *   loadShowcaseIcons() // 按需加载 900+ 展示图标（不阻塞首屏）
 */
import { h, ref } from 'vue'
import { ewSvgPaths } from './svg-paths'

/**
 * 注册表版本号：晚注册的图标（展示集异步加载 / registerIcons）会自增版本，
 * EvIcon 的解析计算属性依赖它——晚注册的图标出现时，已挂载的图标自动补渲染
 */
export const iconRegistryVersion = ref(0)

// ─── SVG path 数据 → 函数式组件 ──────────────
const componentCache = new Map()

export function createSvgIcon(entry) {
  const key = entry
  let cached = componentCache.get(key)
  if (!cached) {
    cached = () =>
      h('svg', {
        xmlns: 'http://www.w3.org/2000/svg',
        viewBox: entry.viewBox,
        'aria-hidden': 'true',
      }, entry.paths.map((p) =>
        h('path', {
          d: p.d,
          ...(p.fillRule ? { 'fill-rule': p.fillRule } : {}),
          ...(p.fill ? { fill: p.fill } : {}),
        })
      ))
    componentCache.set(key, cached)
  }
  return cached
}

// ─── 名称注册表 ──────────────
const registry = new Map()

for (const [name, entry] of Object.entries(ewSvgPaths)) {
  registry.set(name, createSvgIcon(entry))
}

/** 注册自定义图标（组件或 { viewBox, paths } 数据），后注册覆盖同名 */
export function registerIcons(icons) {
  for (const [name, icon] of Object.entries(icons)) registry.set(name, icon)
  iconRegistryVersion.value++
}

/** 按名称同步解析图标组件；未命中返回 undefined */
export function getIconByName(name) {
  return registry.get(name)
}

/** 枚举全部已注册图标名称 */
export function getIconNames() {
  return [...registry.keys()]
}

/** 核心集是否包含某图标 */
export function hasIcon(name) {
  return registry.has(name)
}

// ─── 展示集按需加载 ──────────────
let showcaseLoadPromise = null

/**
 * 按需加载展示图标集（900+ Remix 原生命名图标）
 * 动态 import 独立 chunk，主包不承担其体积；幂等
 */
export function loadShowcaseIcons() {
  if (!showcaseLoadPromise) {
    showcaseLoadPromise = import('./showcase.js').then((m) => {
      for (const [name, entry] of Object.entries(m.ewShowcasePaths)) {
        if (!registry.has(name)) registry.set(name, createSvgIcon(entry))
      }
      iconRegistryVersion.value++
      return m
    })
  }
  return showcaseLoadPromise
}
