<template>
  <figure :class="['ev-quote', { 'is-sticker': sticker }]">
    <blockquote class="ev-quote__text">
      <slot>{{ quote }}</slot>
    </blockquote>
    <figcaption class="ev-quote__author">
      <slot name="author">
        <span class="ev-quote__name">{{ author }}</span>
        <span v-if="role" class="ev-quote__role">{{ role }}</span>
        <a
          v-if="source && sourceHref"
          :href="sourceHref"
          target="_blank"
          rel="noopener"
          class="ev-quote__source"
        >
          {{ source }}
          <EvIcon name="external-link" :size="12" />
        </a>
      </slot>
    </figcaption>
  </figure>
</template>

<script setup>
/**
 * EvQuote — 引用/评价卡（launchos 用户评价语言）
 */
import EvIcon from '../icon/index.vue'

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
