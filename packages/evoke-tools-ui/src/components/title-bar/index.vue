<template>
  <div class="et-titlebar et-titlebar" :class="rootClass">
    <!--
      EtTitleBar — 产品外壳标题栏（tools-ui 计划 05 §四 L4 / M3 交付物 1）

      宿主 × 平台二维矩阵（契约在 runtime/window/host.js，本件只查表渲染）：
      Web 宿主无窗口控制位；桌面壳 macOS 左置 traffic lights（close 先）、
      Win / Linux 右置三联钮（minimize 先）。顺序取 WINDOW_CONTROLS 表。

      槽位：brand（产品名位）/ quick（快捷访问位：保存、撤销等）/
      center（文档名位）。快捷键提示一律走 EtKeyHint（平台符号化，不手拼
      平台键字符）——产品把 EtKeyHint 放进 quick 槽即可。
    -->
    <div v-if="hasStartGroup" class="et-titlebar__group et-titlebar__group--start">
      <!-- mac：控制位置首（traffic lights 左序，DOM 序与视觉序一致） -->
      <div
        v-if="controlsOnLeft"
        class="et-titlebar__controls et-titlebar__controls--left"
        role="group"
        aria-label="窗口控制"
      >
        <button
          v-for="name in controlNames"
          :key="name"
          type="button"
          class="et-titlebar__ctrl"
          :class="{ 'is-danger': name === 'close' }"
          :aria-label="CONTROL_LABELS[name]"
          @click="onControl(name)"
        >
          <et-icon :name="CONTROL_ICONS[name]" :size="CONTROL_ICON_SIZE" />
        </button>
      </div>
      <div v-if="hasBrand" class="et-titlebar__brand">
        <slot name="brand">{{ title }}</slot>
      </div>
      <div v-if="hasQuick" class="et-titlebar__quick">
        <slot name="quick" />
      </div>
    </div>

    <!-- 纯空白拖拽带：app-region drag 只加在这里，与可点区零重叠 -->
    <div class="et-titlebar__drag" />

    <!-- 文档名位（center 槽可整体替换；docTitle 空则不渲染） -->
    <div v-if="hasCenter" class="et-titlebar__doc">
      <slot name="center">{{ docTitle }}</slot>
    </div>

    <div class="et-titlebar__drag" />

    <!-- Win / Linux：控制位置尾（右序） -->
    <div
      v-if="controlsOnRight"
      class="et-titlebar__controls et-titlebar__controls--right"
      role="group"
      aria-label="窗口控制"
    >
      <button
        v-for="name in controlNames"
        :key="name"
        type="button"
        class="et-titlebar__ctrl"
        :class="{ 'is-danger': name === 'close' }"
        :aria-label="CONTROL_LABELS[name]"
        @click="onControl(name)"
      >
        <et-icon :name="CONTROL_ICONS[name]" :size="CONTROL_ICON_SIZE" />
      </button>
    </div>
  </div>
</template>

<script setup>
/**
 * EtTitleBar — 标题栏（tools-ui 计划 05 §四 L4 / M3 交付物 1）
 *
 * 双宿主契约：窗口控制位"Web 无 / 桌面壳有"，桌面壳内按平台分左右——全部查
 * runtime/window/host.js 的表（detectPlatform / windowControlPlacement /
 * WINDOW_CONTROLS），本件不写平台 if-else，jsdom 可断全矩阵。
 * host prop 可显式钉死宿主（'web' / 'desktop'）；'auto' 走探测，且
 * documentElement 的 data-host 属性优先（宿主自证 + 测试注入同一条路径）。
 *
 * 拖曳区与可点区不冲突（M3 验收点）：-webkit-app-region: drag 只加在纯空白
 * 条带（.et-titlebar__drag，两条 flex 带分居文档名两侧，中文档名视觉居中），
 * 控制位与快捷位显式 no-drag；H5 下该属性无害。窗口动作只发事件
 * （window-control），真正调宿主 API 归产品（框架不认识窗口）。
 */
import { computed, useSlots } from 'vue'
import EtIcon from '../../icons/icon.vue'
import { detectPlatform, windowControlPlacement, WINDOW_CONTROLS } from '../../runtime/window/host'

defineOptions({ name: 'EtTitleBar' })

const props = defineProps({
  /** 产品名（brand 槽未提供时渲染） */
  title: { type: String, default: '' },
  /** 文档名（center 槽未提供时渲染；空串不渲染文档名位） */
  docTitle: { type: String, default: '' },
  /** 宿主：'auto' 走 detectPlatform 探测；'web' / 'desktop' 显式钉死 */
  host: {
    type: String,
    default: 'auto',
    validator: (v) => ['auto', 'web', 'desktop'].includes(v),
  },
  /** 窗口控制位总开关（桌面壳且为 true 才渲染；Web 宿主一律不渲染） */
  windowControls: { type: Boolean, default: true },
})

const emit = defineEmits(['window-control'])

const slots = useSlots()

/** data-host：宿主自证属性（桌面壳显式声明；测试注入同路径），优先于 UA 探测 */
function dataHostAttr() {
  if (typeof document === 'undefined') return null
  return document.documentElement.getAttribute('data-host')
}

const hostInfo = computed(() => {
  const info = detectPlatform(typeof navigator !== 'undefined' ? navigator : {}, dataHostAttr())
  // host prop 显式覆盖（'auto' 才信探测结果）
  return props.host === 'auto' ? info : { ...info, host: props.host }
})

const platform = computed(() => hostInfo.value.platform)
const placement = computed(() => windowControlPlacement(hostInfo.value.host, platform.value))
/** Web 宿主 placement 恒 'none'：控制位一律不渲染（浏览器自己的 chrome 管窗口） */
const controlsOnLeft = computed(() => props.windowControls && placement.value === 'left')
const controlsOnRight = computed(() => props.windowControls && placement.value === 'right')

/** 控制位顺序 = 契约表（mac close-first；Win/Linux minimize-first；未知平台保险右侧序） */
const controlNames = computed(() => {
  if (!controlsOnLeft.value && !controlsOnRight.value) return []
  return WINDOW_CONTROLS[platform.value] ?? WINDOW_CONTROLS.windows
})

const hasStartGroup = computed(() => controlsOnLeft.value || hasBrand.value || hasQuick.value)
const hasBrand = computed(() => !!slots.brand || props.title !== '')
const hasQuick = computed(() => !!slots.quick)
const hasCenter = computed(() => !!slots.center || props.docTitle !== '')

const rootClass = computed(() => [
  `et-titlebar--${hostInfo.value.host}`,
  `et-titlebar--${platform.value}`,
])

/** 窗口控制位：可访问名（G4：图标钮必须 aria-label）+ 16 档库内已注册图标名 */
const CONTROL_LABELS = { close: '关闭', minimize: '最小化', maximize: '最大化' }
const CONTROL_ICONS = { close: 'close', minimize: 'minus', maximize: 'fullscreen' }
const CONTROL_ICON_SIZE = 'var(--et-icon-sm)'

/** 窗口动作只冒泡给产品（'close' | 'minimize' | 'maximize'），宿主 API 归产品侧 */
function onControl(name) {
  emit('window-control', name)
}
</script>

<style src="./style.css"></style>
