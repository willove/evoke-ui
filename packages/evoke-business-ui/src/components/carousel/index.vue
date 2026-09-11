<template>
  <div
    class="eb-carousel eb-carousel"
    :class="[`eb-carousel--${direction}`, { 'is-card': type === 'card' }]"
    @mouseenter="pauseOnHover && pause()"
    @mouseleave="pauseOnHover && restart()"
  >
    <div class="eb-carousel__container" :style="containerStyle">
      <slot />

      <!-- 切换箭头 -->
      <button
        v-if="arrow !== 'never' && itemCount > 1"
        type="button"
        class="eb-carousel__arrow eb-carousel__arrow--left"
        :class="{ 'is-hover-only': arrow === 'hover' }"
        aria-label="上一张"
        @click="prev"
      >
        <eb-icon name="arrow-left" :size="16" />
      </button>
      <button
        v-if="arrow !== 'never' && itemCount > 1"
        type="button"
        class="eb-carousel__arrow eb-carousel__arrow--right"
        :class="{ 'is-hover-only': arrow === 'hover' }"
        aria-label="下一张"
        @click="next"
      >
        <eb-icon name="arrow-right" :size="16" />
      </button>
    </div>

    <!-- 指示器 -->
    <ul v-if="itemCount > 1" class="eb-carousel__indicators" :class="[`is-${direction}`]">
      <li
        v-for="i in itemCount"
        :key="i"
        class="eb-carousel__indicator"
        :class="{ 'is-active': i - 1 === activeIndex }"
      >
        <button
          type="button"
          class="eb-carousel__button"
          :aria-label="`切换到第 ${i} 张`"
          @click="setActiveItem(i - 1)"
        />
      </li>
    </ul>
  </div>
</template>

<script setup>
/**
 * EbCarousel — 走马灯
 * 子项 EbCarouselItem 注册取序；autoplay/loop/arrow/指示器；expose setActiveItem/prev/next
 * type="card" 暂未实现，prop 预留
 */
import { ref, reactive, computed, provide, watch, onMounted, onBeforeUnmount } from 'vue'
import EbIcon from '../icon/index.vue'

const props = defineProps({
  initialIndex: { type: Number, default: 0 },
  height: { type: String, default: '' },
  trigger: {
    type: String,
    default: 'click',
    validator: (v) => ['click', 'hover'].includes(v),
  },
  autoplay: { type: Boolean, default: true },
  interval: { type: Number, default: 3000 },
  indicatorPosition: {
    type: String,
    default: '',
    validator: (v) => ['', 'outside', 'none'].includes(v),
  },
  arrow: {
    type: String,
    default: 'hover',
    validator: (v) => ['always', 'hover', 'never'].includes(v),
  },
  type: {
    type: String,
    default: '',
    validator: (v) => ['', 'card'].includes(v),
  },
  loop: { type: Boolean, default: true },
  direction: {
    type: String,
    default: 'horizontal',
    validator: (v) => ['horizontal', 'vertical'].includes(v),
  },
  pauseOnHover: { type: Boolean, default: true },
})

const emit = defineEmits(['change'])

const activeIndex = ref(0)
// reactive：子项注册数变化必须驱动指示器/箭头的重渲染
const itemUids = reactive([])
const itemNames = new Map()
let timer = null

const itemCount = computed(() => itemUids.length)

provide('carouselContext', {
  register(uid, name) {
    itemUids.push(uid)
    if (name) itemNames.set(name, itemUids.length - 1)
    return itemUids.length - 1
  },
  unregister(uid) {
    const i = itemUids.indexOf(uid)
    if (i !== -1) itemUids.splice(i, 1)
  },
})

// 子项注册完成后修正初始索引
onMounted(() => {
  if (props.initialIndex > 0 && props.initialIndex < itemCount.value) {
    activeIndex.value = props.initialIndex
  }
  restart()
})

onBeforeUnmount(stopTimer)

function stopTimer() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}
function restart() {
  stopTimer()
  if (props.autoplay && itemCount.value > 1) {
    timer = setInterval(() => next(), props.interval)
  }
}
function pause() {
  stopTimer()
}

function setActiveItem(index) {
  if (!itemCount.value) return
  let target = index
  if (typeof index === 'string') {
    // 按子项 name 定位
    target = itemNames.get(index)
    if (target === undefined || target >= itemCount.value) return
  }
  if (target < 0 || target >= itemCount.value) return
  if (target === activeIndex.value) return
  const prevIndex = activeIndex.value
  activeIndex.value = target
  emit('change', target, prevIndex)
  restart()
}

function next() {
  if (!itemCount.value) return
  const nextIdx = activeIndex.value + 1
  if (nextIdx >= itemCount.value) {
    if (props.loop) setActiveItem(0)
  } else {
    setActiveItem(nextIdx)
  }
}

function prev() {
  if (!itemCount.value) return
  const prevIdx = activeIndex.value - 1
  if (prevIdx < 0) {
    if (props.loop) setActiveItem(itemCount.value - 1)
  } else {
    setActiveItem(prevIdx)
  }
}

const containerStyle = computed(() => (props.height ? { height: props.height } : {}))

// activeIndex 传给子项（经 context 读取）
provide('carouselActive', activeIndex)
provide('carouselDirection', computed(() => props.direction))

watch(
  () => props.autoplay,
  () => restart(),
)

defineExpose({ setActiveItem, prev, next, /** 当前激活索引 */ activeIndex })
</script>

<style src="./style.css"></style>
