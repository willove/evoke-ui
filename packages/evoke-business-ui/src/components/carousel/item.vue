<template>
  <div
    class="ev-carousel__item ev-carousel__item"
    :class="{ 'is-active': isActive }"
    :style="itemStyle"
  >
    <slot />
  </div>
</template>

<script setup>
/**
 * EvCarouselItem — 走马灯项
 * 挂载顺序即索引；位移由父级 activeIndex 驱动（相邻 ±1 个身位，其余隐藏）
 */
import { inject, computed, ref, onMounted, onBeforeUnmount, getCurrentInstance } from 'vue'

const props = defineProps({
  name: { type: String, default: '' },
})

const ctx = inject('carouselContext', null)
const activeIndex = inject('carouselActive', ref(0))
const direction = inject('carouselDirection', ref('horizontal'))

const instance = getCurrentInstance()
const index = ref(-1)

// 注册时把 name 一并带给父级（setActiveItem(name) 定位用）
onMounted(() => {
  if (ctx) {
    index.value = ctx.register(instance.uid, props.name)
  }
})
onBeforeUnmount(() => {
  ctx?.unregister?.(instance.uid)
})

const isActive = computed(() => index.value === activeIndex.value)

const itemStyle = computed(() => {
  const diff = index.value - activeIndex.value
  const axis = direction.value === 'vertical' ? 'Y' : 'X'
  const style = {
    zIndex: 10 - Math.min(Math.abs(diff), 10),
    opacity: Math.abs(diff) <= 1 ? '1' : '0',
    transition: 'transform 0.3s ease-in-out, opacity 0.3s ease-in-out',
  }
  if (diff === 0) {
    style.transform = `translate${axis}(0px)`
  } else {
    style.transform = `translate${axis}(${diff > 0 ? '' : '-'}100%)`
  }
  return style
})
</script>
