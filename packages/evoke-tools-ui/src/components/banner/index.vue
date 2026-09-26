<template>
  <div class="et-banner" :class="typeClass" :role="alertRole">
    <et-icon class="et-banner__icon" :name="iconName" :size="ICON_SIZE" />
    <div class="et-banner__body">
      <div v-if="title" class="et-banner__title">{{ title }}</div>
      <div class="et-banner__text">
        <slot />
      </div>
    </div>
    <div v-if="$slots.action" class="et-banner__action">
      <slot name="action" />
    </div>
    <button
      v-if="closable"
      type="button"
      class="et-banner__close"
      aria-label="关闭"
      @click="emit('close')"
    >
      <et-icon name="close" :size="ICON_SIZE" />
    </button>
  </div>
</template>

<script setup>
/**
 * EtBanner — 内联横条通知（tools-ui 计划 05 §四 L4 / 07 M3 交付物 5）
 *
 * 内联件（不 Teleport）：跟内容同流，随消费方的容器排版。类型差异落在浅底
 * + 图标色上（一屏彩色 ≤3 的纪律：info / warn / error 三档语义色，文字仍走
 * 中性阶）。warn / error 用 role=alert（打断式播报），info 用 role=status
 * （礼貌播报）；closable 的关闭钮带 aria-label（G4）。
 *
 * 契约要点：
 *   ① type 三档 info / warn / error（无 success：横条用于提示与告警）；
 *   ② closable 默认 true；关闭只 emit close，去留由消费方（v-if）决定；
 *   ③ title 空 = 只有正文（不带标题行的紧凑形态）。
 */
import { computed } from 'vue'
import EtIcon from '../../icons/icon.vue'

defineOptions({ name: 'EtBanner' })

const props = defineProps({
  /** info | warn | error */
  type: { type: String, default: 'info' },
  closable: { type: Boolean, default: true },
  title: { type: String, default: '' },
})

const emit = defineEmits(['close'])

/** 类型图标：库内 semantic 名（G2 注册表） */
const TYPE_ICONS = { info: 'info', warn: 'warning', error: 'error' }
const ICON_SIZE = 'var(--et-icon-sm)'

const typeClass = computed(() =>
  ['info', 'warn', 'error'].includes(props.type) ? `et-banner--${props.type}` : 'et-banner--info',
)
const iconName = computed(() => TYPE_ICONS[props.type] ?? 'info')
/** warn / error 打断式播报；info 礼貌播报 */
const alertRole = computed(() => (props.type === 'info' ? 'status' : 'alert'))
</script>

<style src="./style.css"></style>
