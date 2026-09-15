/**
 * useUncontrolled — 受控 / 非受控双模式
 *
 * 宿主传入了 modelValue（含 v-model 或单向 :model-value）时为受控模式，值完全由宿主驱动；
 * 宿主什么都没传时组件自持内部状态（defaultValue 提供初值）——
 * 静态站点复制一个组件标签即可交互，无需胶水代码。
 *
 * 返回 { value, set }：模板与逻辑一律读写 value，变更时调 set(v)。
 */
import { computed, getCurrentInstance, ref } from 'vue'
import type { ComputedRef, Ref } from 'vue'

export function useUncontrolled<T = unknown>(
  props: { modelValue?: T },
  { defaultValue }: { defaultValue?: T } = {},
): {
  value: ComputedRef<T | undefined>
  set: (v: T) => T
  isControlled: ComputedRef<boolean>
} {
  const instance = getCurrentInstance()
  const isControlled = computed(() => {
    const vnodeProps = instance?.vnode?.props
    return !!vnodeProps && ('modelValue' in vnodeProps || 'onUpdate:modelValue' in vnodeProps)
  })

  const inner = ref(defaultValue !== undefined ? defaultValue : props.modelValue) as Ref<T | undefined>
  const value = computed(() => (isControlled.value ? props.modelValue : inner.value))

  function set(v: T): T {
    if (!isControlled.value) inner.value = v
    return v
  }

  return { value, set, isControlled }
}
