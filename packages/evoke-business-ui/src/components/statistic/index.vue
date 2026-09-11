<template>
  <div class="eb-statistic" :style="valueStyle">
    <div v-if="$slots.title || title" class="eb-statistic__title">
      <slot name="title">{{ title }}</slot>
    </div>
    <div class="eb-statistic__content">
      <span v-if="$slots.prefix || prefix" class="eb-statistic__prefix">
        <slot name="prefix">{{ prefix }}</slot>
      </span>
      <span v-if="loading" class="eb-statistic__loading">
        <span class="eb-statistic__loading-dot" />
        <span class="eb-statistic__loading-dot" />
        <span class="eb-statistic__loading-dot" />
      </span>
      <span v-else :class="['eb-statistic__value', { 'is-flip': flip }]" :title="displayValue">
        <template v-if="flip">
          <transition name="eb-statistic-flip" mode="out-in">
            <span :key="displayValue">{{ displayValue }}</span>
          </transition>
        </template>
        <template v-else>{{ displayValue }}</template>
      </span>
      <span v-if="$slots.suffix || suffix" class="eb-statistic__suffix">
        <slot name="suffix">{{ suffix }}</slot>
      </span>
    </div>
  </div>
</template>

<script setup>
/**
 * EbStatistic — 统计数值
 * 数值格式化（千分位/精度）、前后缀、formatter 定制、loading 骨架；
 * flip 用于数值轮播场景（如大屏看板实时刷新）时的过渡动画。
 */
import { computed } from 'vue'

defineOptions({ name: 'EbStatistic' })

const props = defineProps({
  /** 数值；字符串原样展示（不格式化） */
  value: { type: [Number, String], default: 0 },
  /** 数值精度（小数位） */
  precision: { type: Number, default: undefined },
  /** 千分位分隔符；传 '' 关闭分组 */
  separator: { type: String, default: ',' },
  /** 前缀 */
  prefix: { type: String, default: '' },
  /** 后缀 */
  suffix: { type: String, default: '' },
  /** 标题 */
  title: { type: String, default: '' },
  /** 数值样式（字号/颜色等，级联到整块内容） */
  valueStyle: { type: Object, default: undefined },
  /** 自定义格式化 (value) => string；设置后 separator/precision 不生效 */
  formatter: { type: Function, default: undefined },
  /** 加载中（数值区渲染占位点） */
  loading: { type: Boolean, default: false },
  /** 数值变化时启用翻转过渡 */
  flip: { type: Boolean, default: false },
})

const displayValue = computed(() => {
  if (props.formatter) return props.formatter(props.value)
  if (typeof props.value !== 'number' || Number.isNaN(props.value)) return String(props.value)

  let [int, decimal] = String(props.value).split('.')
  if (props.precision != null) {
    decimal = Number(props.value).toFixed(props.precision).split('.')[1]
  }
  if (props.separator) {
    int = int.replace(/\B(?=(\d{3})+(?!\d))/g, props.separator)
  }
  return decimal != null ? `${int}.${decimal}` : int
})
</script>

<style src="./style.css"></style>
