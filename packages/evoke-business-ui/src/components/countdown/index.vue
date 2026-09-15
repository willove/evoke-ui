<template>
  <div class="eb-countdown" :style="valueStyle">
    <div v-if="$slots.title || title" class="eb-countdown__title">
      <slot name="title">{{ title }}</slot>
    </div>
    <div class="eb-countdown__content">
      <span v-if="$slots.prefix || prefix" class="eb-countdown__prefix">
        <slot name="prefix">{{ prefix }}</slot>
      </span>
      <span class="eb-countdown__value">{{ display }}</span>
      <span v-if="$slots.suffix || suffix" class="eb-countdown__suffix">
        <slot name="suffix">{{ suffix }}</slot>
      </span>
    </div>
  </div>
</template>

<script setup>
/**
 * EbCountdown — 倒计时
 * value 为目标时刻（dayjs 可解析的 Date / 时间戳 / 字符串），到达后停在 00:00:00
 * 并触发 finish；format 令牌：HH 总小时（可超过 24）、mm 分、ss 秒，其余字符原样。
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import dayjs from 'dayjs'

defineOptions({ name: 'EbCountdown' })

const props = defineProps({
  /** 目标时刻（Date / 时间戳 / dayjs 可解析字符串） */
  value: { type: [Date, String, Number], default: null },
  /** 展示格式：HH 总小时（可 >24）/ mm 分 / ss 秒，其余字符原样输出 */
  format: { type: String, default: 'HH:mm:ss' },
  title: { type: String, default: '' },
  prefix: { type: String, default: '' },
  suffix: { type: String, default: '' },
  /** 数值样式（字号/颜色等，级联到整块内容） */
  valueStyle: { type: Object, default: undefined },
})

const emit = defineEmits(['change', 'finish'])

const now = ref(Date.now())
const finished = ref(false)

let timer = null

const target = computed(() => {
  if (props.value == null || props.value === '') return null
  const d = dayjs(props.value)
  return d.isValid() ? d.valueOf() : null
})

const remaining = computed(() => {
  if (target.value == null) return 0
  return Math.max(0, target.value - now.value)
})

const display = computed(() => {
  const totalSec = Math.floor(remaining.value / 1000)
  const pad = (n) => String(n).padStart(2, '0')
  const tokens = {
    HH: pad(Math.floor(totalSec / 3600)),
    mm: pad(Math.floor(totalSec / 60) % 60),
    ss: pad(totalSec % 60),
  }
  return props.format.replace(/HH|mm|ss/g, (m) => tokens[m])
})

function stopTimer() {
  if (timer != null) {
    clearInterval(timer)
    timer = null
  }
}

function startTimer() {
  stopTimer()
  if (target.value == null) return
  finished.value = remaining.value <= 0
  if (finished.value) {
    emit('finish')
    return
  }
  timer = setInterval(() => {
    now.value = Date.now()
    if (remaining.value <= 0) {
      stopTimer()
      if (!finished.value) {
        finished.value = true
        emit('finish')
      }
    } else {
      emit('change', remaining.value)
    }
  }, 500)
}

watch(target, startTimer, { immediate: false })

onMounted(startTimer)
onBeforeUnmount(stopTimer)

defineExpose({
  /** 剩余毫秒数 */
  remaining,
})
</script>

<style src="./style.css"></style>
