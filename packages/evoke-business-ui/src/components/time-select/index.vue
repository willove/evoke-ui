<template>
  <div
    class="eb-date-editor eb-time-select eb-time-select"
    :class="[sizeClass, { 'is-disabled': isDisabled }]"
  >
    <div
      ref="referenceRef"
      class="eb-input__wrapper"
      :class="{ 'is-focus': dropdownVisible, 'is-disabled': isDisabled }"
      @click="handleWrapperClick"
    >
      <span class="eb-input__prefix">
        <eb-icon :name="prefixIcon" class="eb-input__icon" />
      </span>
      <input
        ref="inputRef"
        class="eb-input__inner"
        :value="displayValue"
        :name="name"
        :placeholder="placeholder || t('datepicker.selectTime')"
        :readonly="!editable || isDisabled"
        :disabled="isDisabled"
        @change="handleInput"
        @focus="emit('focus')"
      />
      <span v-if="clearable && hasValue && !isDisabled" class="eb-input__suffix" @click.stop>
        <eb-icon
          class="eb-input__icon eb-range__close-icon"
          name="circle-close"
          @click.stop="handleClear"
        />
      </span>
    </div>

    <Teleport to="body">
      <Transition name="eb-picker-dropdown">
        <div
          v-if="dropdownVisible"
          ref="floatingRef"
          class="eb-time-select-dropdown eb-popper eb-time-select-dropdown"
          :style="popperStyle"
        >
          <div class="eb-time-select__wrap">
            <p
              v-for="item in options"
              :key="item.value"
              class="eb-time-select__item"
              :class="{ 'is-disabled': item.disabled, 'is-active': item.value === modelValue }"
              @click="handlePick(item)"
            >
              {{ item.value }}
            </p>
            <p v-if="options.length === 0" class="eb-time-select__item is-disabled">
              {{ t('select.noData') }}
            </p>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
/**
 * EbTimeSelect — 时间下拉选择（固定步长选项列表，.eb-time-select-dropdown 结构类）
 * start/end/step（HH:mm），minTime/maxTime 控制可选范围
 */
import { computed, nextTick, onBeforeUnmount, ref, toRef } from 'vue'
import EbIcon from '../icon/index.vue'
import { dayjs } from '../date-picker/utils'
import { useFloating } from '../../composables/useFloating'
import { useZIndex } from '../../composables/useZIndex'
import { useClickOutside } from '../../composables/useClickOutside'
import { useFormItem, triggerFormValidate } from '../../composables/useFormItem'
import { useLocale } from '../../composables/useLocale'

defineOptions({ name: 'EbTimeSelect', inheritAttrs: false })

const props = defineProps({
  modelValue: { type: [String, Date], default: null },
  start: { type: String, default: '09:00' },
  end: { type: String, default: '18:00' },
  step: { type: String, default: '00:30' },
  minTime: { type: String, default: '' },
  maxTime: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  clearable: { type: Boolean, default: true },
  editable: { type: Boolean, default: true },
  disabled: { type: Boolean, default: false },
  size: { type: String, default: '' },
  name: { type: String, default: undefined },
  prefixIcon: { type: String, default: 'clock' },
})

const emit = defineEmits(['update:modelValue', 'change', 'clear', 'focus', 'blur', 'visible-change'])

const { t } = useLocale()

const { size: formSize, disabled: formDisabled, formItem } = useFormItem({
  size: toRef(props, 'size'),
  disabled: toRef(props, 'disabled'),
})
const isDisabled = computed(() => formDisabled.value || props.disabled)
const sizeClass = computed(() => {
  const s = props.size || formSize.value
  if (s === 'large') return 'eb-input--large'
  if (s === 'small') return 'eb-input--small'
  return ''
})

// ─── 选项生成 ───
function parseHM(str, fallback) {
  const d = dayjs(str, 'HH:mm')
  return d.isValid() ? d : fallback
}

const options = computed(() => {
  const start = parseHM(props.start, dayjs().hour(0).minute(0))
  const end = parseHM(props.end, dayjs().hour(23).minute(59))
  const stepMatch = /^(\d+):(\d+)$/.exec(props.step || '')
  const stepMinutes = stepMatch
    ? Number(stepMatch[1]) * 60 + Number(stepMatch[2])
    : 30
  const minT = props.minTime ? parseHM(props.minTime, null) : null
  const maxT = props.maxTime ? parseHM(props.maxTime, null) : null
  const list = []
  let cur = start.startOf('minute')
  // 规避 end 早于 start 的死循环
  while (cur.isBefore(end) || cur.isSame(end, 'minute')) {
    if (stepMinutes <= 0) break
    const value = cur.format('HH:mm')
    let disabled = false
    if (minT && cur.isBefore(minT, 'minute')) disabled = true
    if (maxT && cur.isAfter(maxT, 'minute')) disabled = true
    list.push({ value, disabled })
    cur = cur.add(stepMinutes, 'minute')
  }
  return list
})

const hasValue = computed(() => props.modelValue !== null && props.modelValue !== undefined && props.modelValue !== '')

const displayValue = computed(() => {
  if (!hasValue.value) return ''
  if (props.modelValue instanceof Date) return dayjs(props.modelValue).format('HH:mm')
  return String(props.modelValue)
})

// ─── 弹层 ───
const referenceRef = ref(null)
const floatingRef = ref(null)
const inputRef = ref(null)
const dropdownVisible = ref(false)

const { zIndex, next: nextZIndex } = useZIndex()
const { x, y, update, show: startFloating, hide: stopFloating } = useFloating({
  reference: referenceRef,
  floating: floatingRef,
  placement: 'bottom-start',
  offset: 4,
  flip: true,
  shift: true,
  autoUpdate: true,
  onReferenceEscape: () => closeDropdown(),
})

const popperStyle = computed(() => ({
  position: 'fixed',
  left: `${x.value}px`,
  top: `${y.value}px`,
  zIndex: zIndex.value,
  minWidth: `${referenceRef.value?.offsetWidth ?? 0}px`,
}))

async function openDropdown() {
  if (isDisabled.value || dropdownVisible.value) return
  nextZIndex()
  dropdownVisible.value = true
  emit('visible-change', true)
  await nextTick()
  // show() 内部 update + 启动 autoUpdate：页面滚动/resize 时弹层持续跟随
  await startFloating()
}

function closeDropdown() {
  if (!dropdownVisible.value) return
  dropdownVisible.value = false
  stopFloating()
  emit('visible-change', false)
  emit('blur')
}

function handleWrapperClick() {
  if (isDisabled.value) return
  dropdownVisible.value ? closeDropdown() : openDropdown()
}

const { stop: stopClickOutside } = useClickOutside(
  [referenceRef, floatingRef],
  () => closeDropdown(),
  true
)
onBeforeUnmount(stopClickOutside)

// ─── 选择 ───
function handlePick(item) {
  if (item.disabled) return
  emit('update:modelValue', item.value)
  emit('change', item.value)
  triggerFormValidate(formItem, 'change')
  closeDropdown()
}

function handleClear() {
  emit('update:modelValue', null)
  emit('change', null)
  emit('clear')
  closeDropdown()
}

function handleInput(e) {
  const text = e.target.value?.trim()
  if (!text) {
    handleClear()
    return
  }
  const hit = options.value.find((o) => o.value === text)
  if (hit && !hit.disabled) {
    handlePick(hit)
  } else {
    e.target.value = displayValue.value
  }
}

function focus() {
  inputRef.value?.focus?.()
  openDropdown()
}

function blur() {
  closeDropdown()
}

defineExpose({ focus, blur })
</script>

<style src="./style.css"></style>
