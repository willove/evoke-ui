<template>
  <div class="et-provider">
    <eb-config-provider v-bind="$attrs">
      <slot />
    </eb-config-provider>
  </div>
</template>

<script setup>
/**
 * EtProvider — 工具框架的全局提供者（tools-ui 计划 05 §三，M0）
 *
 * 职责只有两件（其余透传给 EbConfigProvider：locale / 主题 / zIndex 管理等）：
 *   1. 注入密度档位（compact / default / relaxed）——03 §3.1
 *   2. 把密度写成根级属性 <html data-density>，令牌按选择器整组切换
 *
 * 为什么写 documentElement：chrome（标题栏/工具区/状态栏）与画布是整页布局，
 * 密度必须对整个文档生效；只包一层 div 的话画布侧的 --ot-* 取值拿不到档位。
 * 嵌套 EtProvider 以最后挂载者为准（一个产品一个密度，与计划一致）。
 */
import { computed, provide, onMounted, onBeforeUnmount } from 'vue'
import EbConfigProvider from '@wil-works/evoke-business-ui/config-provider'
import { ET_DENSITY_KEY, ET_DENSITIES } from '../../composables/useDensity'

defineOptions({ name: 'EtProvider', inheritAttrs: false })

const props = defineProps({
  density: {
    type: String,
    default: 'default',
    validator: (v) => ET_DENSITIES.includes(v),
  },
})

provide(ET_DENSITY_KEY, computed(() => props.density))

let previous = null
let owned = false

onMounted(() => {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  previous = root.getAttribute('data-density')
  // 自己写下的值卸载时还原；外部已设置的（如视觉测试直接写 html）不动
  owned = true
  root.setAttribute('data-density', props.density)
})

onBeforeUnmount(() => {
  if (!owned || typeof document === 'undefined') return
  const root = document.documentElement
  if (previous === null) root.removeAttribute('data-density')
  else root.setAttribute('data-density', previous)
})
</script>

<style src="./style.css"></style>
