<template>
  <div ref="rootRef" class="eb-affix" :style="wrapperStyle">
    <div v-if="fixed" class="eb-affix__affix" :style="affixStyle">
      <slot />
    </div>
    <slot v-else />
  </div>
</template>

<script setup>
/**
 * EbAffix — 固钉
 * fixed 时根元素按实测尺寸占位，布局不跳动；有 target 时滚出目标区自动脱离
 */
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  offset: { type: Number, default: 0 },
  position: {
    type: String,
    default: 'top',
    validator: (v) => ['top', 'bottom'].includes(v),
  },
  target: { type: String, default: '' },
  zIndex: { type: Number, default: 100 },
})

const emit = defineEmits(['scroll', 'change'])

const rootRef = ref(null)
const fixed = ref(false)
const size = ref({ width: 0, height: 0 })

const wrapperStyle = computed(() =>
  fixed.value ? { width: `${size.value.width}px`, height: `${size.value.height}px` } : {},
)

const affixStyle = computed(() => {
  if (!fixed.value) return {}
  const style = {
    width: `${size.value.width}px`,
    height: `${size.value.height}px`,
    zIndex: props.zIndex,
  }
  if (props.position === 'top') style.top = `${props.offset}px`
  else style.bottom = `${props.offset}px`
  return style
})

function update() {
  const root = rootRef.value
  if (!root) return
  const rect = root.getBoundingClientRect()
  const targetRect = props.target ? document.querySelector(props.target)?.getBoundingClientRect() : null
  const viewHeight = window.innerHeight

  let isFixed
  if (props.position === 'top') {
    isFixed = rect.top <= props.offset && (!targetRect || targetRect.bottom >= rect.height + props.offset)
  } else {
    isFixed = rect.bottom >= viewHeight - props.offset && (!targetRect || targetRect.top <= viewHeight - props.offset - rect.height)
  }
  setFixed(isFixed)
  emit('scroll', { scrollTop: window.scrollY, fixed: fixed.value })
}

// 状态切换时同步实测占位尺寸并 emit change
function setFixed(next) {
  if (fixed.value === next) return
  if (next && rootRef.value) {
    const rect = rootRef.value.getBoundingClientRect()
    size.value = { width: rect.width, height: rect.height }
  }
  fixed.value = next
  emit('change', next)
}

onMounted(() => {
  window.addEventListener('scroll', update, { passive: true })
  window.addEventListener('resize', update, { passive: true })
  update()
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', update)
  window.removeEventListener('resize', update)
})
</script>

<style src="./style.css"></style>
