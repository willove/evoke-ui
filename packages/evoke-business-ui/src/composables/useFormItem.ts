/**
 * 表单契约 — 三层 provide/inject
 * EbForm(formContext) → EbFormItem(formItemContext) → 输入类组件 inject
 * trigger 语义：blur / change
 */
import { inject, computed, unref } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import { configProviderContextKey } from './useConfigProvider'
import type { ConfigProviderContext } from './useConfigProvider'

export const formContextKey = Symbol('evFormContext')
export const formItemContextKey = Symbol('evFormItemContext')

export interface FormContext {
  size: Ref<string>
  disabled?: Ref<boolean>
}

export interface FormItemContext {
  size: Ref<string>
  disabled?: Ref<boolean>
  validate?: (trigger: 'blur' | 'change') => Promise<unknown> | undefined
}

/** 通用 size prop 声明（display 类组件也可消费 useFormItem 继承） */
export const useSizeProp = {
  type: String,
  default: 'default',
  validator: (v: string) => ['', 'default', 'small', 'large'].includes(v),
}

export interface UseFormItemOptions {
  /** 组件自身 size prop */
  size?: Ref<string | undefined> | string
  /** 组件自身 disabled prop */
  disabled?: Ref<boolean | undefined> | boolean
}

/**
 * 输入类组件消费：从 FormItem 继承 size/disabled/校验触发
 */
export function useFormItem(options: UseFormItemOptions = {}): {
  form: FormContext | null
  formItem: FormItemContext | null
  size: ComputedRef<string>
  disabled: ComputedRef<boolean>
} {
  const form = inject<FormContext | null>(formContextKey, null)
  const formItem = inject<FormItemContext | null>(formItemContextKey, null)
  const config = inject<ConfigProviderContext | null>(configProviderContextKey, null)

  const size = computed(() => {
    const own = unref(options.size)
    if (own && own !== '') return own
    if (formItem?.size && formItem.size.value !== '') return formItem.size.value
    if (form?.size && form.size.value !== '') return form.size.value
    if (config?.size?.value) return config.size.value
    return 'default'
  })

  const disabled = computed(() => {
    const own = unref(options.disabled)
    if (own !== undefined && own !== false) return true
    if (formItem?.disabled?.value) return true
    if (form?.disabled?.value) return true
    return false
  })

  return { form, formItem, size, disabled }
}

/**
 * 输入类组件触发校验（Form 内使用时）
 * 校验失败是预期状态（is-error 渲染），reject 静默处理避免 unhandled rejection
 */
export function triggerFormValidate(
  formItem: FormItemContext | null | undefined,
  trigger: 'blur' | 'change',
): void {
  try {
    formItem?.validate?.(trigger)?.catch?.(() => {})
  } catch {
    /* validate 同步抛错时静默 */
  }
}
