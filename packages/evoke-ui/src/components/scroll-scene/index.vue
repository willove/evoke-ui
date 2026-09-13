<template>
  <div ref="sceneRef" class="ev-scroll-scene" :class="{ 'is-disabled': disabled }" :style="sceneStyle">
    <div class="ev-scroll-scene__stage" :style="stageStyle">
      <slot :progress="progress" :reduced="reduced" />
    </div>
  </div>
</template>

<script setup>
/**
 * EvScrollScene — 滚动场景（滚动叙事舞台）
 * 外层按 duration 拉出滚动长度，内层 sticky 钉在视口里——滚动条就是时间轴，
 * 下滚前进、上滚回溯。进度经作用域插槽 { progress } 与 CSS 变量
 * --ev-scene-progress（0..1）双通道暴露：纯 CSS 用 calc() 消费，
 * JS 消费（canvas 刷帧 / video.currentTime）用插槽值。
 *
 * Usage:
 *   <EvScrollScene :duration="300">
 *     <template #default="{ progress }">…</template>
 *   </EvScrollScene>
 */
import { computed, ref } from 'vue'
import { useScrollProgress } from '../../composables/useScrollProgress'

const props = defineProps({
  /** 场景时长（钉住期间滚过的距离）；数字按 vh，字符串透传（'1200px' / '80vh'） */
  duration: { type: [Number, String], default: 300 },
  /** 吸附偏移（sticky top）；数字按 px，字符串透传；顶栏悬浮时给它的底部 */
  top: { type: [Number, String], default: 0 },
  /** 关闭场景：不拉高度不吸附，进度恒 0（窄屏降级直出） */
  disabled: { type: Boolean, default: false },
})

const sceneRef = ref(null)
const topValue = computed(() =>
  typeof props.top === 'number' ? `${props.top}px` : props.top,
)
const { progress: rawProgress, reduced } = useScrollProgress(sceneRef, {
  offset: () => parseFloat(props.top) || 0,
})
const progress = computed(() => (props.disabled ? 0 : rawProgress.value))

const sceneStyle = computed(() => {
  // 变量恒输出：禁用态给 0，消费端 calc(var(--ev-scene-progress) * …) 不至于失效；
  // 场景高度走 style.css（100vh + var，svh 支持时用小视口单位）——
  // 手机上地址栏伸缩会改变 vh 语义，高度用 vh 直写会随滚动反复变化造成抖动
  const style = { '--ev-scene-progress': progress.value }
  if (!props.disabled) {
    if (typeof props.duration === 'number') {
      style['--ev-scene-scroll'] = `${props.duration}vh`
      style['--ev-scene-scroll-s'] = `${props.duration}svh`
    } else {
      style['--ev-scene-scroll'] = props.duration
      style['--ev-scene-scroll-s'] = props.duration
    }
  }
  return style
})
const stageStyle = computed(() => (props.disabled ? undefined : { top: topValue.value }))
</script>

<style src="./style.css"></style>
