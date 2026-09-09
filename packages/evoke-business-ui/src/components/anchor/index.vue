<template>
  <div class="ev-anchor ev-anchor" :class="{ 'is-marker': showMarker }">
    <div class="ev-anchor__list" ref="listRef" :style="markerStyle">
      <slot />
    </div>
  </div>
</template>

<script setup>
/**
 * EvAnchor — 锚点导航（配合 EvAnchorLink）
 * scrollspy：监听滚动容器（默认 window），高亮当前区块；
 * 点击链接平滑滚动至目标（预留 offsetTop），showMarker 展示滑动轴线
 */
import { computed, nextTick, onBeforeUnmount, onMounted, provide, ref } from 'vue'
import { inBrowser } from '../../utils/dom'
import { ANCHOR_KEY } from './context'

defineOptions({ name: 'EvAnchor' })

const props = defineProps({
  /** 滚动容器选择器，缺省监听 window */
  target: { type: String, default: '' },
  /** 高亮判定与滚动落点的顶部偏移（px） */
  offsetTop: { type: Number, default: 0 },
  /** 判定容差（px） */
  bound: { type: Number, default: 5 },
  /** 显示滑动轴线 */
  showMarker: { type: Boolean, default: true },
  /** 点击是否平滑滚动 */
  smooth: { type: Boolean, default: true },
})

const emit = defineEmits(['click', 'change'])

const links = ref([]) // { href, title }
const currentHref = ref('')
const listRef = ref(null)
let scrollContainer = null

provide(ANCHOR_KEY, {
  register,
  unregister,
  currentHref,
  handleClick,
  props,
})

function register(link) {
  if (!links.value.some((l) => l.href === link.href)) links.value.push(link)
}
function unregister(href) {
  links.value = links.value.filter((l) => l.href !== href)
}

function getScrollTop() {
  if (!inBrowser()) return 0
  return scrollContainer === window ? window.scrollY : scrollContainer.scrollTop
}

function getSectionTop(href) {
  const el = document.querySelector(href)
  if (!el) return null
  const containerTop =
    scrollContainer === window ? 0 : scrollContainer.getBoundingClientRect().top
  return el.getBoundingClientRect().top - containerTop + getScrollTop()
}

function computeCurrent() {
  if (!links.value.length || !inBrowser()) return
  let current = ''
  for (const link of links.value) {
    const top = getSectionTop(link.href)
    if (top != null && top <= props.offsetTop + props.bound) current = link.href
  }
  if (current !== currentHref.value) {
    currentHref.value = current
    if (current) emit('change', current)
  }
}

function scrollTo(href, emitClick = false) {
  if (!inBrowser()) return
  const el = document.querySelector(href)
  if (!el) return
  const top = getSectionTop(href) - props.offsetTop
  const options = { top: Math.max(top, 0), behavior: props.smooth ? 'smooth' : 'auto' }
  if (scrollContainer === window) window.scrollTo(options)
  else scrollContainer.scrollTo(options)
  currentHref.value = href
  if (emitClick) emit('change', href)
}

function handleClick(e, href) {
  emit('click', e, href)
  if (e && e.defaultPrevented) return
  e?.preventDefault?.()
  scrollTo(href, true)
}

// ─── 滑动轴线定位 ───
const markerStyle = computed(() => {
  if (!props.showMarker || !currentHref.value) return undefined
  const list = listRef.value
  const el = list?.querySelector(`a[href="${currentHref.value}"]`)
  if (!el) return undefined
  return {
    '--ev-anchor-marker-top': `${el.offsetTop + 4}px`,
    '--ev-anchor-marker-height': `${el.clientHeight - 8}px`,
  }
})

async function refresh() {
  await nextTick()
  computeCurrent()
}

function bindScroll() {
  scrollContainer = props.target
    ? document.querySelector(props.target)
    : window
  if (!scrollContainer) return
  const onScroll = () => computeCurrent()
  scrollContainer.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll, { passive: true })
  unbind = () => {
    scrollContainer?.removeEventListener('scroll', onScroll)
    window.removeEventListener('resize', onScroll)
  }
  computeCurrent()
}

let unbind = null

onMounted(() => {
  if (!inBrowser()) return
  bindScroll()
  // 等子链接注册完成后再算一次
  refresh()
})

onBeforeUnmount(() => {
  unbind?.()
  unbind = null
})

defineExpose({ scrollTo, refresh })
</script>

<style src="./style.css"></style>
