<template>
  <i
    class="eb-icon"
    :style="iconStyle"
    aria-hidden="true"
    v-bind="$attrs"
  >
    <component :is="resolvedIcon || asyncIcon" v-if="resolvedIcon || asyncIcon" />
    <slot v-else />
  </i>
</template>

<script setup>
defineOptions({ inheritAttrs: false })
/**
 * EbIcon — 图标组件
 * 根节点挂 eb-icon class
 */
import { computed, ref, watch } from 'vue'
import { getIconByNameSync, getIconByName } from './iconRegistry'

const props = defineProps({
  /** 图标组件或图标名称（kebab-case，如 'search', 'arrow-down'） */
  name: { type: [Object, String], default: undefined },
  /** 图标别名，用于兼容 `:icon="Plus"` 的写法（name 未提供时作为回退源） */
  icon: { type: [Object, String], default: undefined },
  /** 图标大小 */
  size: { type: [String, Number], default: 16 },
  /** 图标颜色 */
  color: { type: String, default: undefined },
})

// 合并 name 和 icon 两个来源，name 优先级更高
const iconSource = computed(() => props.name ?? props.icon)

// 统一解析：custom → brand（彩色）→ 内置 SVG → 完整图标库（custom: 前缀亦可）
const resolvedIcon = computed(() => {
  const source = iconSource.value
  if (!source) return undefined
  if (typeof source !== 'string') return source
  return getIconByNameSync(source)
})

// 异步自愈：同步未命中（可能是未加载的全量库图标）时异步重试一次，命中后补渲染
const asyncIcon = ref()
let asyncTriedFor = undefined

watch(
  [resolvedIcon, iconSource],
  ([resolved, source]) => {
    if (resolved || typeof source !== 'string' || source.startsWith('custom:')) {
      asyncIcon.value = undefined
      return
    }
    if (asyncTriedFor === source) return
    asyncTriedFor = source
    getIconByName(source)
      .then((comp) => {
        if (comp && iconSource.value === source) asyncIcon.value = comp
      })
      .catch(() => {})
  },
  { immediate: true }
)

const iconStyle = computed(() => {
  const size = typeof props.size === 'number' ? `${props.size}px` : props.size
  const style = { fontSize: size }
  if (props.color) style.color = props.color
  return style
})
</script>

<style src="./style.css"></style>
