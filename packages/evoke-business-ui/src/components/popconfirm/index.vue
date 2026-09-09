<template>
  <ev-popper
    ref="popperRef"
    :placement="placement"
    trigger="click"
    :show-arrow="true"
    popper-class="ev-popconfirm ev-popconfirm"
    :offset="12"
  >
    <template #trigger>
      <slot />
    </template>
    <div class="ev-popconfirm__main">
      <ev-icon :name="iconName" class="ev-popconfirm__icon" :class="`is-${iconType}`" />
      <span class="ev-popconfirm__title">{{ title }}</span>
    </div>
    <div class="ev-popconfirm__action">
      <ev-button size="small" text @click="handleCancel">
        {{ cancelButtonText }}
      </ev-button>
      <ev-button size="small" :type="confirmButtonType" @click="handleConfirm">
        {{ confirmButtonText }}
      </ev-button>
    </div>
  </ev-popper>
</template>

<script setup>
/**
 * EvPopconfirm — 气泡确认框
 */
import { computed, ref } from 'vue'
import EvPopper from '../popper/index.vue'
import EvButton from '../button/index.vue'
import EvIcon from '../icon/index.vue'
import { useLocale } from '../../composables/useLocale'

defineOptions({ name: 'EvPopconfirm' })

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
