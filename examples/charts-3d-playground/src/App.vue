<script setup>
import { ref, onMounted } from 'vue'
import { EvChart3d, applySeriesPalette, createSvgRecorder } from '@wil-works/charts-3d'

const dark = ref(false)
const spinning = ref(false)
const palette = ref('')
const barRef = ref(null)
const svgOut = ref('')

const months = ['1月', '2月', '3月', '4月', '5月', '6月']

const barOptions = ref({
  type: 'bar3d',
  title: { text: '季度出货量', subtitle: '区域 × 月份（拖拽旋转 / 滚轮缩放 / 双击复位）' },
  labels: months,
  series: [
    { name: '华东', data: [420, 380, 500, 460, 540, 610] },
    { name: '华南', data: [300, 340, 320, 410, 390, 450] },
    { name: '西南', data: [180, 220, 260, 240, 300, 280] },
  ],
  zAxis: { name: '出货量（件）' },
  camera: { pitch: 26 },
  animation: { duration: 800 },
})

const lineOptions = ref({
  type: 'line3d',
  title: { text: '室温监测', subtitle: '多测点空间折线，投影线辅助读数' },
  labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
  series: [
    { name: '车间 A', data: [18, 17.5, 21, 26, 27, 23] },
    { name: '车间 B', data: [16, 16.5, 19, 23, 24.5, 21] },
    { name: '库房', data: [12, 12, 13, 15, 16, 14] },
  ],
  line: { area: true, width: 2.6 },
  zAxis: { name: '温度 °C' },
  camera: { yaw: -38, pitch: 24 },
  animation: { duration: 800 },
})

const scatterOptions = ref({
  type: 'scatter3d',
  title: { text: '样本分布', subtitle: '三维散点，颜色编码 Z 值' },
  scatterData: (() => {
    const pts = []
    let seed = 7
    const rnd = () => {
      seed = (seed * 9301 + 49297) % 233280
      return seed / 233280
    }
    for (let i = 0; i < 90; i++) {
      pts.push([
        Math.round(rnd() * 100) / 10,
        Math.round(rnd() * 100) / 10,
        Math.round((Math.sin(rnd() * 6) * 4 + rnd() * 8) * 10) / 10,
      ])
    }
    return pts
  })(),
  scatter: { size: 5, colorScale: 'heat' },
  zAxis: { name: '强度' },
  camera: { yaw: -55, pitch: 30 },
  animation: { duration: 800 },
})

const surfaceOptions = ref({
  type: 'surface3d',
  title: { text: '波面 z = sin(r)/r', subtitle: '高度场 · 连续色带' },
  surfaceData: (() => {
    const n = 42
    const x = []
    const y = []
    const z = []
    for (let i = 0; i < n; i++) {
      x.push(Math.round((-3 + (6 * i) / (n - 1)) * 100) / 100)
      y.push(Math.round((-3 + (6 * i) / (n - 1)) * 100) / 100)
    }
    for (let j = 0; j < n; j++) {
      const row = []
      for (let i = 0; i < n; i++) {
        const r = Math.sqrt(x[i] ** 2 + y[j] ** 2) || 0.15
        row.push(Math.round((Math.sin(r * 2) / (r * 0.55)) * 100) / 100)
      }
      z.push(row)
    }
    return { x, y, z }
  })(),
  surface: { wireframe: true, ramp: 'classic', opacity: 1 },
  zAxis: { name: '幅值' },
  camera: { yaw: -45, pitch: 32 },
  animation: { duration: 800 },
})

const pieOptions = ref({
  type: 'pie3d',
  title: { text: '渠道构成' },
  pieData: [
    { name: '直销', value: 42 },
    { name: '渠道', value: 26 },
    { name: '电商', value: 18 },
    { name: '海外', value: 9 },
    { name: '其他', value: 5 },
  ],
  pie: { thickness: 0.2, padAngle: 0.02 },
  animation: { duration: 800 },
})

const doughnutOptions = ref({
  type: 'pie3d',
  title: { text: '环形 · 库存占比' },
  pieData: [
    { name: '原料', value: 35 },
    { name: '在制', value: 25 },
    { name: '成品', value: 30 },
    { name: '报废', value: 10 },
  ],
  pie: { innerRadius: 0.16, thickness: 0.16, startAngle: -90 },
  animation: { duration: 800 },
})

const applyPalette = (id) => {
  palette.value = id
  applySeriesPalette(id)
}

const toggleDark = () => {
  dark.value = !dark.value
  document.documentElement.classList.toggle('dark', dark.value)
  document.dispatchEvent(new CustomEvent('ev-theme-change', { bubbles: true, detail: { dark: dark.value } }))
}

const toggleSpin = () => {
  spinning.value = !spinning.value
  for (const opt of [barOptions, lineOptions, scatterOptions, surfaceOptions, pieOptions, doughnutOptions]) {
    opt.value = { ...opt.value, camera: { ...(opt.value.camera || {}), autoRotate: spinning.value, autoRotateSpeed: 14 } }
  }
}

const exportSvg = () => {
  const scratch = document.createElement('canvas')
  const real = scratch.getContext('2d')
  const recorder = createSvgRecorder(real)
  const svg = barRef.value?.exportSVG({ ctx: recorder.ctx, toSvg: (w, h, bg) => recorder.toSvg(w, h, bg) })
  svgOut.value = svg ? `bar3d 导出 SVG 成功（${svg.length} 字符）` : '导出失败'
}

onMounted(() => {
  applyPalette('aurora')
})
</script>

<template>
  <header>
    <h1>Charts 3D Playground</h1>
    <p>透视投影自绘 · 零 WebGL 依赖</p>
    <div class="spacer"></div>
    <button v-for="p in ['classic', 'aurora', 'sunset', 'forest', 'candy']" :key="p" @click="applyPalette(p)">
      {{ palette === p ? '● ' : '' }}{{ p }}
    </button>
    <button @click="toggleSpin">{{ spinning ? '停止旋转' : '自动旋转' }}</button>
    <button @click="exportSvg">导出 SVG</button>
    <button @click="toggleDark">{{ dark ? '浅色' : '深色' }}</button>
  </header>
  <p class="hint">{{ svgOut }}</p>
  <div class="grid">
    <div class="card"><h2>bar3d<span>三维柱状</span></h2>
      <EvChart3d ref="barRef" :options="barOptions" :height="360" /></div>
    <div class="card"><h2>line3d<span>三维折线</span></h2>
      <EvChart3d :options="lineOptions" :height="360" /></div>
    <div class="card"><h2>scatter3d<span>三维散点 + 色带</span></h2>
      <EvChart3d :options="scatterOptions" :height="360" /></div>
    <div class="card"><h2>surface3d<span>三维曲面</span></h2>
      <EvChart3d :options="surfaceOptions" :height="360" /></div>
    <div class="card"><h2>pie3d<span>三维饼图</span></h2>
      <EvChart3d :options="pieOptions" :height="340" /></div>
    <div class="card"><h2>pie3d<span>三维环形</span></h2>
      <EvChart3d :options="doughnutOptions" :height="340" /></div>
  </div>
</template>

<style scoped>
.hint {
  margin: 0 28px 14px;
  font-size: 12px;
  color: var(--pg-text-2);
  min-height: 16px;
}
</style>
