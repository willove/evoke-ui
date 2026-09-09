<template>
  <div
    class="ew-carousel"
    @mouseenter="paused = true"
    @mouseleave="paused = false"
  >
    <div class="ew-carousel__viewport">
      <div class="ew-carousel__track" :style="{ transform: `translateX(-${index * 100}%)` }">
        <div v-for="(item, i) in items" :key="i" class="ew-carousel__slide">
          <slot name="item" :item="item" :index="i">{{ item }}</slot>
        </div>
      </div>
    </div>

    <button v-if="items.length > 1" type="button" class="ew-carousel__arrow is-prev" aria-label="上一张" @click="step(-1)">
      <EwIcon name="chevron-left" :size="18" />
    </button>
    <button v-if="items.length > 1" type="button" class="ew-carousel__arrow is-next" aria-label="下一张" @click="step(1)">
      <EwIcon name="chevron-right" :size="18" />
    </button>

    <div v-if="items.length > 1 && dots" class="ew-carousel__dots">
      <button
        v-for="(_, i) in items"
        :key="i"
        type="button"
        class="ew-carousel__dot"
        :class="{ 'is-active': i === index }"
        :aria-label="`第 ${i + 1} 张`"
        @click="go(i)"
      />
    </div>
  </div>
</template>

<script setup>
/**
 * EwCarousel — 轮播（评价墙、案例展示、横幅）
 * items 提供数据，#item 作用域插槽自定义每张内容；autoplay 毫秒数（0 关闭），hover 暂停
 */
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import EwIcon from '../icon/index.vue'

const props = defineProps({
  items: { type: Array, default: () => [] },
  /** 自动轮播间隔 ms（0 关闭） */
  autoplay: { type: Number, default: 0 },
  dots: { type: Boolean, default: true },
})

const index = ref(0)
const paused = ref(false)
let timer = null

const count = computed(() => props.items.length)

function go(i) {
  if (!count.value) return
  index.value = ((i % count.value) + count.value) % count.value
}

function step(dir) {
  go(index.value + dir)
}

function setupTimer() {
  teardownTimer()
  if (props.autoplay > 0 && count.value > 1) {
    timer = setInterval(() => {
      if (!paused.value) step(1)
    }, props.autoplay)
  }
}

function teardownTimer() {
  if (timer) clearInterval(timer)
  timer = null
}

watch(() => [props.autoplay, count.value], setupTimer, { immediate: false })
watch(() => props.items, () => go(0))

onMounted(setupTimer)
onBeforeUnmount(teardownTimer)
</script>

<style src="./style.css"></style>
