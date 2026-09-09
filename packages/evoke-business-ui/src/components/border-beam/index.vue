<template>
  <div class="ev-border-beam" :class="{ 'is-active': active }" :style="beamVars">
    <div class="ev-border-beam__inner">
      <slot />
    </div>
  </div>
</template>

<script setup>
/**
 * EvBorderBeam — 装饰性边框流光
 * conic-gradient + CSS @property 驱动旋转光带，纯 CSS 动画零 JS 开销。
 * 装饰定位：不携带业务状态语义。
 */
import { computed } from 'vue'

const props = defineProps({
  active: { type: Boolean, default: true },
  color: { type: String, default: '' },
  colorTo: { type: String, default: undefined },
  size: { type: Number, default: 2 },
  radius: { type: Number, default: 8 },
  duration: { type: Number, default: 6 },
  delay: { type: Number, default: 0 },
  padding: { type: Number, default: 0 },
  background: { type: String, default: 'transparent' },
})

const beamVars = computed(() => {
  const color = props.color || 'var(--ev-color-primary, #175DFF)'
  const colorTo = props.colorTo != null
    ? props.colorTo
    : `color-mix(in srgb, ${color} 0%, transparent)`
  return {
    '--ev-bb-color': color,
    '--ev-bb-color-to': colorTo,
    '--ev-bb-size': `${props.size}px`,
    '--ev-bb-radius': `${props.radius}px`,
    '--ev-bb-duration': `${props.duration}s`,
    '--ev-bb-delay': `${props.delay}s`,
    '--ev-bb-padding': `${props.padding}px`,
    '--ev-bb-bg': props.background,
  }
})
</script>

<style src="./style.css"></style>
