/**
 * 密度上下文（tools-ui 计划 03 §3.1：密度是根级属性，不是组件 prop）
 *
 * EtProvider 把 density 写入 provide + <html data-density>；组件不感知密度档位，
 * 只引用令牌（--et-density-* / --et-size-* 由 data-density 选择器切换）。
 * 本 composable 只服务"需要按档位分支"的极少数场景（如视觉断言与测试）。
 */
import { inject, computed, isRef, unref } from 'vue'

export const ET_DENSITY_KEY = Symbol('et-density')

/** 三档密度（紧凑 / 默认 / 宽松） */
export const ET_DENSITIES = ['compact', 'default', 'relaxed']

/**
 * 读取当前密度档位（缺省 'default' —— 未挂 EtProvider 时组件仍可用）
 *
 * EtProvider provide 的是 computed（保持 prop 变更的响应性），Vue 的 inject 不会
 * 自动解包 ref，故这里显式 unref；同时容忍直接 provide 字符串的写法。
 * @returns {import('vue').ComputedRef<'compact'|'default'|'relaxed'>}
 */
export function useDensity() {
  const injected = inject(ET_DENSITY_KEY, null)
  return computed(() => {
    if (injected === null || injected === undefined) return 'default'
    const value = isRef(injected) ? injected.value : unref(injected)
    return value ?? 'default'
  })
}
