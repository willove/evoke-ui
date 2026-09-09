<template>
  <div class="ev-scrollbar ev-scrollbar">
    <div
      ref="wrapRef"
      class="ev-scrollbar__wrap"
      :class="{ 'ev-scrollbar__wrap--hidden-default': native }"
      :style="wrapStyleComputed"
      @scroll="handleScroll"
    >
      <component :is="tag" class="ev-scrollbar__view" :class="viewClass" :style="viewStyle">
        <slot />
      </component>
    </div>
    <!-- 自绘滚动条（native 时隐藏，走系统滚动条样式；对应轴向无溢出时不显示，避免 hover 出现"假滚动条"） -->
    <template v-if="!native">
      <div v-show="hasHorizontalScroll" class="ev-scrollbar__bar is-horizontal" :class="{ 'is-always': always }">
        <div
          class="ev-scrollbar__thumb"
          :style="thumbStyleX"
        />
      </div>
      <div v-show="hasVerticalScroll" class="ev-scrollbar__bar is-vertical" :class="{ 'is-always': always }">
        <div
          class="ev-scrollbar__thumb"
          :style="thumbStyleY"
        />
      </div>
    </template>
  </div>
</template>

<script setup>
/**
 * EvScrollbar — 滚动条
 * 自绘双向 thumb（滚动比例换算）；native 时走系统滚动条
 */
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'

const props = defineProps({
  height: { type: [String, Number], default: undefined },
  maxHeight: { type: [String, Number], default: undefined },
  native: { type: Boolean, default: false },
  wrapClass: { type: [String, Array, Object], default: '' },
  wrapStyle: { type: [String, Object], default: undefined },
  viewClass: { type: [String, Array, Object], default: '' },
  viewStyle: { type: [String, Object], default: undefined },
  tag: { type: String, default: 'div' },
  always: { type: Boolean, default: false },
  minSize: { type: Number, default: 20 },
})

const emit = defineEmits(['scroll'])

const wrapRef = ref(null)
const scrollTop = ref(0)
const scrollLeft = ref(0)
const scrollHeight = ref(0)
const scrollWidth = ref(0)
const clientHeight = ref(0)
const clientWidth = ref(0)

const px = (v) => (typeof v === 'number' ? `${v}px` : v)

const wrapStyleComputed = computed(() => {
  const style = { ...(typeof props.wrapStyle === 'object' ? props.wrapStyle : {}) }
  if (props.height) style.height = px(props.height)
  if (props.maxHeight) style.maxHeight = px(props.maxHeight)
  return style
})

// ─── 滚动状态采集 ───
function handleScroll() {
  const el = wrapRef.value
  if (!el) return
  scrollTop.value = el.scrollTop
  scrollLeft.value = el.scrollLeft
  clientHeight.value = el.clientHeight
  clientWidth.value = el.clientWidth
  scrollHeight.value = el.scrollHeight
  scrollWidth.value = el.scrollWidth
  emit('scroll', {
    scrollTop: el.scrollTop,
    scrollLeft: el.scrollLeft,
  })
}

// ─── 溢出判定（无溢出的轴向不渲染自绘滚动条） ───
const hasVerticalScroll = computed(() => scrollHeight.value > clientHeight.value)
const hasHorizontalScroll = computed(() => scrollWidth.value > clientWidth.value)

// ─── thumb 几何 ───
const thumbStyleY = computed(() => {
  const track = clientHeight.value || 1
  const content = scrollHeight.value || track
  const h = Math.max((track / content) * track, props.minSize)
  const maxScroll = content - track
  const y = maxScroll > 0 ? (scrollTop.value / maxScroll) * (track - h) : 0
  return { height: `${h}px`, transform: `translateY(${y}px)` }
})
const thumbStyleX = computed(() => {
  const track = clientWidth.value || 1
  const content = scrollWidth.value || track
  const w = Math.max((track / content) * track, props.minSize)
  const maxScroll = content - track
  const x = maxScroll > 0 ? (scrollLeft.value / maxScroll) * (track - w) : 0
  return { width: `${w}px`, transform: `translateX(${x}px)` }
})

function update() {
  handleScroll()
}

// ─── 实例方法 ───
function scrollTo(options) {
  wrapRef.value?.scrollTo?.(options)
}
function setScrollTop(value) {
  if (!wrapRef.value) return
  wrapRef.value.scrollTop = value
}
function setScrollLeft(value) {
  if (!wrapRef.value) return
  wrapRef.value.scrollLeft = value
}

// resize 后重算 thumb（原生 resize 事件即可覆盖绝大多数场景）
let resizeObserver = null
onMounted(() => {
  nextTick(update)
  const el = wrapRef.value
  if (el && !props.native && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(update)
    resizeObserver.observe(el)
  }
})
onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
})

defineExpose({ scrollTo, setScrollTop, setScrollLeft, update, wrapRef })
</script>

<style src="./style.css"></style>
