/**
 * usePermission — 权限判定
 *
 * 权限来源优先级：ConfigProvider 注入 > setPermissions 全局注册
 * 支持三种判定形态：
 * - string：精确匹配，或 `模块:*` 前缀通配（注册表含 'sys:*' 时 'sys:user' 通过）
 * - string[]：任一满足即通过（hasAny 语义）
 * - function：(permissions) => boolean 自定义判定
 */
import { computed, inject, ref } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import { configProviderContextKey } from './useConfigProvider'
import type { ConfigProviderContext } from './useConfigProvider'

/** 权限判定入参：精确码 / 任一满足的码表 / 自定义判定 */
export type PermissionRequirement =
  | string
  | string[]
  | ((permissions: string[]) => boolean)
  | null
  | undefined

const globalPermissions: Ref<string[]> = ref([])

/** 全局注册权限码表（未使用 ConfigProvider 时的入口） */
export function setPermissions(list?: string[] | null): void {
  globalPermissions.value = Array.isArray(list) ? list : []
}

function matchPermission(code: string, permissions: string[]): boolean {
  if (permissions.includes(code)) return true
  // 'sys:*' 通配：注册表里的通配项覆盖其前缀下所有权限码
  return permissions.some((p) => p === '*' || (p.endsWith(':*') && code.startsWith(p.slice(0, -1))))
}

function resolve(required: PermissionRequirement, permissions: string[]): boolean {
  if (required == null) return true
  if (typeof required === 'function') return !!required(permissions)
  if (Array.isArray(required)) return required.some((r) => matchPermission(r, permissions))
  return matchPermission(required, permissions)
}

export function usePermission(): {
  permissions: ComputedRef<string[]>
  has: (required: PermissionRequirement) => boolean
  hasAny: (list: PermissionRequirement) => boolean
  hasAll: (list: string[]) => boolean
} {
  // ConfigProvider 注入的权限表优先
  const injected = inject<ConfigProviderContext | null>(configProviderContextKey, null)
  const permissions = computed(() => injected?.permissions?.value ?? globalPermissions.value)

  function has(required: PermissionRequirement): boolean {
    return resolve(required, permissions.value)
  }
  function hasAny(list: PermissionRequirement): boolean {
    return resolve(list, permissions.value)
  }
  function hasAll(list: string[]): boolean {
    if (!Array.isArray(list)) return has(list)
    return list.every((r) => matchPermission(r, permissions.value))
  }

  return { permissions, has, hasAny, hasAll }
}
