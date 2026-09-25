<template>
  <div
    class="et-divider"
    :class="[`et-divider--${direction}`, `et-divider--${length}`]"
    role="separator"
    :aria-orientation="direction === 'vertical' ? 'vertical' : 'horizontal'"
  />
</template>

<script setup>
/**
 * EtDivider — 工具区内的分隔线（tools-ui 计划 05 §四，M0 原子件）
 *
 * 与 EbDivider 的分工：EbDivider 是页面内容区分隔（可带文字、四向 border-style），
 * EtDivider 只做工具界面里的组间分隔与弹性占位伴生件 —— 1px 描边、长度随控件档位。
 */
defineOptions({ name: 'EtDivider' })

const props = defineProps({
  direction: {
    type: String,
    default: 'vertical',
    validator: (v) => ['horizontal', 'vertical'].includes(v),
  },
  /** 长度档位：large = 大钮高 / small = 小钮高 / row = 列表行高 */
  length: {
    type: String,
    default: 'large',
    validator: (v) => ['large', 'small', 'row'].includes(v),
  },
})
</script>

<style src="./style.css"></style>
