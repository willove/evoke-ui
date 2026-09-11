<template>
  <div class="eb-transfer eb-transfer">
    <!-- 左面板：待选 -->
    <div class="eb-transfer-panel eb-transfer-panel">
      <div class="eb-transfer-panel__header">
        <eb-checkbox
          :model-value="isAllLeftChecked"
          :indeterminate="isLeftIndeterminate"
          @change="toggleAllLeft"
        />
        <span class="eb-transfer-panel__header-title">{{ leftTitle }}</span>
        <span class="eb-transfer-panel__header-num">{{ leftList.length }}</span>
      </div>
      <div class="eb-transfer-panel__body">
        <div v-if="filterable" class="eb-transfer-panel__filter">
          <eb-input
            v-model="leftQuery"
            :placeholder="filterPlaceholder"
            prefix-icon="search"
            clearable
            size="small"
          />
        </div>
        <div class="eb-transfer-panel__list">
          <label
            v-for="item in filteredLeft"
            :key="item.key"
            class="eb-transfer-panel__item"
            :class="{ 'is-disabled': item.disabled }"
          >
            <eb-checkbox
              :model-value="leftChecked.includes(item.key)"
              :disabled="item.disabled"
              @change="toggleLeftItem(item.key)"
            />
            <span class="eb-transfer-panel__item-label">{{ item.label }}</span>
          </label>
          <div v-if="filteredLeft.length === 0" class="eb-transfer-panel__empty">
            {{ leftQuery ? '无匹配数据' : '暂无数据' }}
          </div>
        </div>
      </div>
    </div>

    <!-- 中间按钮 -->
    <div class="eb-transfer__buttons">
      <button
        type="button"
        class="eb-button eb-button--primary eb-transfer__btn"
        :class="{ 'is-disabled': !leftChecked.length }"
        :disabled="!leftChecked.length || undefined"
        aria-label="向右移动"
        @click="moveTo('right')"
      >
        <eb-icon name="arrow-right" :size="14" />
      </button>
      <button
        type="button"
        class="eb-button eb-button--primary eb-transfer__btn"
        :class="{ 'is-disabled': !rightChecked.length }"
        :disabled="!rightChecked.length || undefined"
        aria-label="向左移动"
        @click="moveTo('left')"
      >
        <eb-icon name="arrow-left" :size="14" />
      </button>
    </div>

    <!-- 右面板：已选 -->
    <div class="eb-transfer-panel eb-transfer-panel">
      <div class="eb-transfer-panel__header">
        <eb-checkbox
          :model-value="isAllRightChecked"
          :indeterminate="isRightIndeterminate"
          @change="toggleAllRight"
        />
        <span class="eb-transfer-panel__header-title">{{ rightTitle }}</span>
        <span class="eb-transfer-panel__header-num">{{ rightList.length }}</span>
      </div>
      <div class="eb-transfer-panel__body">
        <div v-if="filterable" class="eb-transfer-panel__filter">
          <eb-input
            v-model="rightQuery"
            :placeholder="filterPlaceholder"
            prefix-icon="search"
            clearable
            size="small"
          />
        </div>
        <div class="eb-transfer-panel__list">
          <label
            v-for="item in filteredRight"
            :key="item.key"
            class="eb-transfer-panel__item"
            :class="{ 'is-disabled': item.disabled }"
          >
            <eb-checkbox
              :model-value="rightChecked.includes(item.key)"
              :disabled="item.disabled"
              @change="toggleRightItem(item.key)"
            />
            <span class="eb-transfer-panel__item-label">{{ item.label }}</span>
          </label>
          <div v-if="filteredRight.length === 0" class="eb-transfer-panel__empty">
            {{ rightQuery ? '无匹配数据' : '暂无数据' }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * EbTransfer — 穿梭框
 * 左右面板 + 中间移动按钮；checked 为面板内临时勾选（区别于 modelValue 已选项）；
 * filterable 双侧独立过滤；disabled 项不可勾选不参与移动
 */
import { ref, computed, watch } from 'vue'
import EbCheckbox from '../checkbox/index.vue'
import EbInput from '../input/index.vue'
import EbIcon from '../icon/index.vue'

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  data: { type: Array, default: () => [] },
  titles: { type: Array, default: () => ['列表 1', '列表 2'] },
  filterable: { type: Boolean, default: false },
  filterPlaceholder: { type: String, default: '请输入搜索内容' },
})

