<template>
  <div class="ev-time-panel ev-popper" :class="{ 'is-disabled': disabled }">
    <div class="ev-time-panel__content" :class="{ 'has-seconds': showSeconds }">
      <div class="ev-time-spinner" :class="{ 'has-seconds': showSeconds }">
        <div v-for="col in columns" :key="col.key" class="ev-time-spinner__wrapper">
          <ul class="ev-time-spinner__list">
            <li
              v-for="item in col.items"
              :key="item.value"
              class="ev-time-spinner__item"
              :class="{
                'is-active': item.value === col.active,
                'is-disabled': item.disabled,
              }"
              @click="handleItemClick(col.key, item)"
            >
              {{ item.label }}
            </li>
          </ul>
        </div>
      </div>
    </div>
    <div v-if="showFooter" class="ev-time-panel__footer">
      <button type="button" class="ev-time-panel__btn cancel" @click="emit('cancel')">
        {{ t('datepicker.cancel') }}
      </button>
      <button type="button" class="ev-time-panel__btn confirm" @click="emit('confirm')">
        {{ t('datepicker.confirm') }}
      </button>
    </div>
  </div>
</template>

<script setup>
/**
 * TimePanel — 时间滚轮面板（.ev-time-panel / .ev-time-spinner 结构类）
 * 三列（时/分/秒），点击项即时 emit pick；底部 取消/确定
 * 供 EvDatePicker（datetime 系列头部）与 EvTimePicker 复用
 */
import { computed } from 'vue'
import { useLocale } from '../../composables/useLocale'

defineOptions({ name: 'EvTimePanel' })

const props = defineProps({
  /** 当前时间（Date|null） */
  modelValue: { type: Date, default: null },
  /** 是否展示秒列 */
  showSeconds: { type: Boolean, default: true },
  /** 是否展示底部按钮（区间组合时由外层统一提供） */
  showFooter: { type: Boolean, default: true },
  disabled: { type: Boolean, default: false },
  disabledHours: { type: Function, default: null },
  disabledMinutes: { type: Function, default: null },
  disabledSeconds: { type: Function, default: null },
})

const emit = defineEmits(['pick', 'confirm', 'cancel'])

const { t } = useLocale()

const time = computed(() => {
  const d = props.modelValue
  return {
    hour: d ? d.getHours() : 0,
    minute: d ? d.getMinutes() : 0,
    second: d ? d.getSeconds() : 0,
  }
})

function buildItems(count, key) {
  const items = []
  for (let i = 0; i < count; i++) {
    let disabled = false
    if (key === 'hour' && props.disabledHours) disabled = props.disabledHours(i)
    else if (key === 'minute' && props.disabledMinutes) disabled = props.disabledMinutes(i, time.value.hour)
    else if (key === 'second' && props.disabledSeconds) disabled = props.disabledSeconds(i, time.value.minute)
    items.push({
      value: i,
      label: String(i).padStart(2, '0'),
      disabled,
    })
  }
  return items
}

const columns = computed(() => {
  const cols = [
    { key: 'hour', items: buildItems(24, 'hour'), active: time.value.hour },
    { key: 'minute', items: buildItems(60, 'minute'), active: time.value.minute },
  ]
  if (props.showSeconds) {
    cols.push({ key: 'second', items: buildItems(60, 'second'), active: time.value.second })
  }
  return cols
})

function handleItemClick(colKey, item) {
  if (item.disabled || props.disabled) return
  const next = new Date(props.modelValue || new Date())
  if (colKey === 'hour') next.setHours(item.value)
  else if (colKey === 'minute') next.setMinutes(item.value)
  else next.setSeconds(item.value)
  emit('pick', next)
}
</script>
