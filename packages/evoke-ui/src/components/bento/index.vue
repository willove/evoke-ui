<template>
  <div
    class="ev-bento"
    :class="{ 'is-bordered': bordered, 'is-dense': dense }"
    :style="{ '--ev-bento-columns': columns, '--ev-bento-gap': gapValue }"
  >
    <component
      :is="item.href ? 'a' : 'div'"
      v-for="(item, i) in items"
      :key="i"
      class="ev-bento__card"
      :class="[`is-${item.tone || 'plain'}`, `is-${item.imagePos || 'bottom'}`, item.rows > 1 && `is-rows-${Math.min(item.rows, 4)}`]"
      :style="{ '--bento-span': cardSpan(item) }"
      :href="item.href"
    >
      <slot name="item" :item="item" :index="i">
        <div class="ev-bento__text">
          <span v-if="item.eyebrow" class="ev-bento__eyebrow">{{ item.eyebrow }}</span>
          <p class="ev-bento__title">{{ item.title }}</p>
          <p v-if="item.desc" class="ev-bento__desc">{{ item.desc }}</p>
        </div>
        <img v-if="item.image" :src="item.image" :alt="item.title" class="ev-bento__image" />
      </slot>
    </component>
  </div>
</template>

<script setup>
/**
 * EvBento — 图文组合分区（Bento 卡片栅格）
 * 卡片自动组合分区：span 跨列 / rows 跨行（dense 可回填空隙），图文上下结构或
 * imagePos: 'fill' 整卡铺图、文字叠于其上；tone 提供淡底/主色/深色卡面。
 * 受宽时（span 超出列数或窄屏）自动回落为整行，无需手工干预。
 *
 * Usage:
 *   <EvBento :columns="3" :items="[{ title: '一亿像素', desc: '...', image: '...', span: 2 }]" />
 */
import { computed } from 'vue'

const props = defineProps({
  /** 卡片：[{ eyebrow?, title, desc?, image?, imagePos?: 'bottom'|'top'|'fill', span?, rows?, tone?: 'plain'|'soft'|'primary'|'dark', href? }] */
  items: { type: Array, default: () => [] },
  /** 列数 */
  columns: { type: Number, default: 3 },
  /** 卡片边框；默认无边框（纯色卡面） */
  bordered: { type: Boolean, default: false },
  /** dense：自动回填跨列留下的空隙 */
  dense: { type: Boolean, default: false },
  /** 卡片间距；数字按 px */
  gap: { type: [Number, String], default: 16 },
})

const gapValue = computed(() => (typeof props.gap === 'number' ? `${props.gap}px` : props.gap))

// 跨列钳制到列数：span 超出列数时回落为整行（避免产生隐式轨道）
function cardSpan(item) {
  return Math.max(1, Math.min(item.span || 1, props.columns))
}
</script>

<style src="./style.css"></style>
