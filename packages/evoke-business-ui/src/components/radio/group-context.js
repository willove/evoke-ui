/**
 * Radio/Checkbox 组上下文 — provide/inject 契约
 */
import { inject } from 'vue'

export const radioGroupContextKey = Symbol('evRadioGroupContext')
export const checkboxGroupContextKey = Symbol('evCheckboxGroupContext')

/**
 * 子 Radio 消费 group context（不在 group 内返回 null）
 */
export function useRadioGroup() {
  return inject(radioGroupContextKey, null)
}

/**
 * 子 Checkbox 消费 group context
 */
export function useCheckboxGroup() {
  return inject(checkboxGroupContextKey, null)
}
