<template>
  <div
    class="ev-marquee"
    :class="{ 'is-reverse': reverse, 'is-pausable': pauseOnHover }"
    :style="rootStyle"
    role="marquee"
  >
    <div class="ev-marquee__track">
      <template v-if="textMode">
        <div v-for="g in 2" :key="g" class="ev-marquee__group" :aria-hidden="g === 2 ? 'true' : undefined">
          <template v-for="(w, i) in items" :key="i">
            <span class="ev-marquee__text" :class="{ 'is-outline': alternateOutline && i % 2 === 1 }">{{ w }}</span>
            <EvIcon v-if="separator" :name="separator" :size="separatorSize" class="ev-marquee__separator" />
          </template>
        </div>
      </template>
      <template v-else>
        <div class="ev-marquee__group"><slot /></div>
        <div class="ev-marquee__group" aria-hidden="true"><slot /></div>
      </template>
    </div>
    <div class="ev-marquee__mask" aria-hidden="true" />
  </div>
</template>

<script setup>
/**
 * EvMarquee — 无限滚动横幅
 *
 * 两种用法：
 * 1. 插槽模式：默认插槽内容渲染两份，无缝循环（品牌墙 / 任意自定义内容）
 * 2. 文本模式：传入 items（字符串数组），渲染大字横幅——
 *    alternateOutline 让奇偶项在 实心/描边 间交替（商场 LED 风格），
 *    可选 separator 分隔图标；字号/描边色由 --ev-marquee-text-size / --ev-marquee-stroke 控制
 *
 * duration 单程时长 ms（越小越快），reverse 反向，hover 暂停（可关）
 */
import { computed, useSlots } from 'vue'
import EvIcon from '../icon/index.vue'

const props = defineProps({
  /** 文本模式的词条（传入后若没有默认插槽则启用文本模式） */
  items: { type: Array, default: () => [] },
  /** 文本模式下奇偶项 实心/描边 交替 */
  alternateOutline: { type: Boolean, default: true },
  /** 词条间的分隔图标名（如 'star-fill'） */
  separator: { type: String, default: '' },
  /** 大字字号（任意 CSS 字号） */
  textSize: { type: String, default: '' },
  /** 单程滚动时长 ms（越小越快） */
  duration: { type: Number, default: 24000 },
  /** 反向滚动 */
  reverse: { type: Boolean, default: false },
  /** 悬停暂停 */
  pauseOnHover: { type: Boolean, default: true },
})

const slots = useSlots()

const textMode = computed(() => !slots.default && props.items.length > 0)

const separatorSize = computed(() => {
  const size = parseInt(props.textSize) || 48
  return Math.max(14, Math.round(size * 0.38))
})

const rootStyle = computed(() => {
  const style = { '--ev-marquee-duration': `${props.duration}ms` }
  if (props.textSize) style['--ev-marquee-text-size'] = props.textSize
  return style
})
</script>

<style src="./style.css"></style>
