<template>
  <section :class="['ev-hero', `is-${align}`, { 'is-tinted': tinted, 'is-reveal': reveal }]">
    <div class="ev-container">
      <div class="ev-hero__inner" :class="{ 'has-aside': $slots.aside }">
        <div class="ev-hero__content">
          <div v-if="$slots.badge" class="ev-hero__badge">
            <slot name="badge" />
          </div>
          <h1 class="ev-hero__title">
            <slot name="title">{{ title }}</slot>
          </h1>
          <p v-if="description || $slots.description" class="ev-hero__description">
            <slot name="description">{{ description }}</slot>
          </p>
          <div v-if="$slots.actions" class="ev-hero__actions">
            <slot name="actions" />
          </div>
          <div v-if="$slots.default" class="ev-hero__body">
            <slot />
          </div>
        </div>
        <div v-if="$slots.aside" class="ev-hero__aside">
          <slot name="aside" />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
/**
 * EvHero — 首屏区块
 * 淡蓝灰渐变底 + 细字重展示标题 + 顶部胶囊徽章位 + 动作区
 * 插槽：badge（顶部胶囊）/ title / description / actions / default（如搜索框）/ aside（右侧视觉）
 * reveal 开启后内容错峰入场：纯 CSS 动画首帧即播（90ms 步进），不依赖 JS 时序
 */
defineProps({
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  align: {
    type: String,
    default: 'left',
    validator: (v) => ['left', 'center'].includes(v),
  },
  /** 淡蓝灰渐变底 */
  tinted: { type: Boolean, default: true },
  /** 错峰入场动效 */
  reveal: { type: Boolean, default: false },
})
</script>

<style src="./style.css"></style>
