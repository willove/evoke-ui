<template>
  <canvas
    ref="canvasRef"
    class="eb-qrcode eb-qrcode"
    role="img"
    :aria-label="`QR Code: ${value}`"
    :style="{ width: size + 'px', height: size + 'px' }"
  />
</template>

<script setup>
/**
 * EbQrcode — 二维码（注意：注册名 Qrcode 单大写段，保证 kebab-case `eb-qrcode` 可解析）
 * 纯 JS 编码（byte 模式 / M 级纠错 / 版本 1-10 自动，见 qrcode.js），Canvas 渲染
 */
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { inBrowser } from '../../utils/dom'
import { encodeQR } from './qrcode'

defineOptions({ name: 'EbQrcode' })

const props = defineProps({
  /** 编码内容（过长时 console.error 并保持上次内容） */
  value: { type: String, default: '' },
  /** 输出尺寸（px） */
  size: { type: Number, default: 120 },
  /** 静区（四周留白，模块数） */
  margin: { type: Number, default: 4 },
  /** 前景色 */
  foreground: { type: String, default: '#000000' },
  /** 背景色 */
  background: { type: String, default: '#ffffff' },
})

const canvasRef = ref(null)

function draw() {
  const canvas = canvasRef.value
  if (!canvas || !inBrowser()) return
  let result
  try {
    result = encodeQR(props.value)
  } catch (e) {
    console.error(e.message)
    return
  }
  const { matrix, size: moduleCount } = result
  const total = moduleCount + props.margin * 2
  const scale = props.size / total
  const dpr = window.devicePixelRatio || 1
  canvas.width = props.size * dpr
  canvas.height = props.size * dpr
  const ctx = canvas.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.fillStyle = props.background
  ctx.fillRect(0, 0, props.size, props.size)
  ctx.fillStyle = props.foreground
  for (let r = 0; r < moduleCount; r++) {
    for (let c = 0; c < moduleCount; c++) {
      if (matrix[r][c]) {
        // 对齐像素边界，避免抗锯齿糊掉小模块
        const x = Math.floor((c + props.margin) * scale)
        const y = Math.floor((r + props.margin) * scale)
        const x2 = Math.floor((c + props.margin + 1) * scale)
        const y2 = Math.floor((r + props.margin + 1) * scale)
        ctx.fillRect(x, y, x2 - x, y2 - y)
      }
    }
  }
}

watch(() => [props.value, props.size, props.margin, props.foreground, props.background], draw)

let ro = null
onMounted(() => {
  draw()
  if (inBrowser() && typeof ResizeObserver !== 'undefined') {
    ro = new ResizeObserver(() => draw())
    ro.observe(canvasRef.value)
  }
})
onBeforeUnmount(() => {
  if (ro) ro.disconnect()
})

defineExpose({
  /** 导出 PNG dataURL */
  toDataURL: () => canvasRef.value?.toDataURL('image/png'),
})
</script>

<style src="./style.css"></style>
