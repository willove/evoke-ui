<template>
  <Teleport to="body">
    <Transition name="ev-image-preview">
      <div
        v-if="visible"
        ref="dialogRef"
        :class="['ev-image-preview', { 'is-glass': glass === true, 'no-glass': glass === false }]"
        :style="glassVars"
        role="dialog"
        aria-modal="true"
        tabindex="-1"
        :aria-label="`图片预览（${index + 1} / ${count}）`"
        @click.self="close"
      >
        <button type="button" class="ev-image-preview__close" aria-label="关闭预览" @click="close">
          <EvIcon name="close" :size="16" />
        </button>

        <button
          v-if="count > 1"
          type="button"
          class="ev-image-preview__arrow is-prev"
          aria-label="上一张"
          @click.stop="step(-1)"
        >
          <EvIcon name="chevron-left" :size="20" />
        </button>

        <figure class="ev-image-preview__stage">
          <img :src="current?.src" :alt="current?.alt || ''" class="ev-image-preview__img" />
          <figcaption v-if="current?.alt || count > 1" class="ev-image-preview__caption">
            <span>{{ current?.alt }}</span>
            <span v-if="count > 1">{{ index + 1 }} / {{ count }}</span>
          </figcaption>
        </figure>

        <button
          v-if="count > 1"
          type="button"
          class="ev-image-preview__arrow is-next"
          aria-label="下一张"
          @click.stop="step(1)"
        >
          <EvIcon name="chevron-right" :size="20" />
        </button>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
/**
 * EvImagePreview — 图片预览灯箱
 * 全屏遮罩 + 居中大图；Esc / 点击遮罩 / 关闭按钮关闭；
 * 多图时支持左右箭头与键盘 ← → 切换，右下角显示计数；
 * 打开期间锁定页面滚动，关闭后恢复。
 * v-model（可见） + v-model:index（当前下标）；images: [{ src, alt }] 或 url 字符串
 */
import { computed, nextTick, ref, watch, onBeforeUnmount } from 'vue'
import EvIcon from '../icon/index.vue'
import { lockBodyScroll, unlockBodyScroll } from '../../composables/useScrollLock'

import { useGlassVars } from '../../composables/useGlassVars'
const props = defineProps({
  /** 可见性（v-model） */
  modelValue: { type: Boolean, default: false },
  /** 图片列表：url 字符串或 { src, alt } */
  images: { type: Array, default: () => [] },
  /** 当前下标（v-model:index） */
  index: { type: Number, default: 0 },
  /** Esc 关闭 */
  escClose: { type: Boolean, default: true },
  /** 磨砂预览背景：true 强制开 / false 强制关 / 缺省跟随全局（ConfigProvider 的 glass）；
    开启后遮罩减淡 + 全幅磨砂，关闭/箭头按钮同步玻璃化 */
  glass: { type: Boolean, default: undefined },
  /** 磨砂强度（px），内联覆盖 --ev-glass-blur；缺省跟随令牌 */
  blur: { type: [Number, String], default: undefined },
  /** 磨砂饱和度（倍数），内联覆盖 --ev-glass-saturate；缺省跟随令牌 */
  saturate: { type: [Number, String], default: undefined },
  /** 磨砂底色浓度（%），内联覆盖 --ev-glass-bg；缺省跟随令牌 */
  tint: { type: [Number, String], default: undefined },
})

const emit = defineEmits(['update:modelValue', 'update:index', 'open', 'close', 'change'])

const count = computed(() => props.images.length)

const visible = computed(() => props.modelValue)

const dialogRef = ref(null)
let lastFocused = null

const normalized = computed(() =>
  props.images.map((img) => (typeof img === 'string' ? { src: img, alt: '' } : img))
)

const current = computed(() => normalized.value[props.index])

const glassVars = useGlassVars(props)

function close() {
  emit('update:modelValue', false)
  emit('close')
}

function step(dir) {
  if (count.value < 2) return
  const next = ((props.index + dir) % count.value + count.value) % count.value
  emit('update:index', next)
  emit('change', next)
}

function onKeydown(e) {
  if (e.key === 'Escape' && props.escClose) close()
  else if (e.key === 'ArrowLeft') step(-1)
  else if (e.key === 'ArrowRight') step(1)
}

// Esc / 方向键 + 滚动锁定；打开时焦点移入对话框、关闭后归还触发元素
watch(() => props.modelValue, (visible) => {
  if (typeof document === 'undefined') return
  if (visible) {
    lastFocused = document.activeElement
    document.addEventListener('keydown', onKeydown)
    lockBodyScroll()
    emit('open')
    nextTick(() => dialogRef.value?.focus?.())
  } else {
    document.removeEventListener('keydown', onKeydown)
    unlockBodyScroll()
    nextTick(() => lastFocused?.focus?.())
  }
})

onBeforeUnmount(() => {
  if (typeof document === 'undefined') return
  document.removeEventListener('keydown', onKeydown)
  unlockBodyScroll()
})
</script>

<style src="./style.css"></style>
