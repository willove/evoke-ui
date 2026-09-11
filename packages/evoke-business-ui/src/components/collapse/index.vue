<template>
  <div class="eb-collapse eb-collapse" role="presentation">
    <slot />
  </div>
</template>

<script setup>
/**
 * EbCollapse — 折叠面板容器
 * 子项通过 provide 注册；v-model / accordion 状态集中管理
 */
import { provide, ref, toRef, watch } from 'vue'

const props = defineProps({
  modelValue: { type: [Array, String, Number], default: () => [] },
  accordion: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'change'])

const activeNames = ref(Array.isArray(props.modelValue) ? [...props.modelValue] : (props.modelValue !== undefined && props.modelValue !== '' ? [props.modelValue] : []))

watch(
  () => props.modelValue,
  (val) => {
    activeNames.value = Array.isArray(val) ? [...val] : (val !== undefined && val !== '' ? [val] : [])
  },
)

function setActive(names) {
  activeNames.value = names
  const payload = props.accordion ? (names[0] ?? '') : names
  emit('update:modelValue', payload)
  emit('change', payload)
}

function toggle(name) {
  if (props.accordion) {
    setActive(activeNames.value.includes(name) ? [] : [name])
  } else {
    setActive(
      activeNames.value.includes(name)
        ? activeNames.value.filter((n) => n !== name)
        : [...activeNames.value, name],
    )
  }
}

provide('collapseContext', {
  accordion: toRef(props, 'accordion'),
  activeNames,
  toggle,
})
</script>
