<template>
  <div class="ew-faq">
    <div
      v-for="(item, i) in items"
      :key="i"
      class="ew-faq__item"
      :class="{ 'is-open': isOpen(i) }"
    >
      <button
        type="button"
        class="ew-faq__question"
        :aria-expanded="isOpen(i)"
        @click="toggle(i)"
      >
        <span class="ew-faq__question-text">{{ item.question }}</span>
        <span class="ew-faq__indicator" aria-hidden="true">{{ isOpen(i) ? '−' : '+' }}</span>
      </button>
      <div class="ew-faq__answer-wrap">
        <div class="ew-faq__answer">
          <slot name="answer" :item="item" :index="i">{{ item.answer }}</slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * EwFaq — 常见问题手风琴（launchos FAQ 语言：+/− 指示器 + 平滑展开）
 * items [{ question, answer }]；accordion 单开模式，multiple 允许多开
 */
import { ref } from 'vue'

const props = defineProps({
  /** [{ question, answer }] */
  items: { type: Array, default: () => [] },
  /** 允许多项同时展开 */
  multiple: { type: Boolean, default: false },
  /** 默认展开的下标 */
  defaultOpen: { type: Number, default: -1 },
})

const openSet = ref(new Set(props.defaultOpen >= 0 ? [props.defaultOpen] : []))

function isOpen(i) {
  return openSet.value.has(i)
}

function toggle(i) {
  const next = new Set(openSet.value)
  if (next.has(i)) {
    next.delete(i)
  } else {
    if (!props.multiple) next.clear()
    next.add(i)
  }
  openSet.value = next
}
</script>

<style src="./style.css"></style>
