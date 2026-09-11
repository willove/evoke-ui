<template>
  <div class="ev-timeline">
    <div v-for="(item, i) in items" :key="i" class="ev-timeline__item" :class="{ 'is-latest': i === 0 && highlightLatest }">
      <span class="ev-timeline__dot" aria-hidden="true" />
      <div class="ev-timeline__meta">
        <span v-if="item.date" class="ev-timeline__date">{{ item.date }}</span>
        <EvTag v-if="item.tag" :tone="item.tagTone || 'primary'" size="small">{{ item.tag }}</EvTag>
      </div>
      <h4 class="ev-timeline__title">
        <slot name="title" :item="item" :index="i">{{ item.title }}</slot>
      </h4>
      <p v-if="item.description" class="ev-timeline__description">
        <slot name="description" :item="item" :index="i">{{ item.description }}</slot>
      </p>
    </div>
  </div>
</template>

<script setup>
/**
 * EvTimeline — 时间线/更新日志
 * items：[{ date?, tag?, tagTone?, title, description? }]，最新一条默认高亮圆点
 */
import EvTag from '../tag/index.vue'

defineProps({
  items: { type: Array, default: () => [] },
  /** 最新条目圆点着主色 */
  highlightLatest: { type: Boolean, default: true },
})
</script>

<style src="./style.css"></style>
