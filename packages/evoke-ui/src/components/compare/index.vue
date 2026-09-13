<template>
  <div class="ev-compare" :class="{ 'is-bordered': bordered }">
    <div class="ev-compare__scroll">
      <table class="ev-compare__table" :style="{ minWidth: minWidth }">
        <thead>
          <tr>
            <th class="ev-compare__lead" scope="col">
              <slot name="lead" />
            </th>
            <th v-for="p in products" :key="p.name" scope="col" class="ev-compare__product">
              <img v-if="p.image" :src="p.image" :alt="p.name" class="ev-compare__image" />
              <span v-if="p.colors?.length" class="ev-compare__colors">
                <i v-for="c in p.colors" :key="c" :style="{ '--c': c }"></i>
              </span>
              <span v-if="p.badge" class="ev-compare__badge">{{ p.badge }}</span>
              <span class="ev-compare__name">
                <a v-if="p.href" :href="p.href">{{ p.name }}</a>
                <template v-else>{{ p.name }}</template>
              </span>
              <span v-if="p.tagline" class="ev-compare__tagline">{{ p.tagline }}</span>
              <span v-if="p.price" class="ev-compare__price">
                <b class="ev-compare__price-num">{{ p.price }}</b>
                <span v-if="p.priceNote" class="ev-compare__price-note">{{ p.priceNote }}</span>
              </span>
            </th>
          </tr>
        </thead>
        <tbody v-for="g in groups" :key="g.title">
          <tr v-if="g.title" class="ev-compare__group-row">
            <th :colspan="products.length + 1" scope="colgroup" class="ev-compare__group">{{ g.title }}</th>
          </tr>
          <tr v-for="row in g.rows" :key="row.label">
            <th scope="row" class="ev-compare__label">
              <span class="ev-compare__label-text">{{ row.label }}</span>
              <span v-if="row.note" class="ev-compare__label-note">{{ row.note }}</span>
            </th>
            <td v-for="(p, j) in products" :key="p.name" class="ev-compare__cell">
              <template v-if="Array.isArray(row.values[j])">
                <span v-for="(line, k) in row.values[j]" :key="k" class="ev-compare__text">{{ line }}</span>
              </template>
              <EvIcon v-else-if="row.values[j] === true" name="check" :size="16" class="ev-compare__check" />
              <span v-else-if="row.values[j] === false || row.values[j] == null" class="ev-compare__dash">—</span>
              <span v-else class="ev-compare__text">{{ row.values[j] }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
/**
 * EvCompare — 方案对比表（产品列 × 特性分组矩阵）
 * 参考 compare 页语言：产品列头带图/配色点/徽标/名称/一句话/价格；
 * groups 分组展示特性，单元格 true 勾 / false 与空 破折号 / 字符串直出 / 字符串数组多行。
 * bordered：加边框网格；默认无边框，仅组间与表头细分隔线。
 *
 * Usage:
 *   <EvCompare :products="[{ name: 'Air 13', price: '¥6,999', priceNote: '起' }]" :groups="[{ title: '显示屏', rows: [...] }]" />
 */
import { computed } from 'vue'
import EvIcon from '../icon/index.vue'

const props = defineProps({
  /** 产品列：[{ name, tagline?, price?, priceNote?, badge?, image?, colors?: string[], href? }] */
  products: { type: Array, default: () => [] },
  /** 特性分组：[{ title?, rows: [{ label, note?, values: (boolean|string|string[])[] }] }] */
  groups: { type: Array, default: () => [] },
  /** 网格边框形态；默认无边框（仅组间细分隔线） */
  bordered: { type: Boolean, default: false },
})

const minWidth = computed(() => `${Math.max(200 * (props.products.length + 1), 640)}px`)
</script>

<style src="./style.css"></style>
