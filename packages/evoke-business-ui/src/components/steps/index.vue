<template>
  <div
    class="eb-steps eb-steps"
    :class="[`is-${direction}`, { 'is-center': alignCenter, 'is-simple': simple }]"
  >
    <slot />
  </div>
</template>

<script setup>
/**
 * EbSteps — 步骤条容器
 * 状态计算在子项内完成；space/方向等经 provide 下发，子项按注册顺序编号
 */
import { provide, toRef, computed, reactive } from 'vue'

const props = defineProps({
  space: { type: [Number, String], default: '' },
  direction: {
    type: String,
    default: 'horizontal',
    validator: (v) => ['horizontal', 'vertical'].includes(v),
  },
  active: { type: Number, default: 0 },
  processStatus: {
    type: String,
    default: 'process',
    validator: (v) => ['wait', 'process', 'finish', 'error', 'success'].includes(v),
  },
  finishStatus: {
    type: String,
    default: 'finish',
    validator: (v) => ['wait', 'process', 'finish', 'error', 'success'].includes(v),
  },
  alignCenter: { type: Boolean, default: false },
  simple: { type: Boolean, default: false },
})

// 子项按挂载顺序登记 uid → 序号
const uids = []
const registry = {
  register(uid) {
    uids.push(uid)
    return uids.length - 1
  },
  unregister(uid) {
    const i = uids.indexOf(uid)
    if (i !== -1) uids.splice(i, 1)
  },
}

provide('stepsRegistry', registry)
provide('stepsContext', {
  active: toRef(props, 'active'),
  processStatus: toRef(props, 'processStatus'),
  finishStatus: toRef(props, 'finishStatus'),
  space: toRef(props, 'space'),
  direction: toRef(props, 'direction'),
  simple: toRef(props, 'simple'),
  alignCenter: computed(() => props.alignCenter || props.simple),
})
</script>

<style src="./style.css"></style>
