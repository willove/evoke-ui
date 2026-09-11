<template>
  <component :is="tag" :class="['ev-article-card', { 'is-hoverable': hoverable, 'is-glass': glass === true, 'no-glass': glass === false }]" :href="tag === 'a' ? href : undefined">
    <div class="ev-article-card__cover" :style="coverStyle">
      <img v-if="cover" :src="cover" :alt="title" loading="lazy" />
      <EvIcon v-else-if="icon" :name="icon" :size="28" class="ev-article-card__cover-icon" />
    </div>
    <div class="ev-article-card__body">
      <div class="ev-article-card__meta">
        <span v-if="date" class="ev-article-card__date">{{ date }}</span>
        <span v-for="t in tags" :key="t" class="ev-article-card__tag">{{ t }}</span>
      </div>
      <h4 class="ev-article-card__title">
        <slot name="title">{{ title }}</slot>
      </h4>
      <p v-if="excerpt || $slots.excerpt" class="ev-article-card__excerpt">
        <slot name="excerpt">{{ excerpt }}</slot>
      </p>
    </div>
  </component>
</template>

<script setup>
/**
 * EvArticleCard — 文章卡（博客/动态/教程列表）
 * 封面（缺省用图标占位）+ 日期与标签元信息 + 标题 + 摘要；整卡可链接
 */
import { computed } from 'vue'
import EvIcon from '../icon/index.vue'

const props = defineProps({
  /** 磨砂玻璃质感：true 强制开 / false 强制关 / 缺省跟随全局（ConfigProvider 的 glass） */
  glass: { type: Boolean, default: undefined },
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
  props.cover ? undefined : { background: 'linear-gradient(135deg, var(--ev-fill-1), var(--ev-bg-soft))' }
)
</script>

<style src="./style.css"></style>
