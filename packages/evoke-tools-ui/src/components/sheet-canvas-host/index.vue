<template>
  <div class="et-canvashost" :class="{ 'is-scroll-x': scrollX, 'is-scroll-y': scrollY }">
    <!--
      EtSheetCanvasHost — 表格画布宿主（office 层 · 画布位）

      画布产品的"地基"：一个可滚动的视口 + 一层不随内容滚动的浮层位 + 尺寸/滚动契约 +
      键盘焦点根。它不认识单元格、也不画任何东西——格子怎么画、滚动怎么虚拟化，都在
      默认槽里由产品决定（表格产品放进自己的 canvas，图表产品放进 SVG 也成立）。

      浮层位（#overlay）用于"跟着单元格但固定于视口"的 UI：单元格编辑器、右键菜单锚点、
      拖拽指示。它绝对定位在视口之上、不参与滚动，z 走 --et-z-panel 阶梯。

      办公皮肤：视口底 = --et-chrome-bg（与 chrome 同族、无色）；边框由布局（Workbench
      区域槽）给，宿主自己不加外框——避免与停靠/分隔线叠成双线。
    -->
    <div
      ref="viewportRef"
      class="et-canvashost__viewport"
      :role="viewportRole"
      :aria-label="label"
      :tabindex="focusable ? 0 : undefined"
      @scroll.passive="onScroll"
      @focus="emit('viewport-focus')"
      @blur="emit('viewport-blur')"
    >
      <!-- 可选尺寸板：产品按内容尺寸滚动（不虚拟化时用），不传就是自动尺寸 -->
      <div
        v-if="contentWidth || contentHeight"
        class="et-canvashost__sizer"
        :style="{ width: px(contentWidth), height: px(contentHeight) }"
      >
        <slot />
      </div>
      <slot v-else />
    </div>

    <!-- 浮层位：不随内容滚动（单元格编辑器、拖拽指示等） -->
    <div v-if="overlay || $slots.overlay" class="et-canvashost__overlay">
      <slot name="overlay" />
    </div>
  </div>
</template>

<script setup>
/**
 * EtSheetCanvasHost — 表格画布宿主（office 层）
 *
 * Props
 *   label         视口可访问名（默认「表格画布」）
 *   viewportRole  视口 role（默认 group；网格产品可传 grid/application）
 *   focusable     视口可聚焦（默认 true：键盘进画布是办公硬路径）
 *   scrollX/Y     滚动轴（默认都开）
 *   overlay       渲染浮层位（有 overlay 槽时自动渲染）
 *   contentWidth / contentHeight  内容尺寸（传了就用尺寸板撑滚动条，不传自动）
 *
 * Emits
 *   resize({ width, height })          视口尺寸变化（ResizeObserver；首次挂载也发一次）
 *   scroll({ scrollLeft, scrollTop })  视口滚动
 *   viewport-focus / viewport-blur     焦点进出画布（产品据此切"导航态/编辑态"）
 *
 * 暴露：scrollTo({ left, top }) / viewportEl / sizerEl —— 键盘漫游与"滚动到选区"由产品调用。
 *
 * 注：尺寸/滚动事件是**视口**的量，不是画布内容的量；虚拟化产品按它算可见区。
 */
import { onBeforeUnmount, onMounted, ref } from 'vue'

defineOptions({ name: 'EtSheetCanvasHost' })

const props = defineProps({
  /** 视口可访问名 */
  label: { type: String, default: '表格画布' },
  /** 视口 role（网格产品可传 grid / application） */
  viewportRole: { type: String, default: 'group' },
  /** 视口可聚焦（键盘进画布是办公硬路径） */
  focusable: { type: Boolean, default: true },
  /** 横向滚动开关（关掉后内容溢出也不给横滚，虚拟化产品常用） */
  scrollX: { type: Boolean, default: true },
  /** 纵向滚动开关 */
  scrollY: { type: Boolean, default: true },
  /** 渲染浮层位（有 #overlay 槽时自动渲染） */
  overlay: { type: Boolean, default: false },
  /** 内容宽（画布真实宽，不是视口宽）；数字按 px，字符串原样落 style */
  contentWidth: { type: [Number, String], default: 0 },
  /** 内容高（同上）；两者决定滚动条量程与 resize 上报的可视尺寸 */
  contentHeight: { type: [Number, String], default: 0 },
})

const emit = defineEmits([
  /** 视口尺寸变化（ResizeObserver 实测）；载荷 = { width, height }，产品据此重绘画布 */
  'resize',
  /** 视口滚动；载荷 = { scrollLeft, scrollTop }，虚拟化窗口起点由产品算 */
  'scroll',
  /** 键盘进入画布（办公硬路径的起点） */
  'viewport-focus',
  /** 键盘离开画布 */
  'viewport-blur',
])

const viewportRef = ref(null)

const px = (v) => (typeof v === 'number' ? `${v}px` : String(v))

function onScroll(e) {
  emit('scroll', { scrollLeft: e.target.scrollLeft, scrollTop: e.target.scrollTop })
}

function scrollTo({ left = 0, top = 0 } = {}) {
  viewportRef.value?.scrollTo({ left, top })
}

let ro = null

function reportSize() {
  const el = viewportRef.value
  if (!el) return
  emit('resize', { width: el.clientWidth, height: el.clientHeight })
}

onMounted(() => {
  reportSize()
  // typeof 守卫与底座组件一致：jsdom / SSR 没有 ResizeObserver，不代表浏览器没有
  if (typeof ResizeObserver === 'function' && viewportRef.value) {
    ro = new ResizeObserver(() => reportSize())
    ro.observe(viewportRef.value)
  }
})

onBeforeUnmount(() => {
  ro?.disconnect()
  ro = null
})

defineExpose({
  /** 滚动到指定偏移（产品把键盘选区的位移交回本件执行） */
  scrollTo,
  /** 视口元素（产品的 canvas / 选区层挂在这个盒里） */
  viewportEl: viewportRef,
})
</script>

<style src="./style.css"></style>
