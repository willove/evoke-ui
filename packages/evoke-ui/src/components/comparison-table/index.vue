<template>
  <div class="ev-comparison-table">
    <table>
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
            <span class="ev-comparison-table__col-label">{{ col.label }}</span>
            <span v-if="col.note" class="ev-comparison-table__col-note">{{ col.note }}</span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, i) in rows" :key="row.label">
          <td class="ev-comparison-table__feature-col">
            <span class="ev-comparison-table__feature-label">{{ row.label }}</span>
            <span v-if="row.description" class="ev-comparison-table__feature-desc">{{ row.description }}</span>
          </td>
          <td v-for="(col, j) in columns" :key="j" :class="{ 'is-featured': col.featured }">
            <EvIcon
              v-if="row.values[j] === true"
              name="check"
              :size="16"
              class="ev-comparison-table__check"
            />
            <span v-else-if="row.values[j] === false" class="ev-comparison-table__dash">—</span>
            <span v-else class="ev-comparison-table__text">{{ row.values[j] }}</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
/**
 * EvComparisonTable — 功能对比表（定价区标配）
 * columns：[{ label, note?, featured? }]
 * rows：[{ label, description?, values: (boolean|string)[] }] — true 勾 / false 破折号 / 字符串直出
 */
import EvIcon from '../icon/index.vue'

defineProps({
  columns: { type: Array, default: () => [] },
  rows: { type: Array, default: () => [] },
  featureHead: { type: String, default: '功能' },
})
</script>

<style src="./style.css"></style>
