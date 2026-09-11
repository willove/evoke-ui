<template>
  <Teleport to="body">
    <Transition name="ew-image-preview">
      <div
        v-if="visible"
        class="ew-image-preview"
        role="dialog"
        aria-modal="true"
        :aria-label="`图片预览（${index + 1} / ${count}）`"
        @click.self="close"
      >
        <button type="button" class="ew-image-preview__close" aria-label="关闭预览" @click="close">
          <EwIcon name="close" :size="16" />
        </button>

        <button
          v-if="count > 1"
          type="button"
          class="ew-image-preview__arrow is-prev"
          aria-label="上一张"
          @click.stop="step(-1)"
        >
          <EwIcon name="chevron-left" :size="20" />
        </button>

        <figure class="ew-image-preview__stage">
          <img :src="current?.src" :alt="current?.alt || ''" class="ew-image-preview__img" />
          <figcaption v-if="current?.alt || count > 1" class="ew-image-preview__caption">
            <span>{{ current?.alt }}</span>
            <span v-if="count > 1">{{ index + 1 }} / {{ count }}</span>
          </figcaption>
        </figure>

        <button
          v-if="count > 1"
          type="button"
          class="ew-image-preview__arrow is-next"
          aria-label="下一张"
          @click.stop="step(1)"
        >
          <EwIcon name="chevron-right" :size="20" />
        </button>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
/**
 * EwImagePreview — 图片预览灯箱
 * 全屏遮罩 + 居中大图；Esc / 点击遮罩 / 关闭按钮关闭；
 * 多图时支持左右箭头与键盘 ← → 切换，右下角显示计数；
 * 打开期间锁定页面滚动，关闭后恢复。
 * v-model（可见） + v-model:index（当前下标）；images: [{ src, alt }] 或 url 字符串
 */
import { computed, watch, onBeforeUnmount } from 'vue'
import EwIcon from '../icon/index.vue'

const props = defineProps({
  /** 可见性（v-model） */
  modelValue: { type: Boolean, default: false },
  /** 图片列表：url 字符串或 { src, alt } */
  images: { type: Array, default: () => [] },
  /** 当前下标（v-model:index） */
  index: { type: Number, default: 0 },
  /** Esc 关闭 */
  escClose: { type: Boolean, default: true },
})

const emit = defineEmits(['update:modelValue', 'update:index', 'open', 'close', 'change'])

const count = computed(() => props.images.length)

const visible = computed(() => props.modelValue)

const normalized = computed(() =>
  props.images.map((img) => (typeof img === 'string' ? { src: img, alt: '' } : img))
)

const current = computed(() => normalized.value[props.index])

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

// Esc / 方向键 + 滚动锁定
watch(() => props.modelValue, (visible) => {
  if (typeof document === 'undefined') return
  if (visible) {
    document.addEventListener('keydown', onKeydown)
    document.body.style.overflow = 'hidden'
    emit('open')
  } else {
    document.removeEventListener('keydown', onKeydown)
    document.body.style.overflow = ''
  }
})

onBeforeUnmount(() => {
  if (typeof document === 'undefined') return
  document.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
</script>

<style src="./style.css"></style>
