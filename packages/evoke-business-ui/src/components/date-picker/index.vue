<template>
  <div
    class="eb-date-editor eb-input eb-date-editor"
    :class="[
      sizeClass,
      { 'is-disabled': isDisabled, 'is-focus': pickerVisible, 'eb-ripple-off': ripple === false },
      `eb-date-editor--${type}`,
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
        :placeholder="placeholder || singlePlaceholder"
        :readonly="!editable || isDisabled"
        :disabled="isDisabled"
        role="combobox"
        aria-haspopup="dialog"
        :aria-expanded="pickerVisible ? 'true' : 'false'"
        :aria-controls="pickerVisible ? panelId : undefined"
        @change="handleSingleInput"
        @focus="handleFocus"
        @keydown="handleTriggerKeydown"
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
        sizeClass,
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
        :placeholder="startPlaceholder || t('datepicker.startDate')"
        :readonly="!editable || isDisabled"
        :disabled="isDisabled"
        autocomplete="off"
        role="combobox"
        aria-haspopup="dialog"
        :aria-expanded="pickerVisible ? 'true' : 'false'"
        :aria-controls="pickerVisible ? panelId : undefined"
        @change="handleRangeInput('start', $event)"
        @focus="handleFocus"
        @keydown="handleTriggerKeydown"
      />
      <span class="eb-range-separator">{{ rangeSeparator }}</span>
      <input
        class="eb-range-input"
        :value="endDisplay"
        :name="name"
        :placeholder="endPlaceholder || t('datepicker.endDate')"
        :readonly="!editable || isDisabled"
        :disabled="isDisabled"
        autocomplete="off"
        role="combobox"
        aria-haspopup="dialog"
        :aria-expanded="pickerVisible ? 'true' : 'false'"
        :aria-controls="pickerVisible ? panelId : undefined"
        @change="handleRangeInput('end', $event)"
        @focus="handleFocus"
        @keydown="handleTriggerKeydown"
      />
      <eb-icon
        v-if="clearable && hasValue && !isDisabled"
        class="eb-range__close-icon"
        name="circle-close"
        @click.stop="handleClear"
      />
    </div>

    <!-- 弹层面板 -->
    <Teleport to="body">
      <Transition name="eb-picker-dropdown">
        <div
          v-if="pickerVisible && !isMobilePlatform"
          :id="panelId"
          ref="floatingRef"
          class="eb-picker__popper eb-popper eb-picker__popper"
          :style="popperStyle"
        >
          <panel-date
            v-if="!isRange"
            ref="panelRef"
            :type="type"
            :value="parsedSingle"
            :default-value="parsedDefault"
            :default-time="defaultTimeResolved"
            :disabled-date="disabledDate"
            :shortcuts="shortcuts"
            @pick="handleSinglePick"
            @confirm="handleConfirm"
            @shortcut="handleShortcut"
            @esc="closePanel(true)"
          />
          <panel-date-range
            v-else
            ref="panelRef"
            :type="type"
            :value="parsedRange"
            :default-value="parsedDefault"
            :default-time="defaultTimeArrayResolved"
            :disabled-date="disabledDate"
            :shortcuts="shortcuts"
            :unlink-panels="unlinkPanels"
            @pick="handleRangePick"
            @confirm="handleConfirm"
            @shortcut="handleShortcut"
            @calendar-change="handleCalendarChange"
            @esc="closePanel(true)"
          />
        </div>
      </Transition>
    </Teleport>

    <!-- 移动端（platform=mobile）：底部弹出日历面板 -->
    <Teleport to="body">
      <Transition name="eb-picker-sheet">
        <div
          v-if="pickerVisible && isMobilePlatform"
          class="eb-picker__sheet-mask"
          :style="{ zIndex: zIndex }"
          @click="closePanel"
        >
          <div class="eb-picker__sheet" @click.stop>
            <div class="eb-picker__sheet-head">
              <span class="eb-picker__sheet-title">{{ sheetTitle }}</span>
              <eb-icon name="close" @click="closePanel" />
            </div>
            <div class="eb-picker__sheet-panel">
              <panel-date
                v-if="!isRange"
                ref="panelRef"
                :type="type"
                :value="parsedSingle"
                :default-value="parsedDefault"
                :default-time="defaultTimeResolved"
                :disabled-date="disabledDate"
                :shortcuts="shortcuts"
                @pick="handleSinglePick"
                @confirm="handleConfirm"
                @shortcut="handleShortcut"
              />
              <panel-date-range
                v-else
                ref="panelRef"
                :type="type"
                :value="parsedRange"
                :default-value="parsedDefault"
                :default-time="defaultTimeArrayResolved"
                :disabled-date="disabledDate"
                :shortcuts="shortcuts"
                :unlink-panels="unlinkPanels"
                @pick="handleRangePick"
                @confirm="handleConfirm"
                @shortcut="handleShortcut"
                @calendar-change="handleCalendarChange"
              />
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
/**
 * EbDatePicker — 日期选择器（dayjs 驱动，）
 * type：date / datetime / daterange / datetimerange / month / monthrange / year
 * value-format 控制对外值格式（缺省 Date 对象）；shortcuts / disabled-date / default-time
 */
