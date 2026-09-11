<template>
  <eb-popper
    ref="popperRef"
    :placement="placement"
    trigger="click"
    :show-arrow="true"
    popper-class="eb-popconfirm eb-popconfirm"
    :offset="12"
  >
    <template #trigger>
      <slot />
    </template>
    <div class="eb-popconfirm__main">
      <eb-icon :name="iconName" class="eb-popconfirm__icon" :class="`is-${iconType}`" />
      <span class="eb-popconfirm__title">{{ title }}</span>
    </div>
    <div class="eb-popconfirm__action">
      <eb-button size="small" text @click="handleCancel">
        {{ cancelButtonText }}
      </eb-button>
      <eb-button size="small" :type="confirmButtonType" @click="handleConfirm">
        {{ confirmButtonText }}
      </eb-button>
    </div>
  </eb-popper>
</template>

<script setup>
/**
 * EbPopconfirm — 气泡确认框
 */
import { computed, ref } from 'vue'
import EbPopper from '../popper/index.vue'
import EbButton from '../button/index.vue'
import EbIcon from '../icon/index.vue'
import { useLocale } from '../../composables/useLocale'

defineOptions({ name: 'EbPopconfirm' })

const props = defineProps({
  title: { type: String, default: '' },
  confirmButtonText: { type: String, default: undefined },
  cancelButtonText: { type: String, default: undefined },
  confirmButtonType: { type: String, default: 'primary' },
  icon: { type: String, default: 'warning' },
  iconType: {
    type: String,
    default: 'warning',
    validator: (v) => ['primary', 'success', 'warning', 'info', 'danger'].includes(v),
  },
  placement: { type: String, default: 'top' },
})

const emit = defineEmits(['confirm', 'cancel'])

const { t } = useLocale()
const popperRef = ref(null)

const iconName = computed(() => props.icon || 'warning')
const confirmButtonText = computed(() => props.confirmButtonText ?? t('popconfirm.confirmButtonText'))
const cancelButtonText = computed(() => props.cancelButtonText ?? t('popconfirm.cancelButtonText'))

function handleConfirm() {
  emit('confirm')
  close()
}

function handleCancel() {
  emit('cancel')
  close()
}

function close() {
  popperRef.value?.close?.()
}

defineExpose({ close })
</script>

<style src="./style.css"></style>