const emit = defineEmits(['update:modelValue', 'change'])

const leftChecked = ref([])
const rightChecked = ref([])
const leftQuery = ref('')
const rightQuery = ref('')

const leftTitle = computed(() => props.titles[0] ?? '列表 1')
const rightTitle = computed(() => props.titles[1] ?? '列表 2')

// 按 data 原序拆分左右两侧
const leftList = computed(() => props.data.filter((d) => !props.modelValue.includes(d.key)))
const rightList = computed(() => props.data.filter((d) => props.modelValue.includes(d.key)))

const filteredLeft = computed(() => filterList(leftList.value, leftQuery.value))
const filteredRight = computed(() => filterList(rightList.value, rightQuery.value))

function filterList(list, query) {
  const q = query.trim().toLowerCase()
  if (!q) return list
  return list.filter((d) => String(d.label).toLowerCase().includes(q))
}

// ─── 全选（仅可选中的项）───
const checkableLeft = computed(() => filteredLeft.value.filter((d) => !d.disabled))
const checkableRight = computed(() => filteredRight.value.filter((d) => !d.disabled))

const isAllLeftChecked = computed(() =>
  checkableLeft.value.length > 0 && checkableLeft.value.every((d) => leftChecked.value.includes(d.key)),
)
const isLeftIndeterminate = computed(() =>
  !isAllLeftChecked.value && checkableLeft.value.some((d) => leftChecked.value.includes(d.key)),
)
const isAllRightChecked = computed(() =>
  checkableRight.value.length > 0 && checkableRight.value.every((d) => rightChecked.value.includes(d.key)),
)
const isRightIndeterminate = computed(() =>
  !isAllRightChecked.value && checkableRight.value.some((d) => rightChecked.value.includes(d.key)),
)

function toggleLeftItem(key) {
  toggleItem(leftChecked, key)
}
function toggleRightItem(key) {
  toggleItem(rightChecked, key)
}

function toggleItem(listRef, key) {
  const i = listRef.value.indexOf(key)
  if (i === -1) listRef.value = [...listRef.value, key]
  else listRef.value = listRef.value.filter((k) => k !== key)
}

function toggleAllLeft(checked) {
  leftChecked.value = checked ? checkableLeft.value.map((d) => d.key) : []
}
function toggleAllRight(checked) {
  rightChecked.value = checked ? checkableRight.value.map((d) => d.key) : []
}

// ─── 移动 ───
function moveTo(direction) {
  if (direction === 'right') {
    if (!leftChecked.value.length) return
    const moved = leftChecked.value.filter((k) => !props.data.find((d) => d.key === k)?.disabled)
    if (!moved.length) return
    emit('update:modelValue', [...props.modelValue, ...moved])
    emit('change', [...props.modelValue, ...moved], 'right', moved)
    leftChecked.value = leftChecked.value.filter((k) => !moved.includes(k))
  } else {
    if (!rightChecked.value.length) return
    const moved = rightChecked.value.filter((k) => !props.data.find((d) => d.key === k)?.disabled)
    if (!moved.length) return
    const next = props.modelValue.filter((k) => !moved.includes(k))
    emit('update:modelValue', next)
    emit('change', next, 'left', moved)
    rightChecked.value = rightChecked.value.filter((k) => !moved.includes(k))
  }
}

// modelValue 外部变化时清理已不存在于对应面板的勾选
watch(
  () => props.modelValue,
  () => pruneChecks(),
)

// 移动后清理已不存在的勾选
function pruneChecks() {
  leftChecked.value = leftChecked.value.filter((k) => leftList.value.some((d) => d.key === k))
  rightChecked.value = rightChecked.value.filter((k) => rightList.value.some((d) => d.key === k))
}

defineExpose({
  clearQuery: () => {
    leftQuery.value = ''
    rightQuery.value = ''
  },
  /** 供父级在 modelValue 外部变化后清理勾选 */
  pruneChecks,
})
</script>

<style src="./style.css"></style>
