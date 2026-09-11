<template>
  <article class="ev-article">
    <header class="ev-article__header">
      <p v-if="eyebrow || $slots.eyebrow" class="ev-article__eyebrow">
        <slot name="eyebrow">{{ eyebrow }}</slot>
      </p>
      <h1 class="ev-article__title">
        <slot name="title">{{ title }}</slot>
      </h1>
      <p v-if="description || $slots.description" class="ev-article__description">
        <slot name="description">{{ description }}</slot>
      </p>
      <div v-if="author || date || readTime || tags.length" class="ev-article__meta">
        <EvAvatar
          v-if="author && avatar"
          :src="avatar"
          :name="author"
          :size="28"
          class="ev-article__avatar"
        />
        <span v-if="author" class="ev-article__author">{{ author }}</span>
        <span v-if="date" class="ev-article__date">{{ date }}</span>
        <span v-if="readTime" class="ev-article__read">{{ readTime }}</span>
        <span v-for="tag in tags" :key="tag" class="ev-article__tag">{{ tag }}</span>
      </div>
    </header>

    <div class="ev-article__body">
      <slot />
    </div>

    <footer v-if="$slots.footer" class="ev-article__footer">
      <slot name="footer" />
    </footer>
  </article>
</template>

<script setup>
/**
 * EvArticle — 文章内容（长文阅读排版）
 * 页头：眉题 + 标题 + 摘要 + 元信息行（头像/作者/日期/阅读时长/标签）；
 * 正文插槽自带阅读排版（标题刻度、1.85 行高、引用块、列表、行内代码、图片圆角），
 * 排版全部以 .ev-article__body 作用域类收敛，不外溢。
 */
import EvAvatar from '../avatar/index.vue'

defineProps({
  /** 标题 */
  title: { type: String, default: '' },
  /** 摘要（标题下的导语） */
  description: { type: String, default: '' },
  /** 眉题（小 uppercase 字距标签） */
  eyebrow: { type: String, default: '' },
  author: { type: String, default: '' },
  avatar: { type: String, default: '' },
  date: { type: String, default: '' },
  /** 阅读时长（如 '8 min'） */
  readTime: { type: String, default: '' },
  tags: { type: Array, default: () => [] },
})
</script>

<style src="./style.css"></style>
