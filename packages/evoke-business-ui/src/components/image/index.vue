<template>
  <div
    ref="containerRef"
    class="ev-image ev-image"
    :class="{ 'is-round': round }"
    :style="containerStyle"
  >
    <slot v-if="hasLoadError" name="error">
      <div class="ev-image__error">加载失败</div>
    </slot>
    <template v-else>
      <div v-if="effectiveSrc && loading" class="ev-image__placeholder">
        <slot name="placeholder" />
      </div>
      <img
        v-if="effectiveSrc"
        class="ev-image__inner"
        :class="[`ev-image__inner--${fit}`, { 'is-error': false }]"
        :src="effectiveSrc"
        :alt="alt"
        :loading="lazy ? 'lazy' : undefined"
        :referrerpolicy="referrerpolicy"
        :style="previewable ? 'cursor: pointer;' : undefined"
        @load="handleLoad"
        @error="handleError"
        @click="handleClick"
      >
    </template>
    <ev-image-viewer
      v-if="previewSrcList?.length"
      v-model="showViewer"
      :url-list="previewSrcList"
      :initial-index="previewIndex"
      :hide-on-click-modal="hideOnClickModal"
      @switch="emit('switch', $event)"
      @close="emit('close')"
    />
  </div>
</template>

<script setup>
/**
 * EvImage — 图片
 * lazy 用 IntersectionObserver（生命周期内创建，Electron 安全）；preview-src-list 复用 EvImageViewer
 */
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import EvImageViewer from '../image-viewer/index.vue'

const props = defineProps({
  src: { type: String, default: '' },
  alt: { type: String, default: '' },
  fit: {
    type: String,
    default: 'cover',
    validator: (v) => ['fill', 'contain', 'cover', 'none', 'scale-down'].includes(v),
  },
  width: { type: [String, Number], default: '' },
  height: { type: [String, Number], default: '' },
  round: { type: Boolean, default: false },
  lazy: { type: Boolean, default: false },
  previewSrcList: { type: Array, default: () => [] },
  initialIndex: { type: Number, default: 0 },
  hideOnClickModal: { type: Boolean, default: false },
  referrerpolicy: { type: String, default: undefined },
})

const emit = defineEmits(['load', 'error', 'switch', 'close'])

const containerRef = ref(null)
const loading = ref(true)
const hasLoadError = ref(false)
const showViewer = ref(false)
const previewIndex = ref(props.initialIndex)

// 懒加载：进入视口才开始请求
const inViewport = ref(!props.lazy)
let observer = null

onMounted(() => {
  if (!props.lazy || inViewport.value) return
  const el = containerRef.value
  if (el && typeof IntersectionObserver !== 'undefined') {
    observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          inViewport.value = true
          observer?.disconnect()
          observer = null
        }
      },
      { threshold: 0.1 },
    )
    observer.observe(el)
  } else {
    // 无 IO 环境（老 webview）直接降级为立即加载
    inViewport.value = true
  }
})
onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
})

const effectiveSrc = computed(() => (props.lazy && !inViewport.value ? '' : props.src))

watch(
  () => props.src,
  () => {
    loading.value = true
    hasLoadError.value = false
  },
)

function handleLoad(e) {
  loading.value = false
  hasLoadError.value = false
  emit('load', e)
}
function handleError(e) {
  loading.value = false
  hasLoadError.value = true
  emit('error', e)
}

const previewable = computed(() => props.previewSrcList?.length > 0)

function handleClick() {
  if (!previewable.value) return
  previewIndex.value = props.initialIndex
  showViewer.value = true
}

const containerStyle = computed(() => ({
  width: typeof props.width === 'number' ? `${props.width}px` : props.width || undefined,
  height: typeof props.height === 'number' ? `${props.height}px` : props.height || undefined,
}))
</script>

<style src="./style.css"></style>
