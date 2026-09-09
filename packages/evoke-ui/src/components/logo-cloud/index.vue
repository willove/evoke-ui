<template>
  <div class="ew-logo-cloud">
    <p v-if="title || $slots.title" class="ew-logo-cloud__title">
      <slot name="title">{{ title }}</slot>
    </p>
    <div class="ew-logo-cloud__grid" :style="gridStyle">
      <div v-for="(item, i) in normalizedItems" :key="i" class="ew-logo-cloud__item">
        <EwIcon v-if="item.icon" :name="item.icon" :size="iconSize" />
        <span class="ew-logo-cloud__label">{{ item.label }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * EwLogoCloud — 用户/合作品牌墙
 * 弱化的字标网格，社会证明位；items 为 [string] 或 [{ label, icon? }]
 */
import { computed } from 'vue'
import EwIcon from '../icon/index.vue'

const props = defineProps({
  items: { type: Array, default: () => [] },
  title: { type: String, default: '' },
  /** 网格列数 */
  columns: { type: [String, Number], default: 0 },
})

const normalizedItems = computed(() =>
  props.items.map((it) => (typeof it === 'string' ? { label: it } : it))
)

const iconSize = computed(() => 20)

const gridStyle = computed(() =>
  props.columns ? { gridTemplateColumns: `repeat(${Number(props.columns)}, 1fr)` } : undefined
)
</script>

<style src="./style.css"></style>
