<script setup>
/**
 * CaseStage — 案例舞台：浏览器窗框 + 定宽渲染 + 缩放适配
 * 案例内部始终以 ≥1200px 的桌面宽度渲染（组件布局不会因容器变窄而挤压错位），
 * 容器不够宽时整体等比缩小适配；容器更宽时按实际宽度铺开（上限 1280，由样式控制）。
 * 槽内即案例站点内容（导航/Hero/版块/页脚），窗框与地址栏由本组件渲染。
 * 传 live-url 时，窗框右侧出现「新窗口打开」按钮，跳转到原生全屏版本。
 */
import { onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps({
  /** 窗框地址栏显示的地址 */
  url: { type: String, default: '' },
  /** 原生全屏版本的地址（传入后窗框出现「新窗口打开」按钮） */
  liveUrl: { type: String, default: '' },
  /** 案例的最小渲染宽度 */
  designWidth: { type: Number, default: 1200 },
})

const frame = ref(null)
const stageWidth = ref(props.designWidth)
const zoom = ref(1)

let observer
onMounted(() => {
  const update = () => {
    const w = frame.value ? frame.value.clientWidth : props.designWidth
    stageWidth.value = Math.max(props.designWidth, w)
    zoom.value = Math.min(1, w / stageWidth.value)
  }
  update()
  observer = new ResizeObserver(update)
  if (frame.value) observer.observe(frame.value)
})
onBeforeUnmount(() => observer && observer.disconnect())
</script>

<template>
  <div ref="frame" class="case-stage-frame">
    <div class="case-stage">
      <!-- 窗框条不参与缩放，保持原生大小可读可点 -->
      <div class="case-stage__bar">
        <span class="case-stage__dot" /><span class="case-stage__dot" /><span class="case-stage__dot" />
        <span class="case-stage__url">{{ url }}</span>
        <a
          v-if="liveUrl"
          :href="liveUrl"
          target="_blank"
          rel="noopener"
          class="case-stage__open"
          title="在新窗口打开原生全屏版本"
        >
          <EvIcon name="external-link" :size="13" />
          <span>新窗口打开</span>
        </a>
      </div>
      <!-- 缩放只作用于视口内容 -->
      <div class="case-stage__zoomer" :style="{ width: stageWidth + 'px', zoom: zoom }">
        <div class="case-stage__viewport">
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.case-stage-frame {
  margin: 20px 0 28px;
  /* 水合前的瞬时溢出不出现在页面上 */
  overflow: hidden;
}
</style>
