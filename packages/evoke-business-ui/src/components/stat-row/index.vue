<template>
  <div class="eb-stat-row" :class="'eb-stat-row--cols-' + cols">
    <eb-stat-card
      v-for="(item, i) in items"
      :key="i"
      :label="item.label"
      :value="item.value"
      :icon="item.icon"
      :type="item.type"
      :trend="item.trend"
    />
  </div>
</template>

<script setup>
/**
 * EbStatRow — 指标卡行
 * items 配置式批量渲染 EbStatCard，cols 控制栅格列数（2/3/4）
 */
import EbStatCard from '../stat-card/index.vue'

defineProps({
  items: { type: Array, default: () => [] },
  cols: {
    type: Number,
    default: 4,
    validator: (v) => [2, 3, 4].includes(v),
  },
})
</script>

<style src="./style.css"></style>
