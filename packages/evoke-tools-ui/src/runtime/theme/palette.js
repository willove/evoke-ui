/**
 * 主题 → 画布调色板契约（tools-ui 计划 05 L4 / M3 交付物 4）
 *
 * 问题：画布（表格网格、选区、活动格）的色值归产品层 `--ot-*`，但"随主题联动"是框架责任。
 * 做法：**只做映射，不做取值**——登记表把每个画布角色（canvas-bg / grid-line /
 * selection-bg / active-cell…）映射到**主题侧已有令牌名**（--eb-* / --et-*），
 * 运行期用 getComputedStyle 从 :root 读实际值，写成 --ot-* 供画布消费。
 *   · 无硬编码色值（G1 红线）：本文件只有令牌名，没有任何颜色字面量；
 *   · 明暗/品牌换色即时联动：令牌值变了，重跑一次 applyCanvasPalette 即可；
 *   · 缺失令牌显式降级（value 为空时不写 --ot-*，让画布侧自己兜底，不静默注入错色）。
 */

/** 画布角色 → 主题侧令牌名（唯一事实源；加角色只改这张表） */
export const CANVAS_PALETTE = {
  'canvas-bg': '--eb-bg-color',
  'canvas-grid-line': '--eb-border-color-lighter',
  'canvas-header-bg': '--eb-fill-color-light',
  'canvas-header-text': '--eb-text-color-primary',
  'canvas-selection-bg': '--eb-color-primary-light-9',
  'canvas-selection-border': '--eb-color-primary',
  'canvas-active-cell-border': '--eb-color-primary',
  'canvas-comment-bg': '--eb-color-warning-light-9',
  'canvas-text': '--eb-text-color-regular',
  'canvas-text-muted': '--eb-text-color-secondary',
}

/** 调色板条目：{ token, value }；value 空 = 主题侧没这个令牌（调用方降级） */
export function resolveCanvasPalette(themeStyle, palette = CANVAS_PALETTE) {
  const read = (name) => {
    if (!themeStyle || typeof themeStyle.getPropertyValue !== 'function') return ''
    return (themeStyle.getPropertyValue(name) || '').trim()
  }
  const out = {}
  for (const [role, token] of Object.entries(palette)) {
    out[role] = { token, value: read(token) }
  }
  return out
}

/**
 * 把调色板写进宿主（默认 document.documentElement）：只写有值的角色，
 * 空值角色**不碰**已存在的 --ot-*（避免下游拿到空串色）。
 * @returns {string[]} 实际写入的角色名（调用方可断点/测试）
 */
export function applyCanvasPalette(target, palette) {
  if (!target || typeof target.setProperty !== 'function') return []
  const written = []
  for (const [role, entry] of Object.entries(palette)) {
    const value = entry && typeof entry === 'object' ? entry.value : entry
    if (!value) continue
    target.setProperty(`--ot-${role}`, value)
    written.push(role)
  }
  return written
}

/**
 * 订阅式刷新：主题变了（明暗切换 / 品牌换色）重跑一次解析+落值。
 * 返回取消订阅函数（06 §四：订阅必须可退订，禁泄漏）。
 * @param {(palette: object) => void} onChange 每次刷新后的调色板
 */
export function observeThemeChanges(target, getThemeStyle, onChange, palette = CANVAS_PALETTE) {
  if (typeof MutationObserver === 'undefined' || !target) {
    return () => {}
  }
  let last = ''
  const emit = () => {
    const resolved = resolveCanvasPalette(getThemeStyle(), palette)
    const signature = Object.values(resolved)
      .map((e) => e.value)
      .join('|')
    if (signature === last) return
    last = signature
    applyCanvasPalette(target, resolved)
    onChange?.(resolved)
  }
  // 主题值都挂在 :root 的 style/class 上：html 元素的属性/样式变化即全域联动信号
  const mo = new MutationObserver(emit)
  mo.observe(target, { attributes: true, attributeFilter: ['class', 'style', 'data-theme', 'data-density'] })
  emit()
  return () => mo.disconnect()
}
