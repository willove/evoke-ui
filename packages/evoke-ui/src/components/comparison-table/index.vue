<template>
  <div class="ev-comparison-table" :class="{ 'is-bordered': bordered }" :style="{ minWidth: minWidth }">
    <div class="ev-comparison-table__grid" :style="gridStyle">
      <div class="ev-comparison-table__head-cell is-lead" role="columnheader">
        <slot name="feature-head">{{ featureHead }}</slot>
      </div>
      <div
        v-for="col in columns"
        :key="col.label"
        role="columnheader"
        class="ev-comparison-table__head-cell is-product"
        :class="{ 'is-featured': col.featured }"
      >
        <img v-if="col.image" :src="col.image" :alt="col.label" class="ev-comparison-table__col-image" />
        <span v-if="col.colors?.length" class="ev-comparison-table__col-colors">
          <i v-for="c in col.colors" :key="c" :style="{ '--c': c }"></i>
        </span>
        <span v-if="col.badge" class="ev-comparison-table__col-badge">{{ col.badge }}</span>
        <span class="ev-comparison-table__col-label">
          <a v-if="col.href" :href="col.href">{{ col.label }}</a>
          <template v-else>{{ col.label }}</template>
        </span>
        <span v-if="col.tagline" class="ev-comparison-table__col-tagline">{{ col.tagline }}</span>
        <span v-if="col.note" class="ev-comparison-table__col-note">{{ col.note }}</span>
        <span v-if="col.price" class="ev-comparison-table__col-price">
          <b>{{ col.price }}</b>
          <span v-if="col.priceNote">{{ col.priceNote }}</span>
        </span>
      </div>

      <template v-for="group in displayGroups" :key="group.title || 'all'">
        <div v-if="group.title" class="ev-comparison-table__group">{{ group.title }}</div>
        <template v-for="row in group.rows" :key="row.label">
          <div class="ev-comparison-table__label-cell">
            <span class="ev-comparison-table__feature-label">{{ row.label }}</span>
            <span v-if="row.description || row.note" class="ev-comparison-table__feature-desc">{{ row.description || row.note }}</span>
          </div>
          <div
            v-for="(col, j) in columns"
            :key="col.label + j"
            class="ev-comparison-table__cell"
            :class="{ 'is-featured': col.featured, 'is-last': row.isLast }"
          >
            <template v-if="Array.isArray(row.values[j])">
              <span v-for="(line, k) in row.values[j]" :key="k" class="ev-comparison-table__text is-line">{{ line }}</span>
            </template>
            <EvIcon
              v-else-if="row.values[j] === true"
              name="check"
              :size="16"
              class="ev-comparison-table__check"
            />
            <span v-else-if="row.values[j] === false || row.values[j] == null" class="ev-comparison-table__dash">—</span>
            <span v-else class="ev-comparison-table__text">{{ row.values[j] }}</span>
          </div>
        </template>
      </template>
    </div>
  </div>
</template>

<script setup>
/**
 * EvComparisonTable — 对比表（定价档位对照 / 产品方案 compare 双形态）
 * 以 CSS Grid 的 div 结构实现（非 <table>）：摆脱宿主表格样式与浏览器表格局限，
 * 无斑马纹、无悬浮变色，featured 高亮列始终清晰；列头卡片化可承载图/色点/徽标/价格。
 * columns：[{ label, note?, featured?, image?, colors?, badge?, tagline?, href?, price?, priceNote? }]
 * rows：[{ label, description?, values }] — 平铺行（true 勾 / false 破折号 / 字符串直出 / 字符串数组多行）
 * groups：[{ title, rows }] — 按特性分组陈列；bordered：网格边框形态（默认无边框现代形态）
 */
import { computed } from 'vue'
import EvIcon from '../icon/index.vue'

const props = defineProps({
  columns: { type: Array, default: () => [] },
  rows: { type: Array, default: () => [] },
  groups: { type: Array, default: () => [] },
  featureHead: { type: String, default: '功能' },
  bordered: { type: Boolean, default: false },
})

const displayGroups = computed(() => {
  const groups = props.groups.length ? props.groups : [{ rows: props.rows }]
  return groups.map((group, gi) => ({
    ...group,
    rows: group.rows.map((row, ri) => ({
      ...row,
      // 最后一组的最后一行去底部分隔线
      isLast: gi === groups.length - 1 && ri === group.rows.length - 1,
    })),
  }))
})

// 列越多的表给越大的横向滚动空间：首列 120 + 每产品列 150，下限 560
const minWidth = computed(() => `${Math.max(120 + props.columns.length * 150, 560)}px`)

const gridStyle = computed(() => ({
  gridTemplateColumns: `minmax(108px, 20%) repeat(${props.columns.length}, 1fr)`,
}))
</script>

<style src="./style.css"></style>
