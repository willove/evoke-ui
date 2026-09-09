<template>
  <transition name="ev-fade-in-linear">
    <div v-show="visible" class="ev-backtop ev-backtop" :style="style" @click.stop="handleClick">
      <slot>
        <ev-icon name="caret-top" :size="16" />
      </slot>
    </div>
  </transition>
</template>

<script setup>
/**
 * EvBacktop — 返回顶部
 * 滚动监听挂载在生命周期内（Electron 安全）；target 支持选择器，缺省监听 window
 */
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import EvIcon from '../icon/index.vue'

const props = defineProps({
  /** 监听滚动的目标元素选择器 */
  target: { type: String, default: '' },
  visibilityHeight: { type: Number, default: 200 },
  right: { type: Number, default: 40 },
  bottom: { type: Number, default: 40 },
})

const emit = defineEmits(['click'])

const visible = ref(false)
let scrollEl = null

const style = computed(() => ({ right: `${props.right}px`, bottom: `${props.bottom}px` }))

function updateVisible() {
  const top = scrollEl === window ? (window.scrollY ?? 0) : (scrollEl?.scrollTop ?? 0)
  visible.value = top >= props.visibilityHeight
}

function scrollToTop() {
  const el = scrollEl === window ? window : scrollEl
  el?.scrollTo?.({ top: 0, behavior: 'smooth' })
}

function handleClick(e) {
  scrollToTop()
  emit('click', e)
}

onMounted(() => {
  scrollEl = props.target ? document.querySelector(props.target) : window
  // target 选择器未命中时回退 window，避免组件静默失效
  if (props.target && !scrollEl) scrollEl = window
  scrollEl?.addEventListener?.('scroll', updateVisible, { passive: true })
  updateVisible()
})
onBeforeUnmount(() => {
  scrollEl?.removeEventListener?.('scroll', updateVisible)
  scrollEl = null
})
</script>

<style src="./style.css"></style>
