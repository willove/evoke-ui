<template>
  <div class="et-statusbar et-statusbar">
    <!--
      EtStatusBar — 状态栏（tools-ui 计划 05 §四 L4 / M3 交付物 2）

      高度钉死 --et-chrome-statusbar-height（chrome 预算不变量）：条目再多也
      不换行、不撑高——左区弹性压缩 + 条目省略号，放不下先切左区条目。

      左区：left 槽（就绪语等产品内容）与内置可配置项 items 共存，槽在前；
      中区：center 槽（无内置内容）；右区：right 槽优先于内置工具位
      （缩放显示）——产品给了右槽就不渲染内置缩放，工具位完全归产品。
    -->
    <div class="et-statusbar__side et-statusbar__side--left">
      <slot name="left" />
      <button
        v-for="(item, index) in visibleItems"
        :key="item.key ?? index"
        type="button"
        class="et-statusbar__item"
        :aria-label="itemAria(item)"
        @click="onItemClick(item)"
      >
        <span class="et-statusbar__label">{{ item.label }}</span>
        <span v-if="hasValue(item)" class="et-statusbar__value">{{ item.value }}</span>
      </button>
    </div>

    <div v-if="slots.center" class="et-statusbar__side et-statusbar__side--center">
      <slot name="center" />
    </div>

    <div class="et-statusbar__side et-statusbar__side--right">
      <slot name="right" />
      <span v-if="!slots.right && zoomText" class="et-statusbar__zoom">{{ zoomText }}</span>
    </div>
  </div>
</template>

<script setup>
/**
 * EtStatusBar — 状态栏（tools-ui 计划 05 §四 L4 / M3 交付物 2）
 *
 * 契约：items 可配置（统计 / 缩放 / 协同等产品语义的数据面），条目可键盘聚焦
 * （原生 button 包壳 + aria-label 组合可访问名）；点击只发 item-click(key)
 * 事件（数据里的 onClick 同场回调，两种接法等价，别同时用）。
 * zoom 是内置工具位（右区，'' = 不渲染）：数字原样显示，带 % 等形态由产品传
 * 字符串自决；right 槽一旦提供，内置工具位整体让位（右槽优先）。
 *
 * chrome 纪律：高度 --et-chrome-statusbar-height 钉死，overflow 隐藏兜底，
 * 禁换行禁撑高（G7 + M2 装配出口"无页面级横向溢出"同源）。
 */
import { computed, useSlots } from 'vue'

defineOptions({ name: 'EtStatusBar' })

const props = defineProps({
  /** 可配置项：{ key, label, value?, visible?, onClick? }（visible === false 不渲染） */
  items: { type: Array, default: () => [] },
  /** 内置工具位：缩放显示（'' = 不渲染；数字原样，字符串自定形态） */
  zoom: { type: [Number, String], default: '' },
})

const emit = defineEmits(['item-click'])

const slots = useSlots()

/** visible 缺省 true（显式 false 才隐藏）；坏条目（非对象）直接跳过不渲染 */
const visibleItems = computed(() =>
  (Array.isArray(props.items) ? props.items : []).filter(
    (item) => item && typeof item === 'object' && item.visible !== false,
  ),
)

const hasValue = (item) => item.value !== undefined && item.value !== null && item.value !== ''
const itemAria = (item) => (hasValue(item) ? `${item.label} ${item.value}` : `${item.label}`)

/** zoom 归一：空值（'' / null / undefined）不渲染内置工具位 */
const zoomText = computed(() => {
  const { zoom } = props
  if (zoom === '' || zoom === null || zoom === undefined) return ''
  return String(zoom)
})

function onItemClick(item) {
  emit('item-click', item.key)
  // 数据面回调与事件面等价：接了 item-click 就别在数据里再挂 onClick（会调两次）
  if (typeof item.onClick === 'function') item.onClick(item)
}
</script>

<style src="./style.css"></style>