import { computed, nextTick, onBeforeUnmount, ref, toRef, watch } from 'vue'
import EbIcon from '../icon/index.vue'
import PanelDate from './panel-date.vue'
import PanelDateRange from './panel-date-range.vue'
import {
  DEFAULT_FORMATS, dayjs, isRangeType, hasTime,
  toSingleDayjs, toRangeDayjs, toOutValue,
} from './utils'
import { useFloating } from '../../composables/useFloating'
import { usePlatform } from '../../composables/usePlatform'
import { useZIndex } from '../../composables/useZIndex'
import { useClickOutside } from '../../composables/useClickOutside'
import { useFormItem, triggerFormValidate } from '../../composables/useFormItem'
import { useLocale } from '../../composables/useLocale'

defineOptions({ name: 'EbDatePicker', inheritAttrs: false })

// aria-controls 指向面板 id（组件级唯一）
let datePanelSeq = 0

// 容器环境：mobile 下面板以底部弹层呈现（而非浮动定位）
const { isMobile: isMobilePlatform } = usePlatform()

const props = defineProps({
  modelValue: { type: [Date, String, Number, Array], default: null },
  type: { type: String, default: 'date' },
  placeholder: { type: String, default: '' },
  startPlaceholder: { type: String, default: '' },
  endPlaceholder: { type: String, default: '' },
  rangeSeparator: { type: String, default: '-' },
  format: { type: String, default: '' },
  valueFormat: { type: String, default: '' },
  clearable: { type: Boolean, default: true },
  editable: { type: Boolean, default: true },
  disabled: { type: Boolean, default: false },
  size: { type: String, default: '' },
  name: { type: String, default: undefined },
  shortcuts: { type: Array, default: null },
  /** (date: Date) => boolean */
  disabledDate: { type: Function, default: null },
  /** 空值时面板默认视图 */
  defaultValue: { type: [Date, String, Number], default: null },
  /** datetime 单值 'HH:mm:ss'；区间 ['HH:mm:ss','HH:mm:ss'] */
  defaultTime: { type: [String, Array], default: '' },
  unlinkPanels: { type: Boolean, default: false },
  prefixIcon: { type: String, default: 'calendar' },
  /** 激活涟漪动效开关（聚焦时实体色影向内收拢消散）；Form 上可批量关闭，全局见 setRipple */
  ripple: { type: Boolean, default: true },
})

const emit = defineEmits([
  'update:modelValue',
  'change',
  'clear',
  'focus',
  'blur',
  'visible-change',
  'calendar-change',
])

const { t } = useLocale()

const isRange = computed(() => isRangeType(props.type))
const needConfirm = computed(() => hasTime(props.type))
const displayFormat = computed(() => props.format || DEFAULT_FORMATS[props.type] || 'YYYY-MM-DD')

const { size: formSize, disabled: formDisabled, formItem } = useFormItem({
  size: toRef(props, 'size'),
  disabled: toRef(props, 'disabled'),
})
const isDisabled = computed(() => formDisabled.value || props.disabled)
const sizeResolved = computed(() => props.size || formSize.value || 'default')
const sizeClass = computed(() => {
  const s = sizeResolved.value
  if (s === 'large') return isRange.value ? '' : 'eb-input--large'
  if (s === 'small') return isRange.value ? '' : 'eb-input--small'
  return ''
})

const singlePlaceholder = computed(() =>
  props.type === 'datetime' ? t('datepicker.selectDate') + ' ' + t('datepicker.selectTime') : t('datepicker.selectDate')
)

// 移动端 sheet 标题
const sheetTitle = computed(() => (isRange.value ? t('datepicker.selectDateRange') : t('datepicker.selectDate')))

// ─── 值解析 ───
const parsedSingle = computed(() => toSingleDayjs(props.modelValue, props.valueFormat))
const parsedRange = computed(() => toRangeDayjs(props.modelValue, props.valueFormat))
const parsedDefault = computed(() =>
  props.defaultValue ? toSingleDayjs(props.defaultValue, props.valueFormat) : null
)
const defaultTimeResolved = computed(() =>
  typeof props.defaultTime === 'string' ? props.defaultTime : (props.defaultTime?.[0] || '')
)
const defaultTimeArrayResolved = computed(() =>
  Array.isArray(props.defaultTime)
    ? props.defaultTime
    : (props.defaultTime ? [props.defaultTime, props.defaultTime] : [])
)

const hasValue = computed(() => {
  if (isRange.value) {
    const [s, e] = parsedRange.value
    return !!(s || e)
  }
  return !!parsedSingle.value
})

const displayValue = computed(() =>
  parsedSingle.value ? parsedSingle.value.format(displayFormat.value) : ''
)

const startDisplay = computed(() => {
  const [s] = parsedRange.value
  return s ? s.format(displayFormat.value) : ''
})

const endDisplay = computed(() => {
  const [, e] = parsedRange.value
  return e ? e.format(displayFormat.value) : ''
})

