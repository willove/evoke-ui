<template>
  <div class="ew-border-beam" :style="rootStyle">
    <slot />
  </div>
</template>

<script setup>
/**
 * EwBorderBeam — 边框流光
 * 包住任意内容，一道流光沿边框循环扫过（主色渐变，方向/速度/宽度可调）。
 * 依赖 CSS @property 插值角度；不支持的浏览器自动退化为静态渐变细环。
 * 圆角跟随宿主：给本组件根元素设置 border-radius 即可（ring 会同步取圆角）。
 */
import { computed } from 'vue'

const props = defineProps({
  /** 光带宽度（px） */
  width: { type: Number, default: 2 },
  /** 一圈时长（ms，越小越快） */
  duration: { type: Number, default: 6000 },
  /** 起始延迟（ms） */
  delay: { type: Number, default: 0 },
  /** 流光渐变起点色（默认透明，扫到位置时显现） */
  colorFrom: { type: String, default: 'transparent' },
  /** 流光渐变主色（缺省取 --ew-color-primary） */
  colorTo: { type: String, default: '' },
  /** 反向扫动 */
  reverse: { type: Boolean, default: false },
})

const rootStyle = computed(() => ({
  '--ew-beam-width': `${props.width}px`,
  '--ew-beam-duration': `${props.duration}ms`,
  '--ew-beam-delay': `${props.delay}ms`,
  '--ew-beam-from': props.colorFrom || 'transparent',
  '--ew-beam-to': props.colorTo || 'var(--ew-color-primary)',
  '--ew-beam-direction': props.reverse ? 'reverse' : 'normal',
}))
</script>

<style src="./style.css"></style>
