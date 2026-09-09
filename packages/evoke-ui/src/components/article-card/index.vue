<template>
  <component :is="tag" :class="['ew-article-card', { 'is-hoverable': hoverable }]" :href="tag === 'a' ? href : undefined">
    <div class="ew-article-card__cover" :style="coverStyle">
      <img v-if="cover" :src="cover" :alt="title" loading="lazy" />
      <EwIcon v-else-if="icon" :name="icon" :size="28" class="ew-article-card__cover-icon" />
    </div>
    <div class="ew-article-card__body">
      <div class="ew-article-card__meta">
        <span v-if="date" class="ew-article-card__date">{{ date }}</span>
        <span v-for="t in tags" :key="t" class="ew-article-card__tag">{{ t }}</span>
      </div>
      <h4 class="ew-article-card__title">
        <slot name="title">{{ title }}</slot>
      </h4>
      <p v-if="excerpt || $slots.excerpt" class="ew-article-card__excerpt">
        <slot name="excerpt">{{ excerpt }}</slot>
      </p>
    </div>
  </component>
</template>

<script setup>
/**
 * EwArticleCard — 文章卡（博客/动态/教程列表）
 * 封面（缺省用图标占位）+ 日期与标签元信息 + 标题 + 摘要；整卡可链接
 */
import { computed } from 'vue'
import EwIcon from '../icon/index.vue'

const props = defineProps({
  title: { type: String, default: '' },
  excerpt: { type: String, default: '' },
  cover: { type: String, default: '' },
  /** 无封面时的占位图标 */
  icon: { type: String, default: 'compass-3-line' },
  date: { type: String, default: '' },
  tags: { type: Array, default: () => [] },
  href: { type: String, default: '' },
  /** 整卡链接（tag 传 'a' 时生效） */
  tag: { type: String, default: 'article' },
  hoverable: { type: Boolean, default: true },
})

const coverStyle = computed(() =>
  props.cover ? undefined : { background: 'linear-gradient(135deg, var(--ew-fill-1), var(--ew-bg-soft))' }
)
</script>

<style src="./style.css"></style>
