<template>
  <article class="ew-article">
    <header class="ew-article__header">
      <p v-if="eyebrow || $slots.eyebrow" class="ew-article__eyebrow">
        <slot name="eyebrow">{{ eyebrow }}</slot>
      </p>
      <h1 class="ew-article__title">
        <slot name="title">{{ title }}</slot>
      </h1>
      <p v-if="description || $slots.description" class="ew-article__description">
        <slot name="description">{{ description }}</slot>
      </p>
      <div v-if="author || date || readTime || tags.length" class="ew-article__meta">
        <EwAvatar
          v-if="author && avatar"
          :src="avatar"
          :name="author"
          :size="28"
          class="ew-article__avatar"
        />
        <span v-if="author" class="ew-article__author">{{ author }}</span>
        <span v-if="date" class="ew-article__date">{{ date }}</span>
        <span v-if="readTime" class="ew-article__read">{{ readTime }}</span>
        <span v-for="tag in tags" :key="tag" class="ew-article__tag">{{ tag }}</span>
      </div>
    </header>

    <div class="ew-article__body">
      <slot />
    </div>

    <footer v-if="$slots.footer" class="ew-article__footer">
      <slot name="footer" />
    </footer>
  </article>
</template>

<script setup>
/**
 * EwArticle — 文章内容（长文阅读排版）
 * 页头：眉题 + 标题 + 摘要 + 元信息行（头像/作者/日期/阅读时长/标签）；
 * 正文插槽自带阅读排版（标题刻度、1.85 行高、引用块、列表、行内代码、图片圆角），
 * 排版全部以 .ew-article__body 作用域类收敛，不外溢。
 */
import EwAvatar from '../avatar/index.vue'

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
