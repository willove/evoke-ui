<template>
  <li
    v-if="visible"
    class="eb-select-dropdown__item eb-select-option"
    :class="{
      'is-selected': isSelected,
      'is-disabled': isDisabled,
      'is-hovering': isHover,
    }"
    role="option"
    :aria-selected="isSelected"
    :aria-disabled="isDisabled || undefined"
    @mouseenter="isHovering = true"
    @mouseleave="isHovering = false"
    @click.stop="handleClick"
  >
    <slot>{{ label }}</slot>
  </li>
</template>

<script setup>
/**
 * EbOption — 选项（onMounted 向 Select 注册，）
 */
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import { useSelectContext } from './select-context'

defineOptions({ name: 'EbOption' })

const props = defineProps({
  value: { type: [String, Number, Boolean], required: true },
  label: { type: [String, Number], default: '' },
  disabled: { type: Boolean, default: false },
})

const ctx = useSelectContext()
const isHovering = ref(false)

const isSelected = computed(() =>
  ctx ? ctx.selectedValues.value.includes(props.value) : false
)

const isDisabled = computed(() => props.disabled || !!ctx?.disabled?.value)
const isHover = computed(() => isHovering.value || ctx?.hoveringOption?.value?.value === props.value)

const visible = computed(() => {
  if (!ctx) return true
  return ctx.filteredOptions.value.some((o) => o.value === props.value)
})

const item = computed(() => ({
  value: props.value,
  label: props.label !== '' && props.label !== undefined ? props.label : String(props.value),
  disabled: props.disabled,
}))

onMounted(() => {
  ctx?.registerOption?.(item.value)
})

onBeforeUnmount(() => {
  ctx?.unregisterOption?.(item.value)
})

function handleClick() {
  if (isDisabled.value) return
  ctx?.selectOption?.(item.value)
}
</script>

<style src="./option.css"></style>
