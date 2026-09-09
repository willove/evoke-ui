<template>
  <div class="ev-app-toolbar">
    <div class="ev-app-toolbar__left">
      <div v-if="searchable" class="ev-app-toolbar__search">
        <ev-input
          :model-value="modelValue"
          :placeholder="searchPlaceholder"
          prefix-icon="search"
          clearable
          @update:model-value="emit('update:modelValue', $event)"
        />
      </div>
      <slot name="filters" />
    </div>
    <div class="ev-app-toolbar__right">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup>
/**
 * EvAppToolbar — 应用工具条
 * 左侧搜索（v-model 同步）+ filters 插槽；右侧 actions 插槽
 */
import EvInput from '../input/index.vue'

// EvInput 关闭了 attrs 透传，搜索框宽度由包裹层控制

defineProps({
  searchable: { type: Boolean, default: true },
  searchPlaceholder: { type: String, default: '搜索...' },
  modelValue: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue'])
</script>

<style src="./style.css"></style>
