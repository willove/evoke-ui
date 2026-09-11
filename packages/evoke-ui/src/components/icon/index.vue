<template>
  <i class="ev-icon" :style="iconStyle" aria-hidden="true" v-bind="$attrs">
    <component :is="resolvedIcon" v-if="resolvedIcon" />
    <slot v-else />
  </i>
</template>

<script setup>
/**
 * EvIcon — 图标组件
 * 根节点挂 ev-icon class；name 支持 kebab-case 语义名（核心集）
 * 与 Remix 原生命名（加载展示集后，如 'brush-line'）
 */
import { computed } from 'vue'
import { getIconByName, iconRegistryVersion } from './iconRegistry'

const props = defineProps({
  /** 图标组件或图标名称（kebab-case，如 'search'） */
  name: { type: [Object, String], default: undefined },
  /** 图标大小 */
  size: { type: [String, Number], default: 16 },
  /** 图标颜色 */
  color: { type: String, default: undefined },
})

const resolvedIcon = computed(() => {
  // 依赖注册表版本：晚注册的图标（展示集异步加载 / registerIcons）出现时自动重解析
  void iconRegistryVersion.value
  const source = props.name
  if (!source) return undefined
  if (typeof source !== 'string') return source
  return getIconByName(source)
})

const iconStyle = computed(() => {
  const size = typeof props.size === 'number' ? `${props.size}px` : props.size
  const style = { fontSize: size }
  if (props.color) style.color = props.color
  return style
})
</script>

<style src="./style.css"></style>
