<template>
  <Teleport to="body">
    <Transition name="eb-image-viewer-fade">
      <div
        v-if="visible"
        class="eb-image-viewer__wrapper eb-image-viewer"
        :style="{ zIndex }"
        role="dialog"
        aria-modal="true"
        aria-label="图片查看器"
        @click.self="handleOverlayClick"
      >
        <div class="eb-image-viewer__mask" />
        <span class="eb-image-viewer__btn eb-image-viewer__close" @click="close">
          <eb-icon name="close" :size="24" />
        </span>
        <template v-if="!isSingle">
          <span class="eb-image-viewer__btn eb-image-viewer__prev" :class="{ 'is-disabled': prevDisabled }" @click="prev">
            <eb-icon name="arrow-left" :size="24" />
          </span>
          <span class="eb-image-viewer__btn eb-image-viewer__next" :class="{ 'is-disabled': nextDisabled }" @click="next">
            <eb-icon name="arrow-right" :size="24" />
          </span>
        </template>
        <div class="eb-image-viewer__actions">
          <span class="eb-image-viewer__actions__inner">
            <eb-icon name="zoom-out" class="eb-image-viewer__action" @click="zoomOut" />
            <eb-icon name="zoom-in" class="eb-image-viewer__action" @click="zoomIn" />
            <eb-icon name="refresh-right" class="eb-image-viewer__action" @click="rotate" />
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
 * 缩放/旋转/多图切换/ESC 关闭
 */
import { computed, ref, watch, onBeforeUnmount } from 'vue'
import EbIcon from '../icon/index.vue'
import { useZIndex } from '../../composables/useZIndex'
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

onBeforeUnmount(() => {
  offKeydown?.()
  offKeydown = null
})
</script>

<style src="./style.css"></style>
