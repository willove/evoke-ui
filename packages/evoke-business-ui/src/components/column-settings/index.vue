<template>
  <eb-popover ref="popoverRef" trigger="click" placement="bottom-end" :width="240">
    <eb-button
      class="eb-column-settings__trigger"
      size="small"
      icon="setting"
      aria-label="列设置"
    >
      <span v-if="buttonText" class="eb-column-settings__trigger-text">{{ buttonText }}</span>
    </eb-button>

    <template #content>
      <div class="eb-column-settings__panel">
      <div class="eb-column-settings__head">
        <span class="eb-column-settings__head-title">列设置</span>
        <button type="button" class="eb-column-settings__reset" @click="handleReset">重置</button>
      </div>
      <ul class="eb-column-settings__list" @dragover.prevent>
        <li
          v-for="(col, i) in ordered"
          :key="col.prop"
          class="eb-column-settings__item"
          :class="{ 'is-dragging': dragIndex === i, 'is-drag-over': dragOverIndex === i && dragIndex !== i }"
          draggable="true"
          @dragstart="dragIndex = i"
          @dragenter.prevent="dragOverIndex = i"
          @dragend="handleDrop"
          @drop.prevent="handleDrop"
        >
          <span class="eb-column-settings__drag-handle" aria-hidden="true">⠿</span>
          <eb-checkbox
            :model-value="isColumnVisible(col.prop)"
            :disabled="visibleCount <= 1 && isColumnVisible(col.prop)"
            @change="toggleColumn(col.prop)"
          />
          <span class="eb-column-settings__item-label">{{ col.label }}</span>
        </li>
      </ul>
      </div>
    </template>
  </eb-popover>
</template>

<script setup>
/**
 * EbColumnSettings — 表格列设置（业务封装）
 * 列显隐 + 拖拽排序（HTML5 DnD）；storageKey 提供时经 storageGet/storageSet 持久化
 * （value = 按显示顺序排列的可见列 prop 数组）；至少保留一列可见
 */
import { ref, computed, watch, onMounted } from 'vue'
import EbButton from '../button/index.vue'
import EbCheckbox from '../checkbox/index.vue'
import EbPopover from '../popover/index.vue'
import { storageGet, storageSet } from '../../utils/dom'

const props = defineProps({
  /** 全量列（定义顺序） */
  columns: { type: Array, default: () => [] },
  /** 受控值：按显示顺序的可见列 prop 数组 */
  modelValue: { type: Array, default: undefined },
  /** localStorage 持久化 key（经 utils/dom 安全封装） */
  storageKey: { type: String, default: '' },
  buttonText: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue', 'change'])

const popoverRef = ref(null)
const dragIndex = ref(-1)
const dragOverIndex = ref(-1)

const innerValue = ref(null)

const value = computed(() => {
  if (props.modelValue) return props.modelValue
  if (innerValue.value) return innerValue.value
  return props.columns.map((c) => c.prop)
})

const ordered = computed(() => {
  // 按受控顺序输出；未出现在 value 里的列（隐藏）排在其定义顺序尾部
  const known = props.columns.filter((c) => value.value.includes(c.prop))
  const sorted = value.value
    .map((p) => known.find((c) => c.prop === p))
    .filter(Boolean)
  const rest = props.columns.filter((c) => !value.value.includes(c.prop))
  return [...sorted, ...rest]
})

const visibleCount = computed(() => value.value.length)

function isColumnVisible(prop) {
  return value.value.includes(prop)
}

function emitValue(next) {
  if (props.modelValue !== undefined) emit('update:modelValue', next)
  else innerValue.value = next
  if (props.storageKey) storageSet(props.storageKey, JSON.stringify(next))
  emit('change', next)
}

function toggleColumn(prop) {
  if (isColumnVisible(prop)) {
    if (visibleCount.value <= 1) return // 至少保留一列
    emitValue(value.value.filter((p) => p !== prop))
  } else {
    // 恢复到其定义位置
    const defIndex = props.columns.findIndex((c) => c.prop === prop)
    const next = [...value.value]
    let insertAt = next.length
    for (let i = 0; i < next.length; i++) {
      const idx = props.columns.findIndex((c) => c.prop === next[i])
      if (idx > defIndex) {
        insertAt = i
        break
      }
    }
    next.splice(insertAt, 0, prop)
    emitValue(next)
  }
}

// ─── 拖拽排序 ───
function handleDrop() {
  if (dragIndex.value === -1 || dragOverIndex.value === -1 || dragIndex.value === dragOverIndex.value) {
    dragIndex.value = -1
    dragOverIndex.value = -1
    return
  }
  const next = ordered.value.map((c) => c.prop)
  const [moved] = next.splice(dragIndex.value, 1)
  next.splice(dragOverIndex.value, 0, moved)
  dragIndex.value = -1
  dragOverIndex.value = -1
  emitValue(next)
}

function handleReset() {
  const next = props.columns.map((c) => c.prop)
  emitValue(next)
}

// ─── 持久化恢复（storageKey 提供且未受控时） ───
onMounted(() => {
  if (props.storageKey && props.modelValue === undefined && !innerValue.value) {
    let saved = null
    try {
      const raw = storageGet(props.storageKey)
      saved = raw ? JSON.parse(raw) : null
    } catch {
      saved = null
    }
    if (Array.isArray(saved) && saved.length) {
      // 只保留仍存在的列，缺失的新列按定义顺序补尾
      const valid = saved.filter((p) => props.columns.some((c) => c.prop === p))
      const missing = props.columns.filter((c) => !valid.includes(c.prop)).map((c) => c.prop)
      innerValue.value = [...valid, ...missing]
    }
  }
})

watch(
  () => props.columns,
  () => {
    // 列定义变化时，剔除已不存在的列
    if (innerValue.value) {
      innerValue.value = innerValue.value.filter((p) => props.columns.some((c) => c.prop === p))
    }
  },
  { deep: true },
)

defineExpose({ reset: handleReset })
</script>

<style src="./style.css"></style>
