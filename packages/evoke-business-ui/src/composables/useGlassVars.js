/**
 * useGlassVars — 磨砂参数 prop → 内联令牌（玻璃组件共用）
 *
 * blur → --eb-glass-blur（数字拼 px，字符串透传）
 * saturate → --eb-glass-saturate（数字/字符串，倍数）
 * tint → --eb-glass-bg（数字按百分比拼 color-mix 整值——百分比位不能走 var()；
 *        字符串透传，可直接给颜色值）
 *
 * 缺省不产出内联样式，跟随 :root 令牌。
 */
import { computed } from 'vue'

function isParam(v) {
  return (typeof v === 'number' && !Number.isNaN(v)) || typeof v === 'string' && v !== ''
}

export function useGlassVars(props) {
  return computed(() => {
    const vars = {}
    if (isParam(props.blur)) {
      vars['--eb-glass-blur'] = typeof props.blur === 'number' ? `${props.blur}px` : props.blur
    }
    if (isParam(props.saturate)) {
      vars['--eb-glass-saturate'] = String(props.saturate)
    }
    if (isParam(props.tint)) {
      vars['--eb-glass-bg'] = typeof props.tint === 'number'
        ? `color-mix(in srgb, var(--eb-bg-color) ${props.tint}%, transparent)`
        : props.tint
    }
    return Object.keys(vars).length ? vars : undefined
  })
}
