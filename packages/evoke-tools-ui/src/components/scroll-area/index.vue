<template>
  <div class="et-scroll-area" :class="rootClass">
    <slot />
  </div>
</template>

<script setup>
/**
 * EtScrollArea — 工具界面滚动内容区（tools-ui 计划 05 §四 L3 / M2）
 *
 * 定位：面板 / 工具区里"内容比容器大"的位的统一滚动外壳。本件只做 overflow
 * 容器——不引入第二套滚动条样式：底座 EbScrollbar 需要显式使用时由消费方决定
 * （列表类内容消费方自里自外各取所需），框架不替产品选滚动条皮肤。
 *
 * 三条工具界面语义：
 *   ① 方向声明（auto / vertical / horizontal）：内容轴与容器轴不符时才滚，
 *      另一轴锁死——侧栏里横滚的面板会把整个工作台带歪；
 *   ② 嵌套滚动不链控（overscroll-behavior: contain）：面板内容滚到底不带动
 *      外壳继续滚（05 §四 验收：面板内容滚动不影响外壳）；
 *   ③ 空内容保一行（min-height 取 --et-size-row）：滚动区是列表位，塌成 0
 *      会让空态与加载态之间闪跳。
 */
import { computed } from 'vue'

defineOptions({ name: 'EtScrollArea' })

const props = defineProps({
  /** 滚动方向：auto 双轴；vertical 只纵滚（横轴锁死）；horizontal 只横滚 */
  direction: {
    type: String,
    default: 'auto',
    validator: (v) => ['auto', 'vertical', 'horizontal'].includes(v),
  },
})

const rootClass = computed(() => `et-scroll-area--${props.direction}`)
</script>

<style src="./style.css"></style>
