<template>
  <div :class="['ev-tabs', `is-${variant}`, `is-${size}`]" role="tablist" ref="trackRef">
    <template v-if="variant === 'capsule'">
      <span v-if="thumbReady" class="ev-tabs__thumb" :style="thumbStyle" aria-hidden="true" />
      <button
        v-for="(item, i) in items"
        :key="item.value"
        :ref="(el) => (itemEls[i] = el)"
        type="button"
        role="tab"
        :aria-selected="current === item.value"
        :class="['ev-tabs__item', { 'is-active': current === item.value, 'is-disabled': item.disabled }]"
        @click="select(item)"
      >
        <EvIcon v-if="item.icon" :name="item.icon" :size="iconSize" />
        <span>{{ item.label }}</span>
      </button>
    </template>
    <template v-else>
      <button
        v-for="item in items"
        :key="item.value"
        type="button"
        role="tab"
        :aria-selected="current === item.value"
        :class="['ev-tabs__item', { 'is-active': current === item.value, 'is-disabled': item.disabled }]"
        @click="select(item)"
      >
        <EvIcon v-if="item.icon" :name="item.icon" :size="iconSize" />
        <span>{{ item.label }}</span>
      </button>
    </template>
  </div>
</template>

<script setup>
/**
 * EvTabs — 标签页/分段控件
 * variant：capsule 分段胶囊（灰轨道 + 弹性滑块跟随）/ underline 下划线
 * 滑块位置随激活项平滑移动（resize 自适应）
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import EvIcon from '../icon/index.vue'
import { useUncontrolled } from '../../composables/useUncontrolled'

const props = defineProps({
  /** 当前值（v-model） */
  modelValue: { type: [String, Number], default: '' },
  /** 非受控模式的初始值 */
  defaultValue: { type: [String, Number], default: undefined },
  /** [{ label, value, icon?, disabled? }] */
  items: { type: Array, default: () => [] },
  variant: {
    type: String,
    default: 'capsule',
    validator: (v) => ['capsule', 'underline'].includes(v),
  },
  size: {
    type: String,
    default: 'default',
    validator: (v) => ['small', 'default', 'large'].includes(v),
  },
})

const emit = defineEmits(['update:modelValue', 'change'])

const { value: current, set } = useUncontrolled(props, { defaultValue: props.defaultValue })

const trackRef = ref(null)
const itemEls = ref([])
const thumb = ref({ left: 0, width: 0 })
const thumbReady = ref(false)

const iconSize = computed(() => (props.size === 'small' ? 13 : props.size === 'large' ? 16 : 14))

const thumbStyle = computed(() => ({
  transform: `translateX(${thumb.value.left}px)`,
  width: `${thumb.value.width}px`,
}))

function measure() {
  if (props.variant !== 'capsule') return
  nextTick(() => {
    const activeIndex = props.items.findIndex((it) => it.value === current.value)
    const active = itemEls.value[activeIndex]
    if (!active) {
      thumbReady.value = false
      return
    }
    const width = active.offsetWidth
    if (!width) {
      thumbReady.value = false
      return
    }
    thumbReady.value = true
    thumb.value = { left: active.offsetLeft, width }
  })
}

function select(item) {
  if (item.disabled || item.value === current.value) return
  emit('update:modelValue', set(item.value))
  emit('change', item.value)
}

watch(() => [current.value, props.items, props.variant], measure)
onMounted(() => {
  measure()
  if (typeof ResizeObserver !== 'undefined' && trackRef.value) {
    const ro = new ResizeObserver(measure)
    ro.observe(trackRef.value)
    onBeforeUnmount(() => ro.disconnect())
  } else {
    window.addEventListener('resize', measure)
    onBeforeUnmount(() => window.removeEventListener('resize', measure))
  }
})
onBeforeUnmount(() => {
  itemEls.value = []
})
</script>

<style src="./style.css"></style>
