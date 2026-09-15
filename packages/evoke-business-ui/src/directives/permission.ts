/**
 * v-permission — 权限指令
 *
 * 用法：
 *   v-permission="'sys:user:delete'"                       无权限时移除元素
 *   v-permission="{ has: ['a','b'], mode: 'disable' }"     无权限时禁用（保留占位）
 *   v-permission="{ has: (perms) => perms.includes('x') }" 自定义判定
 *
 * mode: 'remove'（默认，卸载即从 DOM 移除，不可恢复） | 'disable'（加 is-permission-disabled 类并置 disabled）
 * 权限来源：ConfigProvider permissions > setPermissions()；动态权限变化在 disable 模式下实时生效
 */
import { watchEffect } from 'vue'
import type { Directive, DirectiveBinding, WatchStopHandle } from 'vue'
import { usePermission } from '../composables/usePermission'
import type { PermissionRequirement } from '../composables/usePermission'

export interface PermissionDirectiveValue {
  /** 权限判定入参：精确码 / 码表 / 自定义判定 */
  has: PermissionRequirement
  mode?: 'remove' | 'disable'
}

export type PermissionValue = string | PermissionDirectiveValue | null | undefined

type PermissionEl = HTMLElement & { __evPermissionStop?: WatchStopHandle | null }

export function createPermissionDirective(): Directive<PermissionEl, PermissionValue> {
  return {
    mounted(el, binding: DirectiveBinding<PermissionValue>) {
      const { has } = usePermission()
      el.__evPermissionStop = watchEffect(() => {
        const value = binding.value
        const mode = typeof value === 'object' && value !== null ? value.mode || 'remove' : 'remove'
        const required = typeof value === 'object' && value !== null ? value.has : value
        const allowed = has(required)
        if (allowed) {
          el.style.pointerEvents = ''
          el.classList.remove('is-permission-disabled')
          if (mode === 'disable') (el as HTMLInputElement).disabled = false
        } else if (mode === 'disable') {
          el.classList.add('is-permission-disabled')
          el.style.pointerEvents = 'none'
          if ('disabled' in el) (el as HTMLInputElement).disabled = true
        } else if (el.parentNode) {
          el.parentNode.removeChild(el)
        }
      })
    },
    unmounted(el) {
      el.__evPermissionStop?.()
    },
  }
}
