<script>
/**
 * 密度档 → 底座 EbSelect size 的映射（tools-ui 计划 05 §三；导出供单测）。
 *
 * 底座 size 合法取值只有 ''（默认）/ 'small' / 'large'（见 EbSelect sizeClass）。
 * 工具界面不发明新档位，直接映射到控件高 24/32/40（Fluent small/medium/large 阶梯）：
 *   compact 紧凑 → small、default 默认 → ''、relaxed 宽松 → large。
 * 调用方显式传入 size 时以调用方为准（组件里用 `props.size ?? map(...)`）。
 * @param {'compact'|'default'|'relaxed'} density
 * @returns {''|'small'|'large'}
 */
export function mapDensityToSelectSize(density) {
  if (density === 'compact') return 'small'
  if (density === 'relaxed') return 'large'
  return ''
}
</script>

<script setup>
import { computed, ref } from 'vue'
import EbSelect from '@wil-works/evoke-business-ui/select'
import { useDensity } from '../../composables/useDensity'

defineOptions({ name: 'EtSelect', inheritAttrs: false })

const props = defineProps({
  modelValue: { type: [String, Number, Boolean, Array, Object], default: '' },
  /** 显式传入则优先；缺省按当前密度档映射（mapDensityToSelectSize） */
  size: { type: String, default: undefined },
})

const emit = defineEmits([
  'update:modelValue',
  'change',
  'clear',
  'visible-change',
  'remove-tag',
  'filter-change',
  'blur',
  'focus',
])

// 密度档读取：未挂 EtProvider 时 useDensity 回落字符串 'default'；
// 挂 EtProvider 时 EtProvider 以 computed ref 注入，useDensity 又包一层 computed，
// 此处 .value 会是那个 ref —— 统一归一化成字符串档位（不修改底座 composable）。
const density = useDensity()
const densityValue = computed(() => {
  const raw = density.value
  if (typeof raw === 'string') return raw
  return (raw && typeof raw === 'object' && 'value' in raw && raw.value) || 'default'
})

// 密度 → size：props.size 显式优先（含 '' 空串，可用 ?? 保留），否则按密度映射
const resolvedSize = computed(() => props.size ?? mapDensityToSelectSize(densityValue.value))

const baseRef = ref(null)
// 转发底座命令式方法（读底座源码：defineExpose({ focus, blur, toggleDropdown, clearSelection, updateDropdown })）
defineExpose({
  focus: (...args) => baseRef.value?.focus?.(...args),
  blur: (...args) => baseRef.value?.blur?.(...args),
  toggleDropdown: (...args) => baseRef.value?.toggleDropdown?.(...args),
  clearSelection: (...args) => baseRef.value?.clearSelection?.(...args),
  updateDropdown: (...args) => baseRef.value?.updateDropdown?.(...args),
})
</script>

<template>
  <eb-select
    ref="baseRef"
    v-bind="$attrs"
    class="et-select"
    :model-value="modelValue"
    :size="resolvedSize"
    @update:model-value="(v) => emit('update:modelValue', v)"
    @change="(v) => emit('change', v)"
    @clear="() => emit('clear')"
    @visible-change="(v) => emit('visible-change', v)"
    @remove-tag="(v) => emit('remove-tag', v)"
    @filter-change="(v) => emit('filter-change', v)"
    @blur="(e) => emit('blur', e)"
    @focus="(e) => emit('focus', e)"
  >
    <template v-for="(_, SlotName) in $slots" #[SlotName]="slotProps">
      <slot :name="SlotName" v-bind="slotProps || {}" />
    </template>
  </eb-select>
</template>

<style src="./style.css"></style>
