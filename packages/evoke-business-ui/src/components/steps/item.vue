<template>
  <div
    class="eb-step eb-step"
    :class="[`is-${direction}`, { 'is-center': alignCenter, 'is-simple': simple }, `is-${currentStatus}`]"
    :style="stepStyle"
  >
    <div class="eb-step__head" :class="`is-${currentStatus}`">
      <div v-if="!simple" class="eb-step__line"><i class="eb-step__line-inner" /></div>
      <div class="eb-step__icon" :class="[`is-${currentStatus}`, { 'is-text': !icon }]">
        <slot name="icon">
          <eb-icon v-if="icon" :name="icon" :size="simple ? 16 : 22" />
          <span v-else class="eb-step__icon-inner">{{ index + 1 }}</span>
        </slot>
      </div>
    </div>
    <div class="eb-step__main">
      <div class="eb-step__title" :class="`is-${currentStatus}`">
        <slot name="title">{{ title }}</slot>
      </div>
      <div v-if="description || $slots.description" class="eb-step__description" :class="`is-${currentStatus}`">
        <slot name="description">{{ description }}</slot>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * EbStep — 步骤条项
 * 状态：idx < active → finish-status；=== active → process-status；> → wait；status prop 显式覆盖
 */
import { inject, computed, ref, onMounted, onBeforeUnmount, getCurrentInstance } from 'vue'
import EbIcon from '../icon/index.vue'

const props = defineProps({
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  icon: { type: String, default: '' },
  status: {
    type: String,
    default: '',
    validator: (v) => ['', 'wait', 'process', 'finish', 'error', 'success'].includes(v),
  },
})

const ctx = inject('stepsContext', null)
const registry = inject('stepsRegistry', null)

const instance = getCurrentInstance()
const index = ref(0)

onMounted(() => {
  index.value = registry ? registry.register(instance.uid) : 0
})
onBeforeUnmount(() => {
  registry?.unregister(instance.uid)
})

const currentStatus = computed(() => {
  if (props.status) return props.status
  if (!ctx) return 'process'
  if (index.value < ctx.active.value) return ctx.finishStatus.value
  if (index.value === ctx.active.value) return ctx.processStatus.value
  return 'wait'
})

const direction = computed(() => ctx?.direction?.value ?? 'horizontal')
const simple = computed(() => ctx?.simple?.value ?? false)
const alignCenter = computed(() => ctx?.alignCenter?.value ?? false)

const stepStyle = computed(() => {
  const space = ctx?.space?.value
  if (space) return { flexBasis: typeof space === 'number' ? `${space}px` : space }
  return undefined
})
</script>

<style src="./style.css"></style>
