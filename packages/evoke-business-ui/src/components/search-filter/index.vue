<template>
  <div
    class="ev-search-filter"
    :class="[`ev-search-filter--cols-${columns}`]"
    @keydown.enter="handleSearch"
  >
    <div class="ev-search-filter__fields">
      <div v-for="field in fields" :key="field.prop" class="ev-search-filter__field">
        <label v-if="field.label" class="ev-search-filter__label">{{ field.label }}</label>
        <div class="ev-search-filter__control">
          <ev-select
            v-if="field.type === 'select'"
            :model-value="modelValue[field.prop]"
            :placeholder="field.placeholder || '请选择'"
            :clearable="field.clearable !== false"
            :disabled="field.disabled"
            size="default"
            @update:model-value="setField(field.prop, $event)"
          >
            <ev-option
              v-for="opt in field.options || []"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </ev-select>
          <ev-input
            v-else
            :model-value="modelValue[field.prop]"
            :placeholder="field.placeholder || '请输入'"
            :clearable="field.clearable !== false"
            :disabled="field.disabled"
            @update:model-value="setField(field.prop, $event)"
          />
        </div>
      </div>
    </div>
    <div class="ev-search-filter__actions">
      <ev-button type="primary" :loading="loading" @click="handleSearch">
        <ev-icon v-if="!loading" name="search" :size="14" />
        查询
      </ev-button>
      <ev-button @click="handleReset">
        <ev-icon name="refresh-right" :size="14" />
        重置
      </ev-button>
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup>
/**
 * EvSearchFilter — 查询/重置筛选表单（业务封装，fields 配置式）
 * fields = [{ prop, label, type: 'input'|'select', options?, placeholder?, defaultValue?, disabled? }]；
 * v-model 为筛选值对象；查询 emit('search', values)，重置恢复 defaultValue 并 emit('search', reset 值)
 */
import { computed } from 'vue'
import EvButton from '../button/index.vue'
import EvIcon from '../icon/index.vue'
import EvInput from '../input/index.vue'
import EvSelect from '../select/index.vue'
import EvOption from '../select/option.vue'

const props = defineProps({
  modelValue: { type: Object, default: () => ({}) },
  fields: { type: Array, default: () => [] },
  /** 每行字段数（栅格布局 2~4） */
  columns: {
    type: Number,
    default: 3,
    validator: (v) => [2, 3, 4].includes(v),
  },
  loading: { type: Boolean, default: false },
  /** 重置后是否自动触发查询 */
  searchOnReset: { type: Boolean, default: true },
})

const emit = defineEmits(['update:modelValue', 'search', 'reset'])

const values = computed(() => props.modelValue || {})

function setField(prop, value) {
  emit('update:modelValue', { ...values.value, [prop]: value })
}

function handleSearch() {
  if (props.loading) return
  emit('search', { ...values.value })
}

function handleReset() {
  const next = {}
  for (const field of props.fields) {
    next[field.prop] = field.defaultValue ?? ''
  }
  emit('update:modelValue', next)
  emit('reset', next)
  if (props.searchOnReset) emit('search', next)
}

/** expose：取当前值 / 重置 */
function getValues() {
  return { ...values.value }
}
defineExpose({ getValues, reset: handleReset, search: handleSearch })
</script>

<style src="./style.css"></style>
