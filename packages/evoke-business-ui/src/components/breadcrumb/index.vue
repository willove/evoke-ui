<template>
  <div class="ev-breadcrumb ev-breadcrumb" :style="gapStyle" aria-label="Breadcrumb">
    <!-- 配置式用法：items 数组 -->
    <template v-if="items?.length">
      <ev-breadcrumb-item v-for="(item, i) in items" :key="i" :to="item.to" :replace="item.replace">
        <ev-icon v-if="item.icon" :name="typeof item.icon === 'string' ? item.icon : 'link'" :size="14" style="margin-right: 4px;" />
        {{ item.label }}
      </ev-breadcrumb-item>
    </template>
    <slot />
  </div>
</template>

<script setup>
/**
 * EvBreadcrumb — 面包屑
 * items 配置数组 + separator / separator-icon
 */
import { provide, toRef, reactive, computed } from 'vue'
import EvIcon from '../icon/index.vue'
import EvBreadcrumbItem from './item.vue'

const props = defineProps({
  items: { type: Array, default: undefined },
  separator: { type: String, default: '/' },
  separatorIcon: { type: String, default: '' },
  /** 分隔符左右间距：数字按 px，字符串原样（'12px' / '8pt' / '1em' 等） */
  separatorSpacing: { type: [Number, String], default: undefined },
})

const gapStyle = computed(() => {
  if (props.separatorSpacing === undefined) return undefined
  const v = props.separatorSpacing
  return { '--ev-breadcrumb-separator-gap': typeof v === 'number' ? `${v}px` : v }
})

// 子项按挂载顺序登记 uid → 最后一项判定用
const registry = reactive([])
provide('breadcrumbRegistry', registry)
provide('breadcrumbSeparator', toRef(props, 'separator'))
provide('breadcrumbSeparatorIcon', toRef(props, 'separatorIcon'))
</script>

<style src="./style.css"></style>
