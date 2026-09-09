/**
 * Tabs 子组件契约（EvTabPane 向 EvTabs provide/inject）
 */
import { inject, provide } from 'vue'

export const tabsContextKey = Symbol('evTabsContext')

export function useTabsContext() {
  return inject(tabsContextKey, null)
}

export function provideTabsContext(context) {
  provide(tabsContextKey, context)
}
