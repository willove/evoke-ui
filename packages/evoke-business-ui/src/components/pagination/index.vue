<template>
  <div
    class="eb-pagination eb-pagination"
    :class="[`eb-pagination--${computedSize}`, { 'is-background': background, 'is-disabled': disabled }]"
    role="pagination"
    :aria-label="t('pagination.ariaLabel', total)"
  >
    <template v-for="(part, i) in layoutParts" :key="i">
      <span v-if="part === 'total'" class="eb-pagination__total">
        {{ t('pagination.total', total) }}
      </span>
      <span v-else-if="part === 'sizes'" class="eb-pagination__sizes">
        <eb-select
          :model-value="computedPageSize"
          :size="selectSize"
          :disabled="disabled"
          style="width: 110px"
          @update:model-value="handleSizeChange"
        >
          <eb-option
            v-for="s in pageSizes"
            :key="s"
            :value="s"
            :label="`${s}${t('pagination.pagesize')}`"
          />
        </eb-select>
      </span>
      <button
        v-else-if="part === 'prev'"
        type="button"
        class="btn-prev"
        :class="{ 'is-disabled': prevDisabled }"
        :disabled="prevDisabled"
        :aria-label="t('pagination.prevPage')"
        @click="go(currentPage - 1)"
      >
        <eb-icon name="arrow-left" />
      </button>
      <ul v-else-if="part === 'pager'" class="eb-pager">
        <li
          v-for="page in pagerList"
          :key="`${page.type}-${page.value}`"
          class="number"
          :class="{
            'is-active': page.type === 'page' && page.value === currentPage,
            'btn-quickprev': page.type === 'prev-more',
            'btn-quicknext': page.type === 'next-more',
          }"
          :aria-current="page.type === 'page' && page.value === currentPage ? 'page' : undefined"
          @click="handlePagerClick(page)"
        >
          <template v-if="page.type === 'page'">{{ page.value }}</template>
          <eb-icon v-else-if="page.type === 'prev-more'" name="more-filled" />
          <eb-icon v-else name="more-filled" />
        </li>
      </ul>
      <button
        v-else-if="part === 'next'"
        type="button"
        class="btn-next"
        :class="{ 'is-disabled': nextDisabled }"
        :disabled="nextDisabled"
        :aria-label="t('pagination.nextPage')"
        @click="go(currentPage + 1)"
      >
        <eb-icon name="arrow-right" />
      </button>
      <span v-else-if="part === 'jumper'" class="eb-pagination__jump">
        {{ t('pagination.goto') }}
        <input
          class="eb-pagination__editor"
          type="number"
          :value="jumpValue"
          :disabled="disabled"
          @change="handleJump"
          @input="jumpValue = $event.target.value"
        />
        {{ t('pagination.pageClassifier') }}
      </span>
    </template>
  </div>
</template>

<script setup>
/**
 * EbPagination — 分页
 * layout 字符串解析：total, sizes, prev, pager, next, jumper
 * 兼容 v-model 对象 { page, size } / 数字 / v-model:current-page / v-model:page-size
 */
import { computed, ref, toRef, watch } from 'vue'
import EbIcon from '../icon/index.vue'
import EbSelect from '../select/index.vue'
import EbOption from '../select/option.vue'
import { useLocale } from '../../composables/useLocale'
import { useFormItem } from '../../composables/useFormItem'

defineOptions({ name: 'EbPagination' })

const props = defineProps({
  /** v-model 兼容：{ page, size } 对象或页码数字 */
  modelValue: { type: [Object, Number], default: null },
  /** v-model:current-page / current 别名 */
  currentPage: { type: Number, default: undefined },
  current: { type: Number, default: undefined },
  pageSize: { type: Number, default: undefined },
  total: { type: Number, default: 0 },
  layout: { type: String, default: 'total, sizes, prev, pager, next, jumper' },
  pageSizes: { type: Array, default: () => [10, 20, 50, 100] },
  size: {
    type: String,
    default: 'default',
    validator: (v) => ['large', 'default', 'small'].includes(v),
  },
  /** 紧凑模式（等价 size='small'） */
  small: { type: Boolean, default: false },
  background: { type: Boolean, default: true },
  disabled: { type: Boolean, default: false },
  /** 页码按钮数（含首末，奇数） */
  pagerCount: { type: Number, default: 7 },
  hideOnSinglePage: { type: Boolean, default: false },
})

const emit = defineEmits([
  'update:modelValue',
  'update:current',
  'update:currentPage',
  'update:pageSize',
  'size-change',
  'current-change',
  'change',
  'prev-click',
  'next-click',
])

const { t } = useLocale()
const { size: formSize } = useFormItem({ size: toRef(props, 'size') })

