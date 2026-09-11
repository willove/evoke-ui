<template>
  <div
    ref="referenceRef"
    class="eb-color-picker eb-color-picker"
    :class="[sizeClass, { 'is-disabled': isDisabled }]"
  >
    <button
      type="button"
      class="eb-color-picker__trigger"
      :aria-label="`颜色选择器${modelValue ? '，当前 ' + modelValue : ''}`"
      :disabled="isDisabled || undefined"
      @click="togglePanel"
    >
      <span
        class="eb-color-picker__color"
        :class="{ 'is-alpha': showAlpha }"
        :style="{ backgroundColor: displayColor }"
      >
        <eb-icon v-if="empty" class="eb-color-picker__icon" name="close" :size="14" />
      </span>
    </button>

    <Teleport to="body">
      <Transition name="eb-color-picker-fade">
        <div
          v-if="panelVisible"
          ref="floatingRef"
          class="eb-color-picker__panel"
          :class="popperClass"
          :style="panelStyle"
          @keydown.esc.stop="closePanel"
        >
          <eb-color-picker-panel
            ref="panelRef"
            v-model="panelColor"
            :show-alpha="showAlpha"
            :color-format="colorFormat"
            :predefine="predefine"
            :disabled="isDisabled"
            @change="handleChange"
            @active-change="emit('active-change', $event)"
          />
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
/**
 * EbColorPicker — 颜色选择器
 * trigger + Teleport 弹层（useFloating/useZIndex/useClickOutside，与 Select 同管线）；
 * 面板内实时编辑、change 即时提交；空值显示遮罩图标
 */
import { ref, computed, watch, onBeforeUnmount, nextTick, toRef } from 'vue'
import EbIcon from '../icon/index.vue'
import EbColorPickerPanel from './panel.vue'
import { useFloating } from '../../composables/useFloating'
import { useZIndex } from '../../composables/useZIndex'
import { useClickOutside } from '../../composables/useClickOutside'
import { useFormItem } from '../../composables/useFormItem'

const props = defineProps({
  modelValue: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  size: { type: String, default: 'default' },
  showAlpha: { type: Boolean, default: false },
  colorFormat: { type: String, default: '' },
  predefine: { type: Array, default: () => [] },
  popperClass: { type: String, default: '' },
  validateEvent: { type: Boolean, default: true },
})

const emit = defineEmits(['update:modelValue', 'change', 'active-change'])

const referenceRef = ref(null)
const floatingRef = ref(null)
const panelRef = ref(null)

const { size: formSize, disabled: formDisabled, formItem } = useFormItem({
  size: toRef(props, 'size'),
  disabled: toRef(props, 'disabled'),
})
const isDisabled = computed(() => formDisabled.value || props.disabled)

const { zIndex, next: nextZIndex } = useZIndex()
const { x, y, update } = useFloating({
  reference: referenceRef,
  floating: floatingRef,
  placement: 'bottom-start',
  offset: 6,
  flip: true,
  shift: true,
  autoUpdate: true,
})

const panelVisible = ref(false)
// 面板内草稿色：打开时从 modelValue 初始化，change 即时向上提交
const panelColor = ref(props.modelValue)

watch(
  () => props.modelValue,
  (val) => {
    if (!panelVisible.value) panelColor.value = val
  },
)

const panelStyle = computed(() => ({
  position: 'fixed',
  left: `${x.value}px`,
  top: `${y.value}px`,
  zIndex: zIndex.value,
}))

const empty = computed(() => !props.modelValue)
const displayColor = computed(() => props.modelValue || 'transparent')

const sizeClass = computed(() => {
  const s = formSize.value
  return s && s !== 'default' ? `eb-color-picker--${s}` : ''
})

function openPanel() {
  if (isDisabled.value) return
  panelColor.value = props.modelValue
  panelVisible.value = true
  nextZIndex()
  nextTick(update)
}
function closePanel() {
  if (!panelVisible.value) return
  panelVisible.value = false
}
function togglePanel() {
  panelVisible.value ? closePanel() : openPanel()
}

// 点击外部关闭
const { stop: stopClickOutside } = useClickOutside([referenceRef, floatingRef], () => closePanel(), true)
onBeforeUnmount(stopClickOutside)

function handleChange(color) {
  panelColor.value = color
  emit('update:modelValue', color)
  emit('change', color)
  if (props.validateEvent) {
    try {
      formItem?.validate?.('change')?.catch?.(() => {})
    } catch {
      /* 同步抛错时静默 */
    }
  }
}

// 实例方法
function show() {
  openPanel()
}
function hide() {
  closePanel()
}
function focus() {
  referenceRef.value?.querySelector('button')?.focus?.()
}
function blur() {
  referenceRef.value?.querySelector('button')?.blur?.()
}

defineExpose({ show, hide, focus, blur })
</script>

<style src="./style.css"></style>
