<template>
  <div class="ev-empty ev-empty">
    <div class="ev-empty__image" :style="imageStyle">
      <slot name="image">
        <svg viewBox="0 0 160 120" xmlns="http://www.w3.org/2000/svg" class="ev-empty__image-svg" aria-hidden="true">
          <!-- 文档底板 -->
          <rect x="24" y="4" width="96" height="104" rx="8" fill="var(--ev-fill-color-light)" />
          <!-- 内容行：标题 + 正文两行，右下留白给放大镜 -->
          <rect x="40" y="24" width="46" height="8" rx="4" fill="var(--ev-fill-color-darker)" />
          <rect x="40" y="42" width="62" height="8" rx="4" fill="var(--ev-fill-color)" />
          <rect x="40" y="60" width="38" height="8" rx="4" fill="var(--ev-fill-color)" />
          <!-- 放大镜 -->
          <circle cx="106" cy="86" r="16" fill="var(--ev-bg-color)" stroke="var(--ev-text-color-placeholder)" stroke-width="6" />
          <line x1="118" y1="98" x2="132" y2="112" stroke="var(--ev-text-color-placeholder)" stroke-width="8" stroke-linecap="round" />
        </svg>
      </slot>
    </div>
    <div class="ev-empty__description">
      <slot name="description">{{ description }}</slot>
    </div>
    <div v-if="$slots.default" class="ev-empty__bottom">
      <slot />
    </div>
  </div>
</template>

<script setup>
/**
 * EvEmpty — 空状态
 */
import { computed } from 'vue'

defineOptions({ name: 'EvEmpty' })

const props = defineProps({
  image: { type: String, default: '' },
  imageSize: { type: Number, default: 80 },
  description: { type: String, default: '暂无数据' },
})

const imageStyle = computed(() => ({ width: `${props.imageSize}px` }))
</script>

<style src="./style.css"></style>
