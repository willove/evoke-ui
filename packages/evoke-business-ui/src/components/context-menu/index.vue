<template>
  <div
    ref="regionRef"
    class="eb-context-menu eb-context-menu"
    :class="{ 'is-disabled': disabled }"
    @contextmenu="handleRegionContextMenu"
  >
    <slot />

    <Teleport to="body">
      <Transition name="eb-context-fade">
        <ul
          v-if="opened"
          ref="floatingRef"
          class="eb-context-menu__popper eb-context-menu__popper"
          :style="popperStyle"
          role="menu"
          aria-orientation="vertical"
          data-eb-context-menu-layer
        >
          <eb-context-menu-item
            v-for="(item, index) in activeItems"
            :key="index"
            :item="item"
            :z-index="zIndex"
            @command="handleItemCommand"
          />
        </ul>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
/**
 * EbContextMenu — 右键菜单
 * 默认插槽包裹触发区域，区域内右键在光标处弹出；items 配置驱动
 * （icon/label/command/disabled/divided/danger/children 一级子菜单），
 * 亦可 ref.open(event | {x,y}, itemsOverride) 命令式调用、按目标切换菜单内容。
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import EbContextMenuItem from './item.vue'
import { useZIndex } from '../../composables/useZIndex'
import { on as onEvent } from '../../utils/events'
import { inBrowser } from '../../utils/dom'

defineOptions({ name: 'EbContextMenu' })

const props = defineProps({
  /** 菜单项配置：{ label, icon, command, disabled, divided, danger, children } */
  items: { type: Array, default: () => [] },
  /** 禁用（区域右键与命令式 open 均不弹出） */
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['visible-change', 'command'])

const VIEWPORT_PADDING = 4

const regionRef = ref(null)
const floatingRef = ref(null)
const opened = ref(false)
const activeItems = ref([])
const anchor = ref({ x: 0, y: 0 })
const pos = ref({ x: 0, y: 0 })
const placed = ref(false)

const { zIndex, next: nextZIndex } = useZIndex()

const popperStyle = computed(() => ({
  position: 'fixed',
  left: `${pos.value.x}px`,
  top: `${pos.value.y}px`,
  zIndex: zIndex.value,
  visibility: placed.value ? 'visible' : 'hidden',
}))

function resolvePoint(target) {
  if (target && typeof target.clientX === 'number') {
    return { x: target.clientX, y: target.clientY }
  }
  if (target && typeof target.x === 'number') {
    return { x: target.x, y: target.y }
  }
  return { x: 0, y: 0 }
}

async function open(target, itemsOverride) {
  if (props.disabled) return
  anchor.value = resolvePoint(target)
  pos.value = { ...anchor.value }
  activeItems.value = itemsOverride || props.items
  placed.value = false
  if (!opened.value) {
    nextZIndex()
    opened.value = true
    emit('visible-change', true)
  }
  await place()
}

async function place() {
  await nextTick()
  const el = floatingRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  const vw = window.innerWidth || document.documentElement.clientWidth
  const vh = window.innerHeight || document.documentElement.clientHeight
  let x = anchor.value.x
  let y = anchor.value.y
  // 光标处不够放则向反向弹出，再钳位进视口
  if (x + rect.width > vw - VIEWPORT_PADDING) x = anchor.value.x - rect.width
  if (y + rect.height > vh - VIEWPORT_PADDING) y = anchor.value.y - rect.height
  x = Math.min(Math.max(x, VIEWPORT_PADDING), Math.max(vw - rect.width - VIEWPORT_PADDING, VIEWPORT_PADDING))
  y = Math.min(Math.max(y, VIEWPORT_PADDING), Math.max(vh - rect.height - VIEWPORT_PADDING, VIEWPORT_PADDING))
  pos.value = { x, y }
  placed.value = true
}

function close() {
  if (!opened.value) return
  opened.value = false
  placed.value = false
  emit('visible-change', false)
}

function handleItemCommand(command) {
  emit('command', command)
  close()
}

function handleRegionContextMenu(e) {
  if (props.disabled) return
  e.preventDefault()
  open(e)
}

// ─── 全局事件：ESC / 浮层外右键 / 点击外部 / 滚动意图 / 窗口缩放均收起 ───
// 子菜单 Teleport 至 body 独立挂载，"层内/层外"按 data-eb-context-menu-layer
// 标记判定（主浮层与子菜单同标记），不能按主浮层 contains 判
const cleanups = []

function insideMenuLayer(target) {
  return target instanceof Node && !!target.closest?.('[data-eb-context-menu-layer]')
}

function bindEvents() {
  if (!inBrowser()) return
  cleanups.push(
    onEvent(document, 'keydown', (e) => {
      if (e.key === 'Escape') close()
    })
  )
  cleanups.push(
    onEvent(
      document,
      'contextmenu',
      (e) => {
        if (!opened.value) return
        if (!insideMenuLayer(e.target)) close()
      },
      { capture: true }
    )
  )
  cleanups.push(
    onEvent(
      document,
      'pointerdown',
      (e) => {
        if (!opened.value) return
        if (!insideMenuLayer(e.target)) close()
      },
      { capture: true }
    )
  )
  const onScrollLike = (e) => {
    if (!opened.value) return
    if (insideMenuLayer(e.target)) return
    close()
  }
  cleanups.push(onEvent(document, 'wheel', onScrollLike, { capture: true, passive: true }))
  cleanups.push(onEvent(document, 'scroll', onScrollLike, { capture: true, passive: true }))
  cleanups.push(onEvent(window, 'resize', () => close()))
}

onMounted(bindEvents)

onBeforeUnmount(() => {
  cleanups.splice(0).forEach((off) => off())
})

defineExpose({
  open,
  close,
  visible: opened,
})
</script>

<style src="./style.css"></style>
