/**
 * Table 子组件契约（EvTableColumn 向 EvTable provide/inject）
 */
import { inject, provide } from 'vue'

export const tableContextKey = Symbol('evTableContext')

export function useTableContext() {
  return inject(tableContextKey, null)
}

export function provideTableContext(context) {
  provide(tableContextKey, context)
}
