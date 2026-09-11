<template>
  <div
    class="eb-stack"
    :class="[`eb-stack--${variant}`, `eb-stack--dir-${direction}`]"
    :style="containerStyle"
    @pointerenter="onStackEnter"
    @pointerleave="onStackLeave"
  >
    <div class="eb-stack__inner">
      <div
        v-for="(item, index) in items"
        :key="item._key"
        class="eb-stack__item"
        :class="{
          'is-top': index === 0,
          'is-peeled': hoverPeel && peelIndex === index,
          'is-above-peeled': hoverPeel && peelIndex !== null && index < peelIndex,
          'is-leaving': leavingKey === item._key,
          'is-leaving-active': leavingActiveKey === item._key,
          'is-entering': enteringKey === item._key,
        }"
        :style="getItemStyle(index)"
        @click="handleClick(index)"
        @mouseenter="hoverEnter(index)"
        @mouseleave="hoverLeave(index)"
      >
        <slot name="item" :item="item.data" :index="index">
          <template v-if="variant === 'circular'">
            <div
              class="eb-stack__circle"
              :style="{
                width: `${size}px`,
                height: `${size}px`,
                '--eb-stack-card-scale': getCardScale(index),
              }"
            >
              <img
                v-if="typeof item.data === 'object' && item.data?.src"
                :src="item.data.src"
                :alt="getItemProp(item.data, 'alt', '')"
              />
              <span v-else class="eb-stack__text">{{ item.data }}</span>
            </div>
          </template>
          <template v-else>
            <div class="eb-stack__card" :style="{ '--eb-stack-card-scale': getCardScale(index) }">
              <slot name="card" :item="item.data" :index="index">
                <span>{{ item.data }}</span>
              </slot>
            </div>
          </template>
        </slot>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * EbStack — 堆叠卡片
 * 八方向堆叠 + hover 揭开（peel）+ 顶卡 cycle/remove 飞出动效；
 * emits: cycle/remove/promote；expose: items/cycle/remove/promoteToTop
 */
import { ref, computed, nextTick, onBeforeUnmount, watch } from 'vue'

const DIRECTION_AXIS = {
  top: { mainSignX: 0, mainSignY: -1, flyOutX: 0, flyOutY: -48, enterX: 0, enterY: 24, hoverX: 0, hoverY: -2, rotate: 8 },
  bottom: { mainSignX: 0, mainSignY: 1, flyOutX: 0, flyOutY: 48, enterX: 0, enterY: -24, hoverX: 0, hoverY: 2, rotate: -8 },
  left: { mainSignX: -1, mainSignY: 0, flyOutX: -48, flyOutY: 0, enterX: 24, enterY: 0, hoverX: -2, hoverY: 0, rotate: -8 },
  right: { mainSignX: 1, mainSignY: 0, flyOutX: 48, flyOutY: 0, enterX: -24, enterY: 0, hoverX: 2, hoverY: 0, rotate: 8 },
  'top-left': { mainSignX: -1, mainSignY: -1, flyOutX: -48, flyOutY: -48, enterX: 24, enterY: 24, hoverX: -2, hoverY: -2, rotate: 8 },
  'top-right': { mainSignX: 1, mainSignY: -1, flyOutX: 48, flyOutY: -48, enterX: -24, enterY: 24, hoverX: 2, hoverY: -2, rotate: 8 },
  'bottom-left': { mainSignX: -1, mainSignY: 1, flyOutX: -48, flyOutY: 48, enterX: 24, enterY: -24, hoverX: -2, hoverY: 2, rotate: -8 },
  'bottom-right': { mainSignX: 1, mainSignY: 1, flyOutX: 48, flyOutY: 48, enterX: -24, enterY: -24, hoverX: 2, hoverY: 2, rotate: -8 },
}

const props = defineProps({
  items: { type: Array, default: () => [] },
  variant: {
    type: String,
    default: 'card',
    validator: (v) => ['card', 'circular'].includes(v),
  },
  direction: {
    type: String,
    default: 'bottom',
    validator: (v) =>
      [
        'top', 'bottom', 'left', 'right',
        'top-left', 'top-right', 'bottom-left', 'bottom-right',
      ].includes(v),
  },
  clickMode: {
    type: String,
    default: 'cycle',
    validator: (v) => ['cycle', 'remove'].includes(v),
  },
  hoverPeel: { type: Boolean, default: false },
  scaleStep: { type: Number, default: 0.06 },
  offset: { type: Number, default: undefined },
  size: { type: Number, default: 40 },
  duration: { type: Number, default: 450 },
})