// ─── 弹层 ───
const referenceRef = ref(null)
const floatingRef = ref(null)
const inputRef = ref(null)
const panelRef = ref(null)
const pickerVisible = ref(false)
const panelId = `eb-date-picker-panel-${++datePanelSeq}`

const { zIndex, next: nextZIndex } = useZIndex()
const { x, y, show: startFloating, hide: stopFloating } = useFloating({
  reference: referenceRef,
  floating: floatingRef,
  placement: 'bottom-start',
  offset: 4,
  flip: true,
  shift: true,
  autoUpdate: true,
  onReferenceEscape: () => closePanel(),
})

const popperStyle = computed(() => ({
  position: 'fixed',
  left: `${x.value}px`,
  top: `${y.value}px`,
  zIndex: zIndex.value,
}))

async function openPanel() {
  if (isDisabled.value || pickerVisible.value) return
  nextZIndex()
  pickerVisible.value = true
  emit('visible-change', true)
  // 移动端为底部弹层，无需浮层定位
  if (isMobilePlatform.value) return
  await nextTick()
  // show() 内部 update + startAutoUpdate：页面滚动/resize 时弹层持续跟随输入框
  await startFloating()
}

function closePanel(returnFocus = false) {
  if (!pickerVisible.value) return
  pickerVisible.value = false
  stopFloating()
  emit('visible-change', false)
  emit('blur')
  if (returnFocus) focusTrigger()
}

function focusTrigger() {
  referenceRef.value?.querySelector?.('input')?.focus?.()
}

/** 触发器键盘：Enter/↓ 打开并把焦点送进网格，Esc 关闭 */
function handleTriggerKeydown(e) {
  if (isDisabled.value) return
  if (e.key === 'ArrowDown' || e.key === 'Enter') {
    if (!pickerVisible.value) {
      e.preventDefault()
      openPanel().then(() => panelRef.value?.focusGrid?.())
    }
  } else if (e.key === 'Escape' && pickerVisible.value) {
    e.preventDefault()
    closePanel()
  }
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

function handleFocus() {
  emit('focus')
}

// ─── 值提交 ───
function emitSingle(d) {
  const out = toOutValue(d, props.valueFormat)
  emit('update:modelValue', out)
  emit('change', out)
  triggerFormValidate(formItem, 'change')
}

function emitRange([s, e]) {
  const out = [toOutValue(s, props.valueFormat), toOutValue(e, props.valueFormat)]
  emit('update:modelValue', out)
  emit('change', out)
  triggerFormValidate(formItem, 'change')
}

function handleSinglePick(d) {
  emitSingle(d)
  if (!needConfirm.value) closePanel()
}

function handleRangePick(pair) {
  emitRange(pair)
  if (!needConfirm.value) closePanel()
}

function handleConfirm() {
  // 区间面板可能调整过时间 → 先同步最终草稿
  if (isRange.value) panelRef.value?.confirmPick?.()
  closePanel()
}

function handleShortcut(sc) {
  let v = typeof sc.value === 'function' ? sc.value() : sc.value
  if (v == null) return
  if (isRange.value) {
    if (!Array.isArray(v)) v = [v, v]
    emitRange([dayjs(v[0]), dayjs(v[1])])
  } else {
    emitSingle(dayjs(Array.isArray(v) ? v[0] : v))
  }
  // 含时间类型保持打开等待确认，其余直接关闭
  if (!needConfirm.value) closePanel()
}

function handleCalendarChange(start, end) {
  emit('calendar-change', start, end)
}

function handleClear() {
  if (isRange.value) {
    emit('update:modelValue', [null, null])
    emit('change', [null, null])
    triggerFormValidate(formItem, 'change')
  } else {
    emit('update:modelValue', null)
    emit('change', null)
    triggerFormValidate(formItem, 'change')
  }
  emit('clear')
  closePanel()
}

// ─── 手动输入 ───
function handleSingleInput(e) {
  const text = e.target.value?.trim()
  if (!text) {
    handleClear()
    return
  }
  const d = dayjs(text, displayFormat.value)
  if (d.isValid()) {
    // 保持秒级精度补零（避免 2026-9-1 这类非严格输入丢日）
    const full = dayjs(text, displayFormat.value)
    emitSingle(full)
    if (!needConfirm.value) closePanel()
  } else {
    // 无效输入回滚显示
    e.target.value = displayValue.value
  }
}

function handleRangeInput(side, e) {
  const text = e.target.value?.trim()
  if (!text) return
  const d = dayjs(text, displayFormat.value)
  if (!d.isValid()) {
    e.target.value = side === 'start' ? startDisplay.value : endDisplay.value
    return
  }
  const [s, ed] = parsedRange.value
  const next = side === 'start' ? [d, ed] : [s, d]
  if (next[0] && next[1] && next[1].isBefore(next[0])) return
  emitRange(next)
  if (!needConfirm.value) closePanel()
}

// ─── expose ───
function focus() {
  inputRef.value?.focus?.()
  openPanel()
}

function blur() {
  closePanel()
}

function handleOpen() {
  openPanel()
}

function handleClose() {
  closePanel()
}

defineExpose({ focus, blur, handleOpen, handleClose })
</script>

<style src="./style.css"></style>
