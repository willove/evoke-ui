<template>
  <div class="et-toolgroup et-toolgroup" role="group" :aria-label="label || undefined">
    <div class="et-toolgroup__row">
      <slot />
    </div>
    <div v-if="label" class="et-toolgroup__label">{{ label }}</div>
  </div>
</template>

<script setup>
/**
 * EtToolGroup — 工具区分组（tools-ui 计划 05 §四，M0 原子件）
 *
 * 结构 = 控件行 + 组标题行（对齐 Office 功能区的组名在下形态）。控件行混排
 * ToolButton / Dropdown / Select / Divider / ToolSpacer，由消费方（L2 工具区）
 * 按菜单 schema 装配；组与组之间的分隔用 EtDivider，不在组内。
 *
 * 两条不变量（G7 判定 2/4，上一代"组名三基线"与"宽度不足换行撑高"的缺陷门）：
 *   1. 组标题行高度固定 --et-chrome-group-label-height，不随内容撑开 —— 同排所有
 *      组的标题行 y 相同；
 *   2. 控件行 flex-wrap: nowrap —— 宽度不足由 L2 走溢出折叠，禁换行。
 */
defineOptions({ name: 'EtToolGroup' })

defineProps({
  /** 组标题行文本（为空时不渲染标题行，组不占标题带高度） */
  label: { type: String, default: '' },
})
</script>

<style src="./style.css"></style>
