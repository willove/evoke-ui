/**
 * Dropdown 子组件契约（EbDropdownMenu/Item 向 EbDropdown provide/inject）
 */
import { inject, provide } from 'vue'

export const dropdownContextKey = Symbol('evDropdownContext')

export function useDropdownContext() {
  return inject(dropdownContextKey, null)
}

export function provideDropdownContext(context) {
  provide(dropdownContextKey, context)
}