const emit = defineEmits(['cycle', 'remove', 'promote'])

const CARD_W = 220
const CARD_H = 100
const SAFE_PAD = 48

const items = ref(
  props.items.map((data, index) => ({
    _key: `stack-${index}-${Math.random().toString(36).slice(2, 8)}`,
    data,
    originalIndex: index,
  })),
)

watch(
  () => props.items,
  (val) => {
    // 外部整体替换 items 时同步（引用变化才同步，避免打断动画）
    if (val && val !== propsRefValue) {
      items.value = val.map((data, index) => ({
        _key: `stack-${index}-${Math.random().toString(36).slice(2, 8)}`,
        data,
        originalIndex: index,
      }))
    }
  },
)
let propsRefValue = props.items

const leavingKey = ref(null)
const leavingActiveKey = ref(null)
const enteringKey = ref(null)
const peelIndex = ref(null)
const peelLocked = ref(false)
const reentryAllowed = ref(false)
let hoverRafId = null
let cycleTimer = null

const effectiveOffset = computed(() => {
  if (props.offset != null) return props.offset
  return props.variant === 'circular' ? Math.round(props.size * 0.55) : 12
})

const totalItems = computed(() => items.value.length)
const axis = computed(() => DIRECTION_AXIS[props.direction])

const containerSize = computed(() => {
  const n = totalItems.value
  const offset = effectiveOffset.value
  const a = axis.value
  const safe = SAFE_PAD
  if (props.variant === 'circular') {
    const s = props.size
    const dx = a.mainSignX !== 0 ? (n - 1) * offset : 0
    const dy = a.mainSignY !== 0 ? (n - 1) * offset : 0
    return { w: s + dx + 2 * safe + 4, h: s + dy + 2 * safe + 4 }
  }
  const xStep = a.mainSignX !== 0 ? (n - 1) * offset : 0
  const yStep = a.mainSignY !== 0 ? (n - 1) * offset : 0
  return { w: xStep + CARD_W + 2 * safe, h: yStep + CARD_H + 2 * safe }
})

const containerStyle = computed(() => {
  const moveDur = `${props.duration}ms`
  const leaveDur = `${Math.round(props.duration * 0.6)}ms`
  const enterDur = `${Math.round(props.duration * 0.7)}ms`
  const a = axis.value
  return {
    width: `${containerSize.value.w}px`,
    height: `${containerSize.value.h}px`,
    '--eb-stack-duration': moveDur,
    '--eb-stack-duration-leave': leaveDur,
    '--eb-stack-duration-enter': enterDur,
    '--eb-stack-fly-x': `${a.flyOutX}px`,
    '--eb-stack-fly-y': `${a.flyOutY}px`,
    '--eb-stack-enter-x': `${a.enterX}px`,
    '--eb-stack-enter-y': `${a.enterY}px`,
    '--eb-stack-hover-x': `${a.hoverX}px`,
    '--eb-stack-hover-y': `${a.hoverY}px`,
    '--eb-stack-rotate': `${a.rotate}deg`,
    '--eb-stack-peel-x': `${a.mainSignX * 24}px`,
    '--eb-stack-peel-y': `${a.mainSignY * 24}px`,
  }
})

function getCardScale(index) {
  return 1 - index * props.scaleStep
}

function getItemProp(item, prop, fallback) {
  if (item && typeof item === 'object' && prop in item) return item[prop]
  return fallback ?? item
}

