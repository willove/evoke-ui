<template>
  <figure :class="['ew-quote', { 'is-sticker': sticker }]">
    <blockquote class="ew-quote__text">
      <slot>{{ quote }}</slot>
    </blockquote>
    <figcaption class="ew-quote__author">
      <slot name="author">
        <span class="ew-quote__name">{{ author }}</span>
        <span v-if="role" class="ew-quote__role">{{ role }}</span>
        <a
          v-if="source && sourceHref"
          :href="sourceHref"
          target="_blank"
          rel="noopener"
          class="ew-quote__source"
        >
          {{ source }}
          <EwIcon name="external-link" :size="12" />
        </a>
      </slot>
    </figcaption>
  </figure>
</template>

<script setup>
/**
 * EwQuote — 引用/评价卡（launchos 用户评价语言）
 */
import EwIcon from '../icon/index.vue'

defineProps({
  quote: { type: String, default: '' },
  author: { type: String, default: '' },
  role: { type: String, default: '' },
  source: { type: String, default: '' },
  sourceHref: { type: String, default: '' },
  /** 贴纸风描边 */
  sticker: { type: Boolean, default: false },
})
</script>

<style src="./style.css"></style>
