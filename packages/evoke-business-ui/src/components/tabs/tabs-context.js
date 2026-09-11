/**
 * Tabs 子组件契约（EbTabPane 向 EbTabs provide/inject）
 */
import { inject, provide } from 'vue'

export const tabsContextKey = Symbol('evTabsContext')

export function useTabsContext() {
  return inject(tabsContextKey, null)
}

export function provideTabsContext(context) {
  provide(tabsContextKey, context)
}
