<template>
  <div class="ew-markdown" v-html="rendered" />
</template>

<script setup>
/**
 * EwMarkdown — Markdown 渲染
 * 内置零依赖解析器（markdown.js），代码围栏复用 EwCodeBlock 的
 * highlight 分词器做语法配色；原文全量转义后渲染，v-html 安全。
 * 字体排版走 --ew-* 语义令牌，明暗双主题自动跟随
 */
import { computed } from 'vue'
import { parseMarkdown } from './markdown'

const props = defineProps({
  /** Markdown 源文本 */
  content: { type: String, default: '' },
})

const rendered = computed(() => parseMarkdown(props.content))
</script>

<style src="./style.css"></style>
