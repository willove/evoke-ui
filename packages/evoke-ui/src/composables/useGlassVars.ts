/**
 * useGlassVars — 磨砂参数 prop → 内联令牌（玻璃组件共用）
 *
 * blur → --ev-glass-blur（数字拼 px，字符串透传）
 * saturate → --ev-glass-saturate（数字/字符串，倍数）
 * tint → --ev-glass-bg（数字按百分比拼 color-mix 整值——百分比位不能走 var()；
 *        字符串透传，可直接给颜色值）
 *
 * 缺省不产出内联样式，跟随 :root 令牌；Boolean 值（如 Navbar 的滚动磨砂开关）
 * 一律跳过，不会误写进 blur()
 */
import { computed } from 'vue'
import type { ComputedRef, CSSProperties } from 'vue'

export interface GlassVarsProps {
  blur?: number | string
  saturate?: number | string
  tint?: number | string
}

function isParam(v: number | string | undefined): boolean {
  return (typeof v === 'number' && !Number.isNaN(v)) || (typeof v === 'string' && v !== '')
}

export function useGlassVars(props: GlassVarsProps): ComputedRef<CSSProperties | undefined> {
  return computed(() => {
    const vars: Record<string, string> = {}
    if (isParam(props.blur)) {
      vars['--ev-glass-blur'] = typeof props.blur === 'number' ? `${props.blur}px` : (props.blur as string)
    }
    if (isParam(props.saturate)) {
      vars['--ev-glass-saturate'] = String(props.saturate)
    }
    if (isParam(props.tint)) {
      vars['--ev-glass-bg'] = typeof props.tint === 'number'
        ? `color-mix(in srgb, var(--ev-bg-container) ${props.tint}%, transparent)`
        : (props.tint as string)
    }
    return Object.keys(vars).length ? (vars as CSSProperties) : undefined
  })
}
