<template>
  <div class="eb-result" role="status">
    <div v-if="hasIcon" class="eb-result__icon" :class="`eb-result__icon--${status}`">
      <slot name="icon">
        <eb-icon :name="iconName" :size="iconSize" />
      </slot>
    </div>

    <div v-if="hasTitle" class="eb-result__title">
      <slot name="title">{{ titleText }}</slot>
    </div>

    <div v-if="hasSubTitle" class="eb-result__subtitle">
      <slot name="subTitle">{{ subTitleText }}</slot>
    </div>

    <div v-if="$slots.extra" class="eb-result__extra">
      <slot name="extra" />
    </div>

    <div v-if="$slots.default" class="eb-result__body">
      <slot />
    </div>
  </div>
</template>

<script setup>
/**
 * EbResult — 结果页
 * status: success/error/info/warning/404/403/500 → 默认图标/标题/副标题；插槽 icon/title/subTitle/extra/default
 */
import { computed, useSlots } from 'vue'
import EbIcon from '../icon/index.vue'

const props = defineProps({
  status: {
    type: String,
    default: 'info',
    validator: (v) => ['success', 'error', 'info', 'warning', '404', '403', '500'].includes(v),
  },
  title: { type: String, default: undefined },
  subTitle: { type: String, default: undefined },
  icon: { type: String, default: undefined },
  iconSize: { type: Number, default: 72 },
})

const slots = useSlots()

const iconMap = {
  success: 'success-filled',
  error: 'circle-close-filled',
  warning: 'warning-filled',
  info: 'info-filled',
  404: 'info-filled',
  403: 'info-filled',
  500: 'circle-close-filled',
}
const iconName = computed(() => props.icon || iconMap[props.status] || 'info-filled')

const defaultTitles = {
  success: '操作成功',
  error: '操作失败',
  warning: '警告提示',
  404: '404',
  403: '403',
  500: '500',
}
const titleText = computed(() => (props.title !== undefined ? props.title : defaultTitles[props.status] || ''))

const defaultSubTitles = {
  404: '抱歉，你访问的页面不存在',
  403: '抱歉，你没有权限访问此页面',
  500: '抱歉，服务器出了点问题',
}
const subTitleText = computed(() => (props.subTitle !== undefined ? props.subTitle : defaultSubTitles[props.status] || ''))

const hasIcon = computed(() => !!(props.icon || slots.icon || iconName.value))
const hasTitle = computed(() => !!(titleText.value || slots.title))
const hasSubTitle = computed(() => !!(subTitleText.value || slots.subTitle))
</script>

<style src="./style.css"></style>
