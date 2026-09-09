<template>
  <div class="ev-watermark ev-watermark" :style="{ position: 'relative', overflow: 'hidden' }">
    <div
      v-if="dataUrl"
      class="ev-watermark__body"
      :style="bodyStyle"
    >
      <slot />
    </div>
    <slot v-else />
  </div>
</template>

<script setup>
/**
 * EvWatermark — 水印（双层结构类）
 * canvas 绘制文字/图片 → dataURL 平铺为背景图；绘制在 mounted 后执行（Electron 安全）
 */
import { ref, computed, watch, onMounted, nextTick } from 'vue'

const props = defineProps({
  width: { type: Number, default: 120 },
  height: { type: Number, default: 64 },
  rotate: { type: Number, default: -22 },
  zIndex: { type: Number, default: 9 },
  image: { type: String, default: '' },
  content: { type: [String, Array], default: '' },
  font: { type: Object, default: () => ({}) },
  gap: { type: Array, default: () => [100, 100] },
  offset: { type: Array, default: () => [0, 0] },
  alpha: { type: Number, default: 1 },
})

const dataUrl = ref('')

const defaultFont = {
  color: 'rgba(0, 0, 0, 0.15)',
  fontSize: 16,
  fontWeight: 'normal',
  fontFamily: 'sans-serif',
  fontStyle: 'normal',
}
const mergedFont = computed(() => ({ ...defaultFont, ...props.font }))
const normalizedContent = computed(() =>
  Array.isArray(props.content) ? props.content.join('\n') : props.content,
)

function draw() {
  if (typeof document === 'undefined') return
  const canvas = document.createElement('canvas')
  const ratio = window.devicePixelRatio || 1
  const gapX = props.gap?.[0] ?? 100
  const gapY = props.gap?.[1] ?? 100
  canvas.width = (props.width + gapX) * ratio
  canvas.height = (props.height + gapY) * ratio
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    // 无 canvas 环境（如 jsdom）：降级为透明占位，保持结构完整
    dataUrl.value = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
    return
  }
  ctx.scale(ratio, ratio)
  ctx.translate(props.offset?.[0] ?? 0, props.offset?.[1] ?? 0)
  ctx.globalAlpha = props.alpha
  ctx.rotate((props.rotate * Math.PI) / 180)

  if (props.image) {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.referrerPolicy = 'no-referrer'
    img.onload = () => {
      ctx.drawImage(img, 0, 0, props.width, props.height)
      dataUrl.value = canvas.toDataURL()
    }
    img.src = props.image
    return
  }

  const f = mergedFont.value
  ctx.font = `${f.fontStyle} ${f.fontWeight} ${f.fontSize}px ${f.fontFamily}`
  ctx.fillStyle = f.color
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const lines = (normalizedContent.value ?? '').split('\n')
  const lineHeight = f.fontSize * 1.2
  const startY = props.height / 2 - ((lines.length - 1) * lineHeight) / 2
  lines.forEach((line, i) => {
    ctx.fillText(line, props.width / 2, startY + i * lineHeight)
  })
  dataUrl.value = canvas.toDataURL()
}

watch(
  () => [props.content, props.image, props.font, props.gap, props.rotate, props.width, props.height],
  () => {
    onMountedQueueDraw()
  },
  { deep: true },
)

function onMountedQueueDraw() {
  nextTick(draw)
}

onMounted(draw)

const bodyStyle = computed(() => ({
  position: 'relative',
  zIndex: props.zIndex,
  backgroundImage: `url(${dataUrl.value})`,
  backgroundRepeat: 'repeat',
}))
</script>

<style src="./style.css"></style>
