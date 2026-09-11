<template>
  <div class="eb-app-toolbar">
    <div class="eb-app-toolbar__left">
      <div v-if="searchable" class="eb-app-toolbar__search">
        <eb-input
          :model-value="modelValue"
          :placeholder="searchPlaceholder"
          prefix-icon="search"
          clearable
          @update:model-value="emit('update:modelValue', $event)"
        />
      </div>
      <slot name="filters" />
    </div>
    <div class="eb-app-toolbar__right">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup>
/**
 * EbAppToolbar — 应用工具条
 * 左侧搜索（v-model 同步）+ filters 插槽；右侧 actions 插槽
 */
import EbInput from '../input/index.vue'

// EbInput 关闭了 attrs 透传，搜索框宽度由包裹层控制

defineProps({
  searchable: { type: Boolean, default: true },
  searchPlaceholder: { type: String, default: '搜索...' },
  modelValue: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue'])
</script>

<style src="./style.css"></style>
