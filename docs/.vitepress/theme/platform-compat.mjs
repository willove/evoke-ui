/**
 * 组件平台兼容注册表（docs 站展示口径，与 docs-web 的同名机制一致）
 *
 * both   — 双端兼容：桌面与移动端均保证样式可用（文档页显示 电脑 + 手机 双图标）
 * desktop— 仅桌面端保证样式（只显示电脑图标；未登记的组件默认归入此类）
 * mobile — 移动端专属（只显示手机图标，文档页只收在 /mobile/components/）
 *
 * 判定口径：以「实际在 /mobile 板块 375px 演示壳里验证过」为准——
 * 下列 both 组件均在移动端文档页的舞台演示中实际使用；新组件验证通过后再登记。
 */
export const PLATFORM_BOTH = [
  'avatar',
  'button',
  'cell-stack',
  'dialog',
  'divider',
  'drawer',
  'form',
  'input',
  'message',
  'segmented',
  'status-tag',
  'tabs',
  'tag',
]

/** 移动端专属组件（文档页位于 /mobile/components/，不在桌面组件分类中） */
export const PLATFORM_MOBILE = ['pull-refresh', 'load-more', 'action-sheet', 'tabbar', 'nav-bar']

/** 非组件文档页（不展示平台标识） */
const NON_COMPONENT = ['overview']

/**
 * 由路由路径解析平台兼容档位
 * @param {string} path 如 '/components/button'、'/mobile/components/tabbar.html'
 * @returns {'both' | 'desktop' | 'mobile' | null} null 表示本页不展示标识
 */
export function resolvePlatform(path) {
  if (!path) return null
  const m = path.match(/\/(mobile\/)?components\/([a-z0-9-]+?)(?:\.html)?\/?$/)
  if (!m) return null
  const slug = m[2]
  if (m[1]) return 'mobile'
  if (NON_COMPONENT.includes(slug)) return null
  if (PLATFORM_MOBILE.includes(slug)) return 'mobile'
  if (PLATFORM_BOTH.includes(slug)) return 'both'
  return 'desktop'
}
