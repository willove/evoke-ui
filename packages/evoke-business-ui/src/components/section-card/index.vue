<template>
  <div class="eb-section-card" :class="{ 'is-glass': glass === true, 'no-glass': glass === false }" :style="glassVars">
    <div v-if="title || $slots.header || $slots.extra" class="eb-section-card__header">
      <div class="eb-section-card__header-left">
        <h3 v-if="title">{{ title }}</h3>
        <slot name="header" />
      </div>
      <div v-if="$slots.extra" class="eb-section-card__extra">
        <slot name="extra" />
      </div>
    </div>
    <div class="eb-section-card__body" :class="{ 'eb-section-card__body--no-padding': !padding }">
      <slot />
    </div>
  </div>
</template>

<script setup>
/**
 * EbSectionCard — 区块卡片
 */
import { computed } from 'vue'

const props = defineProps({
  /** 磨砂玻璃质感：true 强制开 / false 强制关 / 缺省跟随全局（EbConfigProvider 的 glass） */
  glass: { type: Boolean, default: undefined },
  /** 磨砂模糊半径（px）：内联覆盖 --eb-glass-blur 令牌，仅磨砂生效时应用；缺省跟随令牌（14px） */
  blur: { type: [Number, String], default: undefined },
  title: { type: String, default: '' },
  padding: { type: Boolean, default: true },
})

// 组件级磨砂强度：内联覆盖 --eb-glass-blur，缺省不产出内联样式（跟随令牌）
const glassVars = computed(() => {
  if (props.blur === undefined || props.blur === null || props.blur === '') return undefined
  return { '--eb-glass-blur': typeof props.blur === 'number' ? `${props.blur}px` : props.blur }
})
</script>

<style src="./style.css"></style>
