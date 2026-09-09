<template>
  <div
    v-show="active"
    class="ev-tab-pane ev-tab-pane"
    role="tabpanel"
    :aria-hidden="!active"
  >
    <slot v-if="shouldRender" />
  </div>
</template>

<script setup>
/**
 * EvTabPane — 标签页项（onMounted 向 EvTabs 注册，）
 */
import { computed, onMounted, onBeforeUnmount, ref, useSlots, watch } from 'vue'
import { useTabsContext } from './tabs-context'

defineOptions({ name: 'EvTabPane' })

const props = defineProps({
  label: { type: String, default: '' },
  name: { type: [String, Number], default: '' },
  disabled: { type: Boolean, default: false },
  closable: { type: Boolean, default: undefined },
  lazy: { type: Boolean, default: false },
})

const ctx = useTabsContext()
const slots = useSlots()
/** lazy 模式：激活过才渲染（保持挂载） */
const loaded = ref(false)

const paneName = computed(() => (props.name !== '' ? props.name : props.label))

const active = computed(() => ctx?.currentName.value === paneName.value)

const shouldRender = computed(() => {
  if (props.lazy || ctx?.lazy?.value) return loaded.value
  return true
})

// active 首次 true 时标记 loaded（lazy 渲染）
if (active.value) loaded.value = true
watch(active, (val) => {
  if (val) loaded.value = true
})

const pane = {
  get paneName() {
    return paneName.value
  },
  get label() {
    return props.label
  },
  get disabled() {
    return props.disabled
  },
  get closable() {
    return props.closable ?? false
  },
  get slots() {
    return slots
  },
}

onMounted(() => {
  ctx?.registerPane?.(pane)
})

onBeforeUnmount(() => {
  ctx?.unregisterPane?.(pane)
})
</script>

<style src="./pane.css"></style>
