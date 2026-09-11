<template>
  <div class="eb-skeleton eb-skeleton" :class="{ 'is-animated': animated }">
    <template v-if="loading">
      <div
        v-for="(_, index) in countList"
        :key="index"
        class="eb-skeleton__section"
        :class="preset !== 'text' ? `eb-skeleton__section--${preset}` : undefined"
      >
        <slot name="template">
          <!-- 常用骨架预设：一个 preset 直接得到成型的占位版式 -->
          <template v-if="preset === 'article'">
            <eb-skeleton-item variant="h1" class="is-block" />
            <eb-skeleton-item variant="text" class="is-block" />
            <eb-skeleton-item variant="text" class="is-block" />
            <eb-skeleton-item variant="text" class="eb-skeleton__row--last" />
            <eb-skeleton-item variant="h3" class="is-block" />
            <eb-skeleton-item variant="text" class="is-block" />
            <eb-skeleton-item variant="text" class="eb-skeleton__row--last" />
          </template>
          <template v-else-if="preset === 'avatar-text'">
            <div class="eb-skeleton__avatar-line">
              <eb-skeleton-item variant="circle" class="eb-skeleton__avatar" />
              <div class="eb-skeleton__avatar-lines">
                <eb-skeleton-item variant="text" class="is-block" />
                <eb-skeleton-item variant="caption" class="is-block" />
              </div>
            </div>
          </template>
          <template v-else-if="preset === 'card'">
            <eb-skeleton-item variant="image" class="eb-skeleton__card-image" />
            <div class="eb-skeleton__card-body">
              <eb-skeleton-item variant="h3" class="is-block" />
              <eb-skeleton-item variant="text" class="is-block" />
              <eb-skeleton-item variant="text" class="eb-skeleton__row--last" />
            </div>
          </template>
          <template v-else-if="preset === 'table'">
            <div class="eb-skeleton__table" :style="{ '--eb-skeleton-table-cols': tableCols }">
              <div v-for="r in tableRows" :key="r" class="eb-skeleton__table-row" :class="{ 'is-head': r === 1 }">
                <eb-skeleton-item v-for="c in tableCols" :key="c" variant="rect" class="eb-skeleton__table-cell" />
              </div>
            </div>
          </template>
          <template v-else-if="preset === 'profile'">
            <div class="eb-skeleton__profile">
              <eb-skeleton-item variant="circle" class="eb-skeleton__profile-avatar" />
              <div class="eb-skeleton__profile-lines">
                <eb-skeleton-item variant="h3" class="is-block" />
                <eb-skeleton-item variant="caption" class="is-block" />
                <eb-skeleton-item variant="text" class="eb-skeleton__row--last" />
              </div>
            </div>
          </template>
          <template v-else>
            <eb-skeleton-item
              v-for="row in rows"
              :key="row"
              variant="p"
              :class="{ 'eb-skeleton__row--last': row === rows && rows > 1 }"
            />
          </template>
        </slot>
      </div>
    </template>
    <template v-else>
      <slot />
    </template>
  </div>
</template>

<script setup>
/**
 * EbSkeleton — 骨架屏
 * loading=true 渲染 rows 行占位（末行短宽），否则渲染默认插槽
 */
import { computed, ref, watch } from 'vue'
import EbSkeletonItem from './item.vue'

const props = defineProps({
  animated: { type: Boolean, default: false },
  count: { type: Number, default: 1 },
  loading: { type: Boolean, default: true },
  rows: { type: Number, default: 3 },
  /**
   * 常用版式预设，免去手工拼装骨架 item：
   * text（默认 rows 行文本）/ article（标题+段落）/ avatar-text（头像+两行）
   * card（封面图+标题行）/ table（表头+数据行格子）/ profile（大头像+署名）
   */
  preset: {
    type: String,
    default: 'text',
    validator: (v) => ['text', 'article', 'avatar-text', 'card', 'table', 'profile'].includes(v),
  },
  /** preset=table 时的行数（含表头） */
  tableRows: { type: Number, default: 4 },
  /** preset=table 时的列数 */
  tableCols: { type: Number, default: 4 },
  /** 渲染延迟（ms），防止闪烁 */
  throttle: { type: Number, default: 0 },
})

const throttledLoading = ref(props.loading)
let timer = null

watch(
  () => props.loading,
  (val) => {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    if (!val || props.throttle <= 0) {
      throttledLoading.value = val
    } else {
      timer = setTimeout(() => {
        throttledLoading.value = val
      }, props.throttle)
    }
  },
  { immediate: true }
)

const countList = computed(() =>
  Array.from({ length: props.count > 0 ? props.count : 1 })
)

const loading = computed(() => throttledLoading.value)
</script>

<style src="./style.css"></style>
