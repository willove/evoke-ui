<template>
  <div class="ev-image-wall" :style="gridStyle">
    <button
      v-for="(img, i) in normalized"
      :key="i"
      type="button"
      class="ev-image-wall__item"
      :style="{ '--ev-image-wall-radius': `${radius}px` }"
      :aria-label="img.alt || `查看第 ${i + 1} 张图片`"
      @click="open(i)"
    >
      <img :src="img.src" :alt="img.alt || ''" loading="lazy" />
    </button>

    <EvImagePreview
      v-if="preview"
      v-model="previewVisible"
      v-model:index="previewIndex"
      :images="normalized"
    />
  </div>
</template>

<script setup>
/**
 * EvImageWall — 图片墙
 * 均匀网格图片墙，点击任意图片打开 EvImagePreview 灯箱预览（可关）。
 * images 项：字符串 url 或 { src, alt }；columns 列数；preview=false 时仅发出 select 事件。
 */
import { computed, ref } from 'vue'
import EvImagePreview from '../image-preview/index.vue'

const props = defineProps({
  /** 图片列表：url 字符串或 { src, alt } */
  images: { type: Array, default: () => [] },
  /** 列数 */
  columns: { type: Number, default: 3 },
  /** 间距（px） */
  gap: { type: Number, default: 14 },
  /** 点击图片是否打开预览（false 时仅派发 select 事件） */
  preview: { type: Boolean, default: true },
  /** 网格圆角（px） */
  radius: { type: Number, default: 12 },
})

const emit = defineEmits(['select'])

const previewVisible = ref(false)
const previewIndex = ref(0)

const normalized = computed(() =>
  props.images.map((img) => (typeof img === 'string' ? { src: img, alt: '' } : img))
)

const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${props.columns}, 1fr)`,
  gap: `${props.gap}px`,
}))

function open(i) {
  previewIndex.value = i
  emit('select', normalized.value[i], i)
  if (props.preview) previewVisible.value = true
}
</script>

<style src="./style.css"></style>
