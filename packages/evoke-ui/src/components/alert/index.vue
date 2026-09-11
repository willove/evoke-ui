<template>
  <div
    :class="[
      'ev-alert',
      `is-${variant}`,
      `is-${tone}`,
      { 'is-pill': pill, 'is-closable': closable },
    ]"
    role="status"
  >
    <span v-if="icon || $slots.icon" class="ev-alert__icon">
      <slot name="icon">
        <EvIcon :name="icon" :size="pill ? 16 : 18" />
      </slot>
    </span>
    <div class="ev-alert__content">
      <strong v-if="title || $slots.title" class="ev-alert__title">
        <slot name="title">{{ title }}</slot>
      </strong>
      <span class="ev-alert__message">
        <slot />
      </span>
    </div>
    <div v-if="$slots.action" class="ev-alert__action">
      <slot name="action" />
    </div>
    <button
      v-if="closable"
      type="button"
      class="ev-alert__close"
      aria-label="关闭"
      @click="visible = false"
    >
      <EvIcon name="close" :size="14" />
    </button>
  </div>
</template>

<script setup>
/**
 * EvAlert — 公告/提示条
 * pill 公告横幅形态（remixicon 顶部 sponsor 横幅：黑色图标块 + 文案 + 动作）；
 * 非 pill 为常规软底提示卡；tone 驱动语义色
 */
import { ref, computed } from 'vue'
import EvIcon from '../icon/index.vue'

const props = defineProps({
  title: { type: String, default: '' },
  /** 图标名；pill 形态缺省 info */
  icon: { type: String, default: '' },
  tone: {
    type: String,
    default: 'primary',
    validator: (v) => ['primary', 'success', 'warning', 'danger', 'neutral'].includes(v),
  },
  /** 横幅胶囊形态 */
  pill: { type: Boolean, default: false },
  closable: { type: Boolean, default: false },
})

const visible = ref(true)

const variant = computed(() => (visible.value ? 'show' : 'hidden'))
</script>

<style src="./style.css"></style>
