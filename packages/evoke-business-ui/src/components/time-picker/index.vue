<template>
  <div
    class="eb-date-editor eb-time-editor eb-input eb-time-picker"
    :class="[
      sizeClass,
      {
        'is-disabled': isDisabled,
        'eb-date-editor--timerange': isRange,
      },
    ]"
  >
    <!-- 单值编辑器 -->
    <div
      v-if="!isRange"
      ref="referenceRef"
      class="eb-input__wrapper"
      :class="{ 'is-focus': pickerVisible, 'is-disabled': isDisabled }"
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
        @change="handleSingleInput"
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

    <!-- 区间编辑器 -->
    <div
      v-else
      ref="referenceRef"
      class="eb-input__wrapper eb-range-editor"
      :class="[
        {
          'is-active': pickerVisible,
          'is-disabled': isDisabled,
          'eb-range-editor--large': sizeResolved === 'large',
          'eb-range-editor--small': sizeResolved === 'small',
        },
      ]"
      @click="handleWrapperClick"
    >
      <eb-icon :name="prefixIcon" class="eb-range__icon" />
      <input
        class="eb-range-input"
        :value="startDisplay"
        :name="name"
        :placeholder="startPlaceholder || t('datepicker.startTime')"
        :readonly="!editable || isDisabled"
        :disabled="isDisabled"
        @focus="emit('focus')"
      />
      <span class="eb-range-separator">{{ rangeSeparator }}</span>
      <input
        class="eb-range-input"
        :value="endDisplay"
        :name="name"
        :placeholder="endPlaceholder || t('datepicker.endTime')"
        :readonly="!editable || isDisabled"
        :disabled="isDisabled"
        @focus="emit('focus')"
      />
      <eb-icon
        v-if="clearable && hasValue && !isDisabled"
        class="eb-range__close-icon"
        name="circle-close"
        @click.stop="handleClear"
      />
    </div>

    <!-- 弹层 -->
    <Teleport to="body">
      <Transition name="eb-picker-dropdown">
        <div
          v-if="pickerVisible"
          ref="floatingRef"
          class="eb-time-picker__popper eb-picker__popper"
          :style="popperStyle"
        >
          <time-panel
            v-if="!isRange"
            :model-value="draft"
            :show-seconds="showSeconds"
            @pick="handleSinglePick"
            @confirm="closePanel"
            @cancel="closePanel"
          />
          <!-- 区间：双滚轮 + 统一 footer -->
          <div v-else class="eb-time-range-picker">
            <div class="eb-time-range-picker__content">
              <div class="eb-time-range-picker__cell">
                <div class="eb-time-range-picker__header">{{ t('datepicker.startTime') }}</div>
                <time-panel
                  :model-value="draftStart"
                  :show-seconds="showSeconds"
                  :show-footer="false"
                  class="eb-time-picker__cell-panel"
                  @pick="(d) => (draftStart = d)"
                />
              </div>
              <div class="eb-time-range-picker__cell">
                <div class="eb-time-range-picker__header">{{ t('datepicker.endTime') }}</div>
                <time-panel
                  :model-value="draftEnd"
                  :show-seconds="showSeconds"
                  :show-footer="false"
                  class="eb-time-picker__cell-panel"
                  @pick="(d) => (draftEnd = d)"
                />
              </div>
            </div>
            <div class="eb-time-panel__footer">
              <button type="button" class="eb-time-panel__btn cancel" @click="closePanel">
                {{ t('datepicker.cancel') }}
              </button>
              <button type="button" class="eb-time-panel__btn confirm" @click="confirmRange">
                {{ t('datepicker.confirm') }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
/**
 * EbTimePicker — 时间选择器（复用 date-picker 的 TimePanel 滚轮）
 * is-range：双滚轮区间；value-format 存在时对外输出字符串
 */
import { computed, nextTick, onBeforeUnmount, ref, toRef, watch } from 'vue'
import EbIcon from '../icon/index.vue'
import TimePanel from '../date-picker/time-panel.vue'
import { dayjs } from '../date-picker/utils'
import { useFloating } from '../../composables/useFloating'
import { useZIndex } from '../../composables/useZIndex'
import { useClickOutside } from '../../composables/useClickOutside'
import { useFormItem, triggerFormValidate } from '../../composables/useFormItem'
import { useLocale } from '../../composables/useLocale'

defineOptions({ name: 'EbTimePicker', inheritAttrs: false })

const props = defineProps({
  modelValue: { type: [Date, String, Array], default: null },
  isRange: { type: Boolean, default: false },
  format: { type: String, default: 'HH:mm:ss' },
  valueFormat: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  startPlaceholder: { type: String, default: '' },
  endPlaceholder: { type: String, default: '' },
  rangeSeparator: { type: String, default: '-' },
  clearable: { type: Boolean, default: true },
  editable: { type: Boolean, default: true },
  disabled: { type: Boolean, default: false },
  size: { type: String, default: '' },
  name: { type: String, default: undefined },
  prefixIcon: { type: String, default: 'clock' },
})

const emit = defineEmits(['update:modelValue', 'change', 'clear', 'focus', 'blur', 'visible-change'])

const { t } = useLocale()

const showSeconds = computed(() => props.format.includes('ss'))

const { size: formSize, disabled: formDisabled, formItem } = useFormItem({
  size: toRef(props, 'size'),
  disabled: toRef(props, 'disabled'),
})
const isDisabled = computed(() => formDisabled.value || props.disabled)
const sizeResolved = computed(() => props.size || formSize.value || 'default')
const sizeClass = computed(() => {
  const s = sizeResolved.value
  if (s === 'large') return props.isRange ? '' : 'eb-input--large'
  if (s === 'small') return props.isRange ? '' : 'eb-input--small'
  return ''
})

// ─── 值解析 ───
function parseTime(v) {
  if (v === undefined || v === null || v === '') return null
  const d = props.valueFormat ? dayjs(v, props.valueFormat) : dayjs(v)
  return d.isValid() ? d : null
}

const parsedSingle = computed(() => (props.isRange ? null : parseTime(props.modelValue)))
const parsedRange = computed(() => {
  if (!props.isRange || !Array.isArray(props.modelValue)) return [null, null]
  return [parseTime(props.modelValue[0]), parseTime(props.modelValue[1])]
})

const hasValue = computed(() =>
  props.isRange ? !!(parsedRange.value[0] || parsedRange.value[1]) : !!parsedSingle.value
)

const displayValue = computed(() =>
  parsedSingle.value ? parsedSingle.value.format(props.format) : ''
)
const startDisplay = computed(() => (parsedRange.value[0] ? parsedRange.value[0].format(props.format) : ''))
const endDisplay = computed(() => (parsedRange.value[1] ? parsedRange.value[1].format(props.format) : ''))

// ─── 弹层 ───
const referenceRef = ref(null)
const floatingRef = ref(null)
const inputRef = ref(null)
const pickerVisible = ref(false)
const draft = ref(new Date())
const draftStart = ref(new Date())
const draftEnd = ref(new Date())

const { zIndex, next: nextZIndex } = useZIndex()
const { x, y, update, show: startFloating, hide: stopFloating } = useFloating({
  reference: referenceRef,
  floating: floatingRef,
  placement: 'bottom-start',
  offset: 4,
  flip: true,
  shift: true,
  autoUpdate: true,
})

const popperStyle = computed(() => ({
  position: 'fixed',
  left: `${x.value}px`,
  top: `${y.value}px`,
  zIndex: zIndex.value,
}))

watch(pickerVisible, (val) => {
  emit('visible-change', val)
  if (val) {
    // 初始化草稿
    const base = parsedSingle.value || dayjs()
    draft.value = base.toDate()
    const [s, e] = parsedRange.value
    draftStart.value = (s || dayjs().hour(0).minute(0).second(0)).toDate()
    draftEnd.value = (e || dayjs().hour(23).minute(59).second(59)).toDate()
  }
})

async function openPanel() {
  if (isDisabled.value || pickerVisible.value) return
  nextZIndex()
  pickerVisible.value = true
  await nextTick()
  // show() 内部 update + 启动 autoUpdate：页面滚动/resize 时弹层持续跟随
  await startFloating()
}

function closePanel() {
  if (!pickerVisible.value) return
  pickerVisible.value = false
  stopFloating()
  emit('blur')
}

function handleWrapperClick() {
  if (isDisabled.value) return
  pickerVisible.value ? closePanel() : openPanel()
}

const { stop: stopClickOutside } = useClickOutside(
  [referenceRef, floatingRef],
  () => closePanel(),
  true
)
onBeforeUnmount(stopClickOutside)

// ─── 提交 ───
function toOut(d) {
  if (!d) return null
  return props.valueFormat ? d.format(props.valueFormat) : d.toDate()
}

function emitSingle(d) {
  const out = toOut(d)
  emit('update:modelValue', out)
  emit('change', out)
  triggerFormValidate(formItem, 'change')
}

function handleSinglePick(date) {
  draft.value = date
  emitSingle(dayjs(date))
}

function confirmRange() {
  const s = dayjs(draftStart.value)
  const e = dayjs(draftEnd.value)
  const ordered = s.isAfter(e) ? [e, s] : [s, e]
  emit('update:modelValue', [toOut(ordered[0]), toOut(ordered[1])])
  emit('change', [toOut(ordered[0]), toOut(ordered[1])])
  triggerFormValidate(formItem, 'change')
  closePanel()
}

function handleClear() {
  const out = props.isRange ? [null, null] : null
  emit('update:modelValue', out)
  emit('change', out)
  emit('clear')
  closePanel()
}

function handleSingleInput(e) {
  const text = e.target.value?.trim()
  if (!text) {
    handleClear()
    return
  }
  const d = dayjs(text, props.format)
  if (d.isValid()) {
    emitSingle(d)
    closePanel()
  } else {
    e.target.value = displayValue.value
  }
}

function focus() {
  inputRef.value?.focus?.()
  openPanel()
}

function blur() {
  closePanel()
}

defineExpose({ focus, blur })
</script>

<style src="./style.css"></style>
