<template>
  <div class="ev-comparison-table" :class="{ 'is-bordered': bordered }">
    <table :style="{ minWidth: minWidth }">
      <thead>
        <tr>
          <th class="ev-comparison-table__feature-col" scope="col">
            <slot name="feature-head">{{ featureHead }}</slot>
          </th>
          <th
            v-for="col in columns"
            :key="col.label"
            scope="col"
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
          </th>
        </tr>
      </thead>
      <tbody v-for="group in displayGroups" :key="group.title || 'all'">
        <tr v-if="group.title" class="ev-comparison-table__group-row">
          <th :colspan="columns.length + 1" scope="colgroup" class="ev-comparison-table__group">
            {{ group.title }}
          </th>
        </tr>
        <tr v-for="row in group.rows" :key="row.label">
          <td class="ev-comparison-table__feature-col">
            <span class="ev-comparison-table__feature-label">{{ row.label }}</span>
            <span v-if="row.description || row.note" class="ev-comparison-table__feature-desc">{{ row.description || row.note }}</span>
          </td>
          <td v-for="(col, j) in columns" :key="j" :class="{ 'is-featured': col.featured }">
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
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
/**
 * EvComparisonTable — 对比表（定价档位对照 / 产品方案 compare 双形态）
 * columns：[{ label, note?, featured?, image?, colors?, badge?, tagline?, href?, price?, priceNote? }] —
 *   基础字段 label/note 做定价档位；image/colors/badge/tagline/price 组合出产品 compare 列头
 * rows：[{ label, description?, values }] — 平铺行（true 勾 / false 破折号 / 字符串直出 / 字符串数组多行）
 * groups：[{ title, rows }] — 按特性分组陈列，与 rows 二选一或混用
 * bordered：网格边框形态；默认无边框（现代 compare 语言：行分隔线 + 组标题分节）
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

const displayGroups = computed(() =>
  props.groups.length ? props.groups : [{ rows: props.rows }],
)

// 列越多的表给越大的横向滚动空间：首列 120 + 每产品列 150，下限 560
const minWidth = computed(() => `${Math.max(120 + props.columns.length * 150, 560)}px`)
</script>

<style src="./style.css"></style>
