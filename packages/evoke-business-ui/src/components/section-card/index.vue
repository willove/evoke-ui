<template>
  <div class="eb-section-card" :class="{ 'is-glass': glass === true, 'no-glass': glass === false }">
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
defineProps({
  /** 磨砂玻璃质感：true 强制开 / false 强制关 / 缺省跟随全局（EbConfigProvider 的 glass） */
  glass: { type: Boolean, default: undefined },
  title: { type: String, default: '' },
  padding: { type: Boolean, default: true },
})
</script>

<style src="./style.css"></style>
