/**
 * 组件平台兼容注册表（文档站展示口径）
 *
 * both   — 双端兼容：桌面与移动端均保证样式可用（文档页显示 桌面 + 手机 双图标）
 * desktop— 仅桌面端保证样式（只显示桌面图标；新组件默认归入此类，移动端可用后再登记）
 * mobile — 移动端专属（只显示手机图标，文档页只收在 /mobile/components/）
 *
 * 判定口径：以「实际在 375px 演示壳/真机宽度下验证过」为准，不凭感觉放行；
 * 移动端可用性验证通过后把 slug 从 desktop 语义挪进 BOTH 列表即可。
 */
export const PLATFORM_BOTH = [
  'alert',
  'avatar',
  'avatar-group',
  'badge',
  'button',
  'card',
  'container',
  'field',
  'icon',
  'icon-button',
  'input',
  'keycap',
  'quote',
  'search-box',
  'section',
  'select',
  'statistic',
  'switch',
  'tabs',
  'tag',
  'textarea',
  'timeline',
]

/** 移动端专属组件（文档页位于 /mobile/components/，不在桌面组件列表中） */
export const PLATFORM_MOBILE = ['pull-refresh', 'load-more', 'action-sheet', 'tabbar', 'nav-bar']

/** 非组件文档页（不展示平台标识） */
const NON_COMPONENT = ['overview', 'icons']

/**
 * 由 VitePress relativePath 解析平台兼容档位
 * @param {string} relativePath 如 'components/button.md'、'mobile/components/tabbar.md'
 * @returns {'both' | 'desktop' | 'mobile' | null} null 表示本页不展示标识
 */
export function resolvePlatform(relativePath) {
  if (!relativePath) return null
  const m = relativePath.match(/^(?:mobile\/)?components\/([a-z0-9-]+)\.md$/)
  if (!m) return null
  const slug = m[1]
  if (relativePath.startsWith('mobile/')) return 'mobile'
  if (NON_COMPONENT.includes(slug)) return null
  if (PLATFORM_MOBILE.includes(slug)) return 'mobile'
  if (PLATFORM_BOTH.includes(slug)) return 'both'
  return 'desktop'
}
