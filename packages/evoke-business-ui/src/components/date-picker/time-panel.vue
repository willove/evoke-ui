<template>
  <div class="eb-time-panel eb-popper" :class="{ 'is-disabled': disabled }">
    <div class="eb-time-panel__content" :class="{ 'has-seconds': showSeconds }">
      <div class="eb-time-spinner" :class="{ 'has-seconds': showSeconds }">
        <div v-for="col in columns" :key="col.key" class="eb-time-spinner__wrapper">
          <ul class="eb-time-spinner__list">
            <li
              v-for="item in col.items"
              :key="item.value"
              class="eb-time-spinner__item"
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
    <div v-if="showFooter" class="eb-time-panel__footer">
      <button type="button" class="eb-time-panel__btn cancel" @click="emit('cancel')">
        {{ t('datepicker.cancel') }}
      </button>
      <button type="button" class="eb-time-panel__btn confirm" @click="emit('confirm')">
        {{ t('datepicker.confirm') }}
      </button>
    </div>
  </div>
</template>

<script setup>
/**
 * TimePanel — 时间滚轮面板（.eb-time-panel / .eb-time-spinner 结构类）
 * 三列（时/分/秒），点击项即时 emit pick；底部 取消/确定
 * 供 EbDatePicker（datetime 系列头部）与 EbTimePicker 复用
 */
import { computed, watch } from 'vue'
import { useLocale } from '../../composables/useLocale'

defineOptions({ name: 'EbTimePanel' })

const props = defineProps({
  /** 当前时间（Date|null） */
  modelValue: { type: Date, default: null },
  /** 是否展示秒列 */
  showSeconds: { type: Boolean, default: true },
  /** 是否展示底部按钮（区间组合时由外层统一提供） */
  showFooter: { type: Boolean, default: true },
  disabled: { type: Boolean, default: false },
  /** 禁用的小时集合（函数，返回数字数组） */
  disabledHours: { type: Function, default: null },
  /** 禁用的分钟集合（入参 hour，返回数字数组） */
  disabledMinutes: { type: Function, default: null },
  /** 禁用的秒集合（入参 hour、minute，返回数字数组） */
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

/** 各列禁用集合（antd 对齐：函数返回数字数组，分/秒依赖当前时/分） */
function disabledListFor(key, hour, minute) {
  if (key === 'hour' && props.disabledHours) return props.disabledHours() || []
  if (key === 'minute' && props.disabledMinutes) return props.disabledMinutes(hour) || []
  if (key === 'second' && props.disabledSeconds) return props.disabledSeconds(hour, minute) || []
  return null
}

function buildItems(count, key) {
  const items = []
  const list = disabledListFor(key, time.value.hour, time.value.minute)
  for (let i = 0; i < count; i++) {
    items.push({
      value: i,
      label: String(i).padStart(2, '0'),
      disabled: !!list && list.includes(i),
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

/** 距 current 最近的可用值（全部禁用时保持原值） */
function nearestAvailable(total, list, current) {
  if (!list || !list.includes(current)) return current
  let best = current
  let bestDist = Infinity
  for (let i = 0; i < total; i++) {
    if (list.includes(i)) continue
    const dist = Math.abs(i - current)
    if (dist < bestDist) {
      bestDist = dist
      best = i
    }
  }
  return best
}

/**
 * 让位：当前值落在禁用集内时换到最近可用值（时→分→秒 依次让位，
 * 分/秒禁用集基于让位后的上游值计算）；pick 回流后收敛，无死循环
 */
function yieldDisabledValue() {
  const d = props.modelValue
  if (!d) return
  const cur = { hour: d.getHours(), minute: d.getMinutes(), second: d.getSeconds() }
  const hour = nearestAvailable(24, disabledListFor('hour', cur.hour, cur.minute), cur.hour)
  const minute = nearestAvailable(60, disabledListFor('minute', hour, cur.minute), cur.minute)
  const second = props.showSeconds
    ? nearestAvailable(60, disabledListFor('second', hour, minute), cur.second)
    : cur.second
  if (hour === cur.hour && minute === cur.minute && second === cur.second) return
  const next = new Date(d)
  next.setHours(hour, minute, second)
  emit('pick', next)
}

// 生成初始值 / 外部更新落在禁用集内时自动让位
watch(() => props.modelValue, yieldDisabledValue, { immediate: true })
</script>