function getItemStyle(index) {
  const zIndex = totalItems.value - index
  const offset = effectiveOffset.value
  const a = axis.value
  const safe = SAFE_PAD

  const cs = containerSize.value
  const boxW = props.variant === 'circular' ? props.size : CARD_W
  const boxH = props.variant === 'circular' ? props.size : CARD_H

  const baseTop = a.mainSignY === -1 ? safe : a.mainSignY === 1 ? cs.h - safe - boxH : safe
  const baseLeft = a.mainSignX === -1 ? safe : a.mainSignX === 1 ? cs.w - safe - boxW : safe

  const itemTop = baseTop - index * offset * a.mainSignY
  const itemLeft = baseLeft - index * offset * a.mainSignX

  const shadow = index === 0 ? 'var(--eb-shadow-2)' : 'var(--eb-shadow-1)'

  return {
    position: 'absolute',
    top: `${itemTop}px`,
    left: `${itemLeft}px`,
    width: `${boxW}px`,
    height: `${boxH}px`,
    zIndex,
    cursor: index === 0 ? 'pointer' : 'default',
    '--eb-stack-item-shadow': shadow,
  }
}

function handleClick(index) {
  if (props.hoverPeel && index > 0 && !leavingKey.value) {
    promoteToTop(index)
    return
  }
  if (index === 0) {
    if (props.clickMode === 'remove') remove()
    else cycle()
  }
}

function schedulePeel(index) {
  if (hoverRafId !== null) cancelAnimationFrame(hoverRafId)
  hoverRafId = requestAnimationFrame(() => {
    hoverRafId = null
    peelIndex.value = index
  })
}

function hoverEnter(index) {
  if (!props.hoverPeel) return
  if (peelLocked.value) return
  if (!reentryAllowed.value) return
  if (index === 0) {
    schedulePeel(null)
    return
  }
  schedulePeel(index)
}

function hoverLeave(index) {
  if (!props.hoverPeel) return
  if (peelLocked.value) return
  if (peelIndex.value === index) {
    schedulePeel(null)
  }
}

function onStackEnter() {
  reentryAllowed.value = true
}

function onStackLeave() {
  reentryAllowed.value = false
  schedulePeel(null)
}

function promoteToTop(index) {
  if (index <= 0 || index >= items.value.length) return
  const target = items.value[index]
  const oldTop = items.value[0]
  emit('promote', target.data, oldTop.data, target.originalIndex)

  peelLocked.value = true
  reentryAllowed.value = false

  const arr = [...items.value]
  arr.splice(index, 1)
  arr.unshift(target)
  items.value = arr
  if (hoverRafId !== null) cancelAnimationFrame(hoverRafId)
  peelIndex.value = null

  setTimeout(() => {
    peelLocked.value = false
  }, Math.round(props.duration))
}

function cycle() {
  if (items.value.length <= 1 || leavingKey.value) return
  const top = items.value[0]
  emit('cycle', top.data, items.value[1].data, top.originalIndex)

  peelLocked.value = true
  reentryAllowed.value = false
  leavingKey.value = top._key
  nextTick(() => {
    leavingActiveKey.value = top._key
  })
  const leaveDur = Math.round(props.duration * 0.6)
  if (cycleTimer) clearTimeout(cycleTimer)
  cycleTimer = setTimeout(() => {
    if (items.value[0]?._key === top._key) {
      items.value = [
        ...items.value.slice(1),
        { ...top, _key: `stack-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` },
      ]
      enteringKey.value = items.value[items.value.length - 1]._key
      const enterDur = Math.round(props.duration * 0.7)
      setTimeout(() => {
        if (enteringKey.value === items.value[items.value.length - 1]?._key) {
          enteringKey.value = null
        }
        leavingKey.value = null
        leavingActiveKey.value = null
        peelLocked.value = false
      }, enterDur)
    }
  }, leaveDur)
}

function remove() {
  if (items.value.length <= 0 || leavingKey.value) return
  const top = items.value[0]
  emit('remove', top.data, top.originalIndex)

  peelLocked.value = true
  reentryAllowed.value = false

  leavingKey.value = top._key
  nextTick(() => {
    leavingActiveKey.value = top._key
  })
  const leaveDur = Math.round(props.duration * 0.6)
  if (cycleTimer) clearTimeout(cycleTimer)
  cycleTimer = setTimeout(() => {
    items.value = items.value.filter((it) => it._key !== top._key)
    leavingKey.value = null
    leavingActiveKey.value = null
    peelLocked.value = false
  }, leaveDur)
}

onBeforeUnmount(() => {
  if (cycleTimer) clearTimeout(cycleTimer)
  if (hoverRafId !== null) cancelAnimationFrame(hoverRafId)
})

defineExpose({ items, cycle, remove, promoteToTop })
</script>

<style src="./style.css"></style>
