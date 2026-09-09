<template>
  <div :class="['ev-load-more', `is-${status}`]">
    <!-- 触底哨兵：autoLoad 时用 IntersectionObserver 自动触发 -->
    <div v-if="autoLoad && !disabled" ref="sentinelRef" class="ev-load-more__sentinel" />
    <button
      type="button"
      class="ev-load-more__body"
      :disabled="disabled || status === 'loading' || status === 'noMore'"
      @click="trigger"
    >
      <slot name="loading" v-if="status === 'loading'">
        <span class="ev-load-more__spinner" />
      </slot>
      <slot :status="status">
        <span class="ev-load-more__text">{{ statusText }}</span>
      </slot>
    </button>
  </div>
</template>

<script setup>
/**
 * EvLoadMore — 上拉加载 / 加载更多
 * 列表尾部状态条：idle（可点击/触底自动）→ loading（外部拉数据）→ idle / noMore / error。
 * 状态由父级持有（v-model:status）：触发时组件置 loading 并发出 load-more，
 * 加载完成后由父级改回 idle（还有数据）或 noMore（到底）/ error（失败可点重试）。
 * 触底检测用 IntersectionObserver，根为最近的滚动祖先，页面滚动容器与壳内滚动区都适用。
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { getScrollParent } from '../../utils/scroll'

defineOptions({ name: 'EvLoadMore' })

const props = defineProps({
  /** 列表状态（v-model:status）：idle | loading | noMore | error */
  status: {
    type: String,
    default: 'idle',
    validator: (v) => ['idle', 'loading', 'noMore', 'error'].includes(v),
  },
  /** 触底自动加载（IntersectionObserver） */
  autoLoad: { type: Boolean, default: true },
  /** 触底提前量（px），距底部多远开始预加载 */
  preload: { type: Number, default: 0 },
  disabled: { type: Boolean, default: false },
  loadingText: { type: String, default: '加载中…' },
  noMoreText: { type: String, default: '没有更多了' },
  errorText: { type: String, default: '加载失败，点击重试' },
  idleText: { type: String, default: '加载更多' },
})

const emit = defineEmits(['update:status', 'load-more'])

const sentinelRef = ref(null)
let observer = null

const statusText = computed(
  () =>
    ({
      idle: props.idleText,
      loading: props.loadingText,
      noMore: props.noMoreText,
      error: props.errorText,
    })[props.status] ?? ''
)

/** 触发一次加载：idle / error 可触发（error 即重试），发出 load-more 并进入 loading */
function trigger() {
  if (props.disabled || (props.status !== 'idle' && props.status !== 'error')) return
  emit('update:status', 'loading')
  emit('load-more')
}

onMounted(() => {
  if (
    !props.autoLoad ||
    props.disabled ||
    typeof IntersectionObserver === 'undefined' ||
    !sentinelRef.value
  ) {
    return
  }
  const root = getScrollParent(sentinelRef.value)
  observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) trigger()
    },
    {
      root: root === window ? null : root,
      rootMargin: `0px 0px ${props.preload}px 0px`,
    }
  )
  observer.observe(sentinelRef.value)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
})

defineExpose({
  /** 手动触发一次加载（等同点击） */
  trigger,
})
</script>

<style src="./style.css"></style>
