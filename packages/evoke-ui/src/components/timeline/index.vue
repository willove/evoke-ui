<template>
  <div class="ew-timeline">
    <div v-for="(item, i) in items" :key="i" class="ew-timeline__item" :class="{ 'is-latest': i === 0 && highlightLatest }">
      <span class="ew-timeline__dot" aria-hidden="true" />
      <div class="ew-timeline__meta">
        <span v-if="item.date" class="ew-timeline__date">{{ item.date }}</span>
        <EwTag v-if="item.tag" :tone="item.tagTone || 'primary'" size="small">{{ item.tag }}</EwTag>
      </div>
      <h4 class="ew-timeline__title">
        <slot name="title" :item="item" :index="i">{{ item.title }}</slot>
      </h4>
      <p v-if="item.description" class="ew-timeline__description">
        <slot name="description" :item="item" :index="i">{{ item.description }}</slot>
      </p>
    </div>
  </div>
</template>

<script setup>
/**
 * EwTimeline — 时间线/更新日志
 * items：[{ date?, tag?, tagTone?, title, description? }]，最新一条默认高亮圆点
 */
import EwTag from '../tag/index.vue'

defineProps({
  items: { type: Array, default: () => [] },
  /** 最新条目圆点着主色 */
  highlightLatest: { type: Boolean, default: true },
})
</script>

<style src="./style.css"></style>