const computedSize = computed(() => (props.small ? 'small' : props.size || formSize.value || 'default'))

// 页容量选择器与翻页按钮同尺寸，避免一高一矮
const selectSize = computed(() => (computedSize.value === 'large' ? 'large' : computedSize.value === 'small' ? 'small' : 'default'))

const layoutParts = computed(() =>
  props.layout.split(',').map((s) => s.trim()).filter(Boolean)
)

// ─── 页码/页大小读取） ───
const computedCurrentPage = computed(() => {
  if (typeof props.currentPage === 'number') return props.currentPage
  if (typeof props.current === 'number') return props.current
  if (props.modelValue != null) {
    if (typeof props.modelValue === 'number') return props.modelValue
    return props.modelValue.page || 1
  }
  return 1
})

const computedPageSize = computed(() => {
  if (typeof props.pageSize === 'number') return props.pageSize
  if (props.modelValue != null && typeof props.modelValue === 'object') {
    return props.modelValue.size || 20
  }
  return 20
})

const pageCount = computed(() =>
  Math.max(1, Math.ceil((props.total || 0) / computedPageSize.value))
)

const currentPage = computed(() => Math.min(computedCurrentPage.value, pageCount.value))

const prevDisabled = computed(() => props.disabled || currentPage.value <= 1)
const nextDisabled = computed(() => props.disabled || currentPage.value >= pageCount.value)

// ─── pager 省略逻辑（连续页码区 + 首末页 + 省略号折叠） ───
const pagerList = computed(() => {
  const count = pageCount.value
  const current = currentPage.value
  const pagerCount = Math.max(
    5,
    props.pagerCount % 2 === 0 ? props.pagerCount + 1 : props.pagerCount
  )
  const half = Math.floor(pagerCount / 2)
  const list = []

  // 页数少：全部显示
  if (count <= pagerCount) {
    for (let i = 1; i <= count; i++) list.push({ type: 'page', value: i })
    return list
  }

  // 连续区起止
  let start = current - half + 1
  let end = current + half - 1
  if (start <= 2) {
    // 靠前：1 .. pagerCount-1 … count
    start = 1
    end = pagerCount - 1
  } else if (end >= count - 1) {
    // 靠后：1 … count-pagerCount+2 .. count
    start = count - pagerCount + 2
    end = count
  }

  if (start > 2) {
    list.push({ type: 'page', value: 1 })
    list.push({ type: 'prev-more', value: Math.max(1, start - half) })
  }
  for (let i = start; i <= end; i++) list.push({ type: 'page', value: i })
  if (end < count) {
    list.push({ type: 'next-more', value: Math.min(count, end + half) })
    list.push({ type: 'page', value: count })
  }
  return list
})

// ─── 同步事件） ───
function emitCurrent(page, type) {
  page = Math.max(1, Math.min(page, pageCount.value))
  if (page === currentPage.value && type !== 'init') return
  emit('update:currentPage', page)
  emit('update:current', page)
  if (props.modelValue != null) {
    emit(
      'update:modelValue',
      typeof props.modelValue === 'number' ? page : { page, size: computedPageSize.value }
    )
  }
  emit('current-change', page)
  emit('change', { current: page, pageSize: computedPageSize.value })
  if (type === 'prev') emit('prev-click', page)
  if (type === 'next') emit('next-click', page)
}

function emitSize(size) {
  emit('update:pageSize', size)
  if (props.modelValue != null && typeof props.modelValue === 'object') {
    emit('update:modelValue', { page: currentPage.value, size })
  }
  emit('size-change', size)
  emit('change', { current: currentPage.value, pageSize: size })
}

function go(page) {
  if (props.disabled) return
  emitCurrent(page)
}

function handlePagerClick(page) {
  if (props.disabled) return
  if (page.type === 'page') {
    go(page.value)
  } else if (page.type === 'prev-more') {
    go(page.value)
  } else {
    go(page.value)
  }
}

function handleSizeChange(size) {
  emitSize(size)
  // 页大小变化后修正页码越界
  const maxPage = Math.max(1, Math.ceil((props.total || 0) / size))
  if (currentPage.value > maxPage) {
    emitCurrent(maxPage)
  }
}

// ─── jumper ───
const jumpValue = ref(String(currentPage.value))

watch(currentPage, (val) => {
  jumpValue.value = String(val)
})

function handleJump(e) {
  const page = parseInt(e.target.value, 10)
  if (!Number.isNaN(page)) {
    go(page)
  }
  jumpValue.value = String(currentPage.value)
  e.target.value = jumpValue.value
}

defineExpose({
  currentPage,
  pageSize: computedPageSize,
})
</script>

<style src="./style.css"></style>
