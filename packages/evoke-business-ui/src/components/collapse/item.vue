<template>
  <div class="ev-collapse-item ev-collapse-item" :class="{ 'is-active': isActive, 'is-disabled': disabled }">
    <button
      type="button"
      class="ev-collapse-item__header"
      :class="{ 'is-active': isActive, 'is-disabled': disabled }"
      :aria-expanded="isActive"
      :aria-controls="contentId"
      :disabled="disabled || undefined"
      @click="handleClick"
    >
      <slot name="title">{{ title }}</slot>
      <span class="ev-collapse-item__arrow" aria-hidden="true">
        <ev-icon name="arrow-right" :size="14" />
      </span>
    </button>
    <transition name="ev-collapse-item" @enter="onEnter" @after-enter="onAfterEnter" @leave="onLeave">
      <div v-show="isActive" :id="contentId" class="ev-collapse-item__wrap" role="region">
        <div class="ev-collapse-item__content">
          <slot />
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
/**
 * EvCollapseItem — 折叠面板项
 * name 缺省时用索引（挂载顺序）；展开收起为高度过渡
 */
import { inject, computed, getCurrentInstance } from 'vue'
import EvIcon from '../icon/index.vue'

const props = defineProps({
  title: { type: String, default: '' },
  name: { type: [String, Number], default: undefined },
  disabled: { type: Boolean, default: false },
})

const ctx = inject('collapseContext', null)
const instance = getCurrentInstance()

// name 缺省时回退组件 uid
const itemKey = computed(() => props.name ?? instance.uid)
const isActive = computed(() => ctx?.activeNames?.value?.includes(itemKey.value) ?? false)

const contentId = `ev-collapse-item-${Math.random().toString(36).slice(2, 8)}`

function handleClick() {
  if (props.disabled) return
  ctx?.toggle?.(itemKey.value)
}

// 高度过渡（v-show + JS hook 量测）
function onEnter(el) {
  el.style.height = '0'
  requestAnimationFrame(() => {
    el.style.height = `${el.scrollHeight}px`
  })
}
function onAfterEnter(el) {
  el.style.height = ''
}
function onLeave(el) {
  el.style.height = `${el.scrollHeight}px`
  requestAnimationFrame(() => {
    el.style.height = '0'
  })
}
</script>

<style src="./style.css"></style>
