<template>
  <div class="eb-gantt-progress" :style="{ '--bar-count': stages.length }">
    <div class="eb-gantt-progress__connector">
      <div class="eb-gantt-progress__connector-fill" :style="{ width: progressPercent + '%' }" />
    </div>
    <div class="eb-gantt-progress__bars">
      <div v-for="(stage, i) in stages" :key="i" class="eb-gantt-progress__bar-wrap">
        <div class="eb-gantt-progress__bar-outer">
          <div
            class="eb-gantt-progress__bar"
            :class="'eb-gantt-progress__bar--' + stage.status"
            :style="barStyle(stage, i)"
          >
            <div v-if="stage.status === 'active'" class="eb-gantt-progress__pulse" />
          </div>
        </div>
        <div class="eb-gantt-progress__label">
          <span class="eb-gantt-progress__label-name">{{ stage.name }}</span>
          <span v-if="stage.date" class="eb-gantt-progress__label-date">{{ stage.date }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * EbGanttProgress — 甘特式阶段进度
 * 阶段柱（completed/active/pending 三态高度差）+ 贯穿连接线 + active 脉冲
 */
import { computed } from 'vue'

const props = defineProps({
  stages: { type: Array, default: () => [] },
  completedColor: { type: String, default: 'var(--eb-color-primary)' },
  activeColor: { type: String, default: 'var(--eb-color-primary)' },
  pendingColor: { type: String, default: 'var(--eb-border-color)' },
})

const completedCount = computed(() => props.stages.filter((s) => s.status === 'completed').length)
const activeIndex = computed(() => props.stages.findIndex((s) => s.status === 'active'))

const progressPercent = computed(() => {
  if (activeIndex.value >= 0) {
    return ((activeIndex.value + 0.5) / props.stages.length) * 100
  }
  return (completedCount.value / props.stages.length) * 100
})

function barStyle(stage, index) {
  let height
  if (stage.height != null) height = stage.height
  else if (stage.status === 'completed') height = 1
  else if (stage.status === 'active') height = 0.7
  else height = 0.35

  let color
  if (stage.status === 'completed') color = props.completedColor
  else if (stage.status === 'active') color = props.activeColor
  else color = props.pendingColor

  return {
    height: `${height * 100}%`,
    background: color,
    animationDelay: `${index * 0.08}s`,
  }
}
</script>

<style src="./style.css"></style>
