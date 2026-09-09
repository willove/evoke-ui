<template>
  <div ref="rootRef" :class="['ew-feature-grid', `is-${variant}`, `is-columns-${columns}`]">
    <div
      v-for="(item, i) in items"
      :key="item.title"
      :class="['ew-feature', `is-${variant}`]"
      :style="{ '--feature-delay': `${i * stagger}ms` }"
    >
      <span v-if="item.icon" class="ew-feature__icon">
        <EwIcon :name="item.icon" :size="variant === 'bullets' ? 20 : 22" />
      </span>
      <div class="ew-feature__text">
        <h4 class="ew-feature__title">{{ item.title }}</h4>
        <p v-if="item.description" class="ew-feature__description">{{ item.description }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * EwFeatureGrid — 特性展示
 * variant：bullets 行内特性条 / cards 特性卡片
 * cards 形态默认带交错滚动入场（reveal 控制开关，stagger 控制步长）
 */
import { onMounted, ref, watch } from 'vue'
import EwIcon from '../icon/index.vue'
import { revealElement } from '../../directives/reveal'

const props = defineProps({
  /** [{ icon, title, description }] */
  items: { type: Array, default: () => [] },
  variant: {
    type: String,
    default: 'cards',
    validator: (v) => ['bullets', 'cards'].includes(v),
  },
  /** cards 形态的列数 */
  columns: {
    type: [String, Number],
    default: 3,
    validator: (v) => ['1', '2', '3', '4', 1, 2, 3, 4].includes(v),
  },
  /** 交错入场延迟步长 ms */
  stagger: { type: Number, default: 60 },
  /** 关闭滚动入场动效 */
  reveal: { type: Boolean, default: true },
})

const rootRef = ref(null)
let cleanups = []

function applyReveal() {
  cleanups.forEach((fn) => fn())
  cleanups = []
  if (!props.reveal || !rootRef.value) return
  rootRef.value.querySelectorAll('.ew-feature').forEach((el, i) => {
    cleanups.push(revealElement(el, { type: 'up', delay: i * props.stagger }))
  })
}

onMounted(applyReveal)
watch(() => [props.items, props.variant], applyReveal)
</script>

<style src="./style.css"></style>
