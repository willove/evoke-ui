<template>
  <li
    ref="rootRef"
    class="eb-context-menu__item eb-context-menu__item"
    :class="itemClasses"
    role="menuitem"
    :tabindex="item.disabled ? -1 : 0"
    :aria-disabled="item.disabled || undefined"
    :aria-haspopup="hasChildren ? 'menu' : undefined"
    :aria-expanded="hasChildren ? subOpen : undefined"
    @click="handleClick"
    @mouseenter="handleEnter"
    @mouseleave="handleLeave"
  >
    <eb-icon v-if="item.icon" :name="item.icon" class="eb-context-menu__icon" />
    <span class="eb-context-menu__label">{{ item.label }}</span>
    <eb-icon v-if="hasChildren" name="arrow-right" class="eb-context-menu__arrow" />

    <ul v-if="subOpen" ref="subRef" class="eb-context-menu__submenu" role="menu" :style="subStyle">
      <li
        v-for="(child, index) in item.children"
        :key="index"
        class="eb-context-menu__item eb-context-menu__item"
        :class="{
          'is-disabled': child.disabled,
          'is-divided': child.divided,
          'is-danger': child.danger,
        }"
        role="menuitem"
        :tabindex="child.disabled ? -1 : 0"
        :aria-disabled="child.disabled || undefined"
        @click.stop="handleChildClick(child)"
      >
        <eb-icon v-if="child.icon" :name="child.icon" class="eb-context-menu__icon" />
        <span class="eb-context-menu__label">{{ child.label }}</span>
      </li>
    </ul>
  </li>
</template>

<script setup>
/**
 * EbContextMenuItem — 右键菜单项（EbContextMenu 内部件）
 * 叶子项点击抛 command；children 一级子菜单 hover 展开，
 * 视口右侧不够放自动翻到左侧，纵向钳位进视口。
 */
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'
import EbIcon from '../icon/index.vue'

defineOptions({ name: 'EbContextMenuItem' })

const props = defineProps({
  item: { type: Object, required: true },
})

const emit = defineEmits(['command'])

const OPEN_DELAY = 120
const CLOSE_DELAY = 160
const VIEWPORT_PADDING = 4
/** 与容器内边距的重叠量，避免父菜单与子菜单之间出现缝隙 */
const OVERLAP = 4

const rootRef = ref(null)
const subRef = ref(null)
const subOpen = ref(false)
const subPos = ref({ x: 0, y: 0 })
const subPlaced = ref(false)
let enterTimer = null
let leaveTimer = null

const hasChildren = computed(() => Array.isArray(props.item.children) && props.item.children.length > 0)

const itemClasses = computed(() => ({
  'is-disabled': props.item.disabled,
  'is-divided': props.item.divided,
  'is-danger': props.item.danger,
  'is-open': subOpen.value,
}))

const subStyle = computed(() => ({
  position: 'absolute',
  left: `${subPos.value.x}px`,
  top: `${subPos.value.y}px`,
  visibility: subPlaced.value ? 'visible' : 'hidden',
}))

function clearTimers() {
  if (enterTimer) clearTimeout(enterTimer)
  if (leaveTimer) clearTimeout(leaveTimer)
  enterTimer = null
  leaveTimer = null
}

function handleClick() {
  if (props.item.disabled) return
  if (hasChildren.value) {
    clearTimers()
    openSub()
    return
  }
  emit('command', props.item.command)
}

function handleChildClick(child) {
  if (child.disabled) return
  emit('command', child.command)
}

function handleEnter() {
  if (props.item.disabled) return
  if (leaveTimer) clearTimeout(leaveTimer)
  if (hasChildren.value) {
    if (enterTimer) clearTimeout(enterTimer)
    enterTimer = setTimeout(openSub, OPEN_DELAY)
  }
}

function handleLeave() {
  if (enterTimer) clearTimeout(enterTimer)
  if (subOpen.value) {
    if (leaveTimer) clearTimeout(leaveTimer)
    leaveTimer = setTimeout(closeSub, CLOSE_DELAY)
  }
}

async function openSub() {
  if (subOpen.value) return
  subPos.value = { x: 0, y: 0 }
  subPlaced.value = false
  subOpen.value = true
  await nextTick()
  placeSub()
}

function closeSub() {
  if (!subOpen.value) return
  subOpen.value = false
  subPlaced.value = false
}

function placeSub() {
  const li = rootRef.value
  const sub = subRef.value
  if (!li || !sub) return
  const liRect = li.getBoundingClientRect()
  const subRect = sub.getBoundingClientRect()
  const vw = window.innerWidth || document.documentElement.clientWidth
  const vh = window.innerHeight || document.documentElement.clientHeight
  // 默认挂在右侧（盖住容器内边距），右侧放不下翻到左侧
  let x = liRect.width - OVERLAP
  if (liRect.right + subRect.width - OVERLAP > vw - VIEWPORT_PADDING) {
    x = OVERLAP - subRect.width
  }
  // 默认顶对齐容器内边距，纵向钳位进视口
  let y = -OVERLAP
  y = Math.min(Math.max(y, VIEWPORT_PADDING - liRect.top), vh - subRect.height - VIEWPORT_PADDING - liRect.top)
  subPos.value = { x, y }
  subPlaced.value = true
}

onBeforeUnmount(clearTimers)
</script>

<style src="./style.css"></style>
