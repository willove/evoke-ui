<template>
  <Teleport to="body">
    <Transition name="eb-image-viewer-fade">
      <div
        v-if="visible"
        ref="wrapperRef"
        class="eb-image-viewer__wrapper eb-image-viewer"
        :style="{ zIndex }"
        role="dialog"
        aria-modal="true"
        aria-label="图片查看器"
        tabindex="-1"
        @click.self="handleOverlayClick"
      >
        <div class="eb-image-viewer__mask" />
        <button type="button" class="eb-image-viewer__btn eb-image-viewer__close" aria-label="关闭" @click="close">
          <eb-icon name="close" :size="24" />
        </button>
        <template v-if="!isSingle">
          <button
            type="button"
            class="eb-image-viewer__btn eb-image-viewer__prev"
            :class="{ 'is-disabled': prevDisabled }"
            :disabled="prevDisabled"
            aria-label="上一张"
            @click="prev"
          >
            <eb-icon name="arrow-left" :size="24" />
          </button>
          <button
            type="button"
            class="eb-image-viewer__btn eb-image-viewer__next"
            :class="{ 'is-disabled': nextDisabled }"
            :disabled="nextDisabled"
            aria-label="下一张"
            @click="next"
          >
            <eb-icon name="arrow-right" :size="24" />
          </button>
        </template>
        <div class="eb-image-viewer__actions">
          <span class="eb-image-viewer__actions__inner">
            <button type="button" class="eb-image-viewer__action" aria-label="缩小" @click="zoomOut">
              <eb-icon name="zoom-out" />
            </button>
            <button type="button" class="eb-image-viewer__action" aria-label="放大" @click="zoomIn">
              <eb-icon name="zoom-in" />
            </button>
            <button type="button" class="eb-image-viewer__action" aria-label="旋转" @click="rotate">
              <eb-icon name="refresh-right" />
            </button>
            <span class="eb-image-viewer__counter">{{ index + 1 }} / {{ urlList.length }}</span>
          </span>
        </div>
        <div class="eb-image-viewer__canvas">
          <img
            v-for="(url, i) in urlList"
            v-show="i === index"
            :key="url"
            :src="url"
            :style="imgStyle"
            class="eb-image-viewer__img"
            alt=""
            @error="handleError"
          />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
/**
 * EbImageViewer — 图片查看器
 * 缩放/旋转/多图切换；键盘：←/→ 切换、Esc 关闭、+/- 缩放、0 重置
 * （焦点在容器内时 keydown 冒泡到 document 统一处理）
 * 打开移焦入容器、关闭还焦（对齐 dialog/useFocusTrap 手法）；滚动锁 useLockScroll
 */
import { computed, nextTick, ref, watch, onBeforeUnmount } from 'vue'
import EbIcon from '../icon/index.vue'
import { useZIndex } from '../../composables/useZIndex'
import { useLockScroll } from '../../composables/useLockScroll'
import { on as onEvent } from '../../utils/events'

defineOptions({ name: 'EbImageViewer' })

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  urlList: { type: Array, default: () => [] },
  /** 初始索引 */
  initialIndex: { type: Number, default: 0 },
  hideOnClickModal: { type: Boolean, default: false },
  closeOnPressEscape: { type: Boolean, default: true },
})

const emit = defineEmits(['update:modelValue', 'close', 'switch'])

const visible = computed(() => props.modelValue)
const { zIndex } = useZIndex()

const index = ref(props.initialIndex)
const scale = ref(1)
const rotateDeg = ref(0)

const isSingle = computed(() => props.urlList.length <= 1)
const prevDisabled = computed(() => index.value === 0)
const nextDisabled = computed(() => index.value === props.urlList.length - 1)

const imgStyle = computed(() => ({
  transform: `scale(${scale.value}) rotate(${rotateDeg.value}deg)`,
  transition: 'transform 0.3s var(--eb-ease-out)',
}))

watch(
  () => props.initialIndex,
  (v) => (index.value = v)
)

watch(index, (v) => emit('switch', v))

function close() {
  emit('update:modelValue', false)
  emit('close')
}

function prev() {
  if (prevDisabled.value) return
  index.value--
  resetTransform()
}

function next() {
  if (nextDisabled.value) return
  index.value++
  resetTransform()
}

function zoomIn() {
  scale.value = Math.min(8, scale.value + 0.2)
}

function zoomOut() {
  scale.value = Math.max(0.2, scale.value - 0.2)
}

function rotate() {
  rotateDeg.value += 90
}

function resetTransform() {
  scale.value = 1
  rotateDeg.value = 0
}

function handleOverlayClick(e) {
  if (props.hideOnClickModal && e.target === e.currentTarget) close()
}

function handleError(e) {
  e.target.style.opacity = '0.3'
}

function onKeydown(e) {
  if (!visible.value) return
  switch (e.key) {
    case 'Escape':
      if (props.closeOnPressEscape) close()
      break
    case 'ArrowLeft':
      prev()
      break
    case 'ArrowRight':
      next()
      break
    case '+':
    case '=':
      zoomIn()
      break
    case '-':
    case '_':
      zoomOut()
      break
    case '0':
      resetTransform()
      break
    default:
      break
  }
}

let offKeydown = null
watch(
  visible,
  (val) => {
    if (typeof document !== 'undefined') {
      if (val && !offKeydown) {
        offKeydown = onEvent(document, 'keydown', onKeydown)
      } else if (!val && offKeydown) {
        offKeydown()
        offKeydown = null
      }
    }
  },
  { immediate: true }
)

// ─── 焦点管理 + 滚动锁 ───
const wrapperRef = ref(null)
const { lock, unlock } = useLockScroll()
let previouslyFocused = null

watch(
  visible,
  (val) => {
    if (typeof document === 'undefined') return
    if (val) {
      lock()
      previouslyFocused = document.activeElement
      nextTick(() => wrapperRef.value?.focus?.({ preventScroll: true }))
    } else {
      unlock()
      restoreFocus()
    }
  },
  { immediate: true }
)

/** 关闭还焦：归还打开前的焦点（对齐 useFocusTrap 的 deactivate） */
function restoreFocus() {
  const el = previouslyFocused
  previouslyFocused = null
  el?.focus?.()
}

onBeforeUnmount(() => {
  offKeydown?.()
  offKeydown = null
  unlock()
  restoreFocus()
})
</script>

<style src="./style.css"></style>
