<template>
  <div :class="['ew-search-box', `ew-search-box--${size}`]">
    <!-- 分类下拉（EwSelect bare 嵌入形态） -->
    <div v-if="categories.length" class="ew-search-box__category">
      <EwSelect
        bare
        :model-value="categoryProxy || (normalizedCategories[0] && normalizedCategories[0].value)"
        :options="normalizedCategories"
        :aria-label="`分类筛选（${ariaLabel || placeholder}）`"
        @update:model-value="onCategoryChange"
      />
    </div>

    <EwIcon name="search" :size="iconSize" class="ew-search-box__magnifier" />

    <input
      v-bind="$attrs"
      class="ew-search-box__input"
      type="search"
      :value="modelValue"
      :placeholder="placeholder"
      :aria-label="ariaLabel || placeholder"
      @input="onInput"
    />

    <div v-if="$slots.suffix" class="ew-search-box__suffix">
      <slot name="suffix" />
    </div>
  </div>
</template>

<script setup>
/**
 * EwSearchBox — 大搜索框（签名组件：分类下拉 + 搜索输入 + 后缀动作位）
 * v-model（搜索词） + v-model:category（分类值）；分类下拉为 EwSelect bare 嵌入
 * 圆润 xl 圆角 + 藏青软阴影，穿透 attrs 到原生 input
 */
import { computed } from 'vue'
import EwIcon from '../icon/index.vue'
import EwSelect from '../select/index.vue'

defineOptions({ inheritAttrs: false })

const props = defineProps({
  /** 搜索词（v-model） */
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: 'Search' },
  /** 分类项（字符串或 { label, value }）；空数组隐藏分类位 */
  categories: { type: Array, default: () => [] },
  /** 当前分类（v-model:category） */
  category: { type: String, default: '' },
  size: {
    type: String,
    default: 'default',
    validator: (v) => ['default', 'large'].includes(v),
  },
  /** 无障碍标签（缺省取 placeholder） */
  ariaLabel: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue', 'update:category', 'search'])

const iconSize = computed(() => (props.size === 'large' ? 20 : 18))

const normalizedCategories = computed(() =>
  props.categories.map((c) =>
    typeof c === 'string' ? { label: c, value: c } : { label: c.label, value: c.value ?? c.label }
  )
)

const categoryProxy = computed({
  get: () => props.category,
  set: (v) => emit('update:category', v),
})

function onInput(e) {
  emit('update:modelValue', e.target.value)
  emit('search', e.target.value)
}

function onCategoryChange(v) {
  categoryProxy.value = v
  emit('search', props.modelValue)
}
</script>

<style src="./style.css"></style>
