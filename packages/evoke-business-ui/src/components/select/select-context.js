/**
 * Select 子组件注册契约（Option/OptionGroup 向 Select provide/inject）
 */
import { inject, provide } from 'vue'

export const selectContextKey = Symbol('evSelectContext')

/**
 * EvOption / EvOptionGroup 消费 Select 上下文
 */
export function useSelectContext() {
  return inject(selectContextKey, null)
}

/**
 * EvSelect 提供上下文（plain object，禁止 reactive 包装）
 */
export function provideSelectContext(context) {
  provide(selectContextKey, context)
}
