<template>
  <component
    :is="tag"
    :class="[
      'ev-card',
      `is-${tone}`,
      {
        'is-sticker': sticker,
        'is-featured': featured,
        'is-hoverable': hoverable,
        'is-flat': flat,
        'is-glass': glass === true,
        'no-glass': glass === false,
      },
    ]"
    :style="[customBg ? { backgroundColor: customBg } : undefined, glassVars]"
  >
    <slot />
  </component>
</template>

<script setup>
/**
 * EvCard — 卡片（官网区块容器）
 * tone：plain 白底 / soft 淡灰 / cream 奶油 / blue 淡蓝 / mint 薄荷 / pink 樱粉 / lime 黄绿
 * sticker：厚白描边贴纸风（remixdesign 作品卡语言）
 * featured：深色精选卡（launchos 定价主推卡语言）
 */
import { computed } from 'vue'

const props = defineProps({
  /** 磨砂玻璃质感：true 强制开 / false 强制关 / 缺省跟随全局（ConfigProvider 的 glass） */
  glass: { type: Boolean, default: undefined },
  /** 磨砂强度（px），内联覆盖 --ev-glass-blur；缺省跟随令牌 */
  blur: { type: [Number, String], default: undefined },
  tone: {
    type: String,
    default: 'plain',
    validator: (v) =>
      ['plain', 'soft', 'cream', 'blue', 'mint', 'pink', 'lime'].includes(v),
  },
  /** 贴纸风：厚白描边 + 柔和投影 */
  sticker: { type: Boolean, default: false },
  /** 深色精选形态（优先于 tone） */
  featured: { type: Boolean, default: false },
  /** 悬浮上浮 */
  hoverable: { type: Boolean, default: false },
  /** 去边框去阴影（嵌入场景） */
  flat: { type: Boolean, default: false },
  /** 渲染标签（可点击卡片传 'a'） */
  tag: { type: String, default: 'div' },
  /** 自定义底色（覆盖 tone） */
  customBg: { type: String, default: '' },
})

// 组件级磨砂强度：内联覆盖 --ev-glass-blur，缺省不产出内联样式（跟随令牌）
const glassVars = computed(() => {
  if (props.blur === undefined || props.blur === null || props.blur === '') return undefined
  return { '--ev-glass-blur': typeof props.blur === 'number' ? `${props.blur}px` : props.blur }
})
</script>

<style src="./style.css"></style>
