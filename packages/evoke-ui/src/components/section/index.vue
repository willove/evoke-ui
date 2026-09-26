<template>
  <section :class="['ev-section', `is-${align}`, widthClass, { 'is-snap': snap, 'is-glass': glass === true, 'no-glass': glass === false }]" :style="[sectionStyle, glassVars]">
    <div v-if="eyebrow || $slots.eyebrow" class="ev-section__eyebrow">
      <slot name="eyebrow">{{ eyebrow }}</slot>
    </div>
    <h2 v-if="title || $slots.title" class="ev-section__title">
      <slot name="title">{{ title }}</slot>
    </h2>
    <p v-if="description || $slots.description" class="ev-section__description">
      <slot name="description">{{ description }}</slot>
    </p>
    <div v-if="$slots.default" class="ev-section__body">
      <slot />
    </div>
  </section>
</template>

<script setup>
/**
 * EvSection — 内容区块（眉题 + 大标题 + 描述 + 内容）
 * eyebrow 为 remixdesign「WORK」式字距拉开的大写小标
 * 默认定宽居中（default 档）：区块左右边界对整个区块生效一次，标题与主体天然同边；
 * 通栏（width="full"）仅限出血大件，需显式声明
 */
import { computed } from 'vue'

import { useGlassVars } from '../../composables/useGlassVars'
const props = defineProps({
  /** 磨砂玻璃质感：true 强制开 / false 强制关 / 缺省跟随全局（ConfigProvider 的 glass） */
  glass: { type: Boolean, default: undefined },
  /** 磨砂强度（px），内联覆盖 --ev-glass-blur；缺省跟随令牌 */
  blur: { type: [Number, String], default: undefined },
  /** 磨砂饱和度（倍数），内联覆盖 --ev-glass-saturate；缺省跟随令牌 */
  saturate: { type: [Number, String], default: undefined },
  /** 磨砂底色浓度（%），内联覆盖 --ev-glass-bg；缺省跟随令牌 */
  tint: { type: [Number, String], default: undefined },
  /** 眉题（自动大写字距拉开） */
  eyebrow: { type: String, default: '' },
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  align: {
    type: String,
    default: 'left',
    validator: (v) => ['left', 'center'].includes(v),
  },
  /** 底部留白（px），用于区块间距节奏 */
  gap: { type: [String, Number], default: undefined },
  /** 滚动吸附：滚到该区块附近时轻吸到视口顶（proximity，可打断；需页面上有至少一个吸附区块才启用） */
  snap: { type: Boolean, default: false },
  /** 定宽档：超过档位宽度后居中不再撑边。默认定宽（default 档，随 --ev-container-width 令牌），
      标题与主体天然同边；full 通栏仅限出血大件（跑马灯/整宽图表/分屏滚动场景/出血大图），
      需显式声明并说明理由——详见文档「整页组装规则」 */
  width: {
    type: String,
    default: 'default',
    validator: (v) => ['narrow', 'default', 'wide', 'full'].includes(v),
  },
})

const widthClass = computed(() => (props.width === 'full' ? '' : `is-width-${props.width}`))

const sectionStyle = computed(() => {
  if (props.gap == null || props.gap === '') return undefined
  const gap = typeof props.gap === 'number' ? `${props.gap}px` : props.gap
  return { marginBottom: gap }
})

const glassVars = useGlassVars(props)
</script>

<style src="./style.css"></style>
