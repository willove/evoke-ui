<template>
  <section ref="rootRef" :class="['ev-hero', `is-${align}`, { 'is-tinted': tinted }]">
    <div class="ev-container">
      <div class="ev-hero__inner" :class="{ 'has-aside': $slots.aside }">
        <div class="ev-hero__content">
          <div v-if="$slots.badge" class="ev-hero__badge" data-ev-hero-item>
            <slot name="badge" />
          </div>
          <h1 class="ev-hero__title" data-ev-hero-item>
            <slot name="title">{{ title }}</slot>
          </h1>
          <p v-if="description || $slots.description" class="ev-hero__description" data-ev-hero-item>
            <slot name="description">{{ description }}</slot>
          </p>
          <div v-if="$slots.actions" class="ev-hero__actions" data-ev-hero-item>
            <slot name="actions" />
          </div>
          <div v-if="$slots.default" class="ev-hero__body" data-ev-hero-item>
            <slot />
          </div>
        </div>
        <div v-if="$slots.aside" class="ev-hero__aside" data-ev-hero-item>
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
 * reveal 开启后徽章/标题/描述/动作依次错峰入场（60ms 步进，进入视口触发）
 */
import { onMounted, ref } from 'vue'
import { revealElement } from '../../directives/reveal'

const props = defineProps({
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

const rootRef = ref(null)

onMounted(() => {
  if (!props.reveal || !rootRef.value) return
  const items = rootRef.value.querySelectorAll('[data-ev-hero-item]')
  items.forEach((el, i) => revealElement(el, { type: 'up', delay: i * 60 }))
})
</script>

<style src="./style.css"></style>
