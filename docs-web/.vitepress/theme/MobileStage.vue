<template>
  <div class="mob-stage" :style="stageStyle">
    <div class="mob-stage__device">
      <!-- 状态栏 -->
      <div v-if="statusBar" class="mob-stage__status">
        <span class="mob-stage__time">9:41</span>
        <span class="mob-stage__island" aria-hidden="true" />
        <span class="mob-stage__signals" aria-hidden="true">
          <svg width="46" height="12" viewBox="0 0 46 12" fill="none">
            <rect x="0" y="7" width="2.5" height="4" rx="0.8" fill="currentColor" />
            <rect x="4" y="5" width="2.5" height="6" rx="0.8" fill="currentColor" />
            <rect x="8" y="3" width="2.5" height="8" rx="0.8" fill="currentColor" />
            <rect x="12" y="1" width="2.5" height="10" rx="0.8" fill="currentColor" />
            <circle cx="23" cy="9.2" r="1.4" fill="currentColor" />
            <path d="M20.4 6.6a4 4 0 0 1 5.2 0" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
            <path d="M18.5 4.3a6.9 6.9 0 0 1 9 0" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
            <rect x="30" y="1.5" width="13" height="9" rx="2.5" stroke="currentColor" stroke-opacity="0.4" />
            <rect x="31.5" y="3" width="8.5" height="6" rx="1.2" fill="currentColor" />
            <path d="M44.4 4.4v3.2a1.7 1.7 0 0 0 0-3.2Z" fill="currentColor" fill-opacity="0.4" />
          </svg>
        </span>
      </div>

      <!-- 应用导航栏 -->
      <div v-if="title || $slots.action" class="mob-stage__navbar">
        <span class="mob-stage__back" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
        </span>
        <span class="mob-stage__title">{{ title }}</span>
        <span class="mob-stage__action"><slot name="action" /></span>
      </div>

      <!-- 页面内容（滚动区） -->
      <div class="mob-stage__body">
        <slot />
      </div>

      <!-- 底部标签栏插槽 -->
      <div v-if="$slots.bottom" class="mob-stage__bottom">
        <slot name="bottom" />
      </div>
      <!-- Home 指示条（有标签栏时由插槽区域自行承载） -->
      <div v-else-if="indicator" class="mob-stage__indicator" aria-hidden="true" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

/**
 * MobileStage — 移动端演示壳（文档站主题组件）
 * 375px 视口 + 状态栏 / 应用导航栏 / Home 指示条，屏幕按标准手机比例 375:812 固定。
 * 外层屏幕层 transform 使内联弹层（append-to-body=false）以舞台为包含块，被裁剪在屏幕内。
 */
const props = defineProps({
  /** 应用导航栏标题，传入即显示导航栏 */
  title: { type: String, default: '' },
  /** 覆盖固定比例的自定义总高度（一般不需要：所有舞台统一 375:812） */
  height: { type: [Number, String], default: '' },
  /** 是否显示状态栏 */
  statusBar: { type: Boolean, default: true },
  /** 无底部插槽时是否显示 Home 指示条 */
  indicator: { type: Boolean, default: true },
})

const stageStyle = computed(() => {
  if (!props.height) return undefined
  return { height: typeof props.height === 'number' ? `${props.height}px` : props.height }
})
</script>
