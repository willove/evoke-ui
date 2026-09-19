<template>
  <div
    v-if="!virtualTriggering"
    ref="referenceRef"
    class="eb-popper-trigger"
    style="display: inline-flex"
    v-bind="triggerAttrs"
  >
    <slot name="trigger" />
  </div>
  <Teleport to="body">
    <Transition :name="transitionName" @after-leave="onAfterLeave">
      <div
        v-if="show"
        ref="floatingRef"
        class="eb-popper"
        :class="[popperClass]"
        :style="{ zIndex }"
        role="tooltip"
      >
        <slot />
        <span v-if="showArrow" ref="arrowRef" class="eb-popper__arrow" />
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
/**
 * EbPopper — 浮层基座（内部核心组件，Tooltip/Popover/Dropdown/Select 弹层共用）
 * useFloating 驱动定位；trigger 语义：hover/click/focus/contextmenu；
 * virtual-triggering 模式下外部传 virtual-ref
 */
import { computed, onBeforeUnmount, onMounted, ref, useAttrs, watch, nextTick } from 'vue'
import { useFloating } from '../../composables/useFloating'
import { useZIndex } from '../../composables/useZIndex'
import { on as onEvent } from '../../utils/events'
import { contains, inBrowser } from '../../utils/dom'

defineOptions({ name: 'EbPopper', inheritAttrs: false })

const props = defineProps({
  /** 挂载方向（floating-ui placement） */
  placement: { type: String, default: 'bottom' },
  /** 触发方式 */
  trigger: {
    type: String,
    default: 'hover',
    validator: (v) => ['hover', 'click', 'focus', 'contextmenu', 'manual'].includes(v),
  },
  /** 浮层显隐（manual 模式） */
  visible: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  showAfter: { type: Number, default: 0 },
  hideAfter: { type: Number, default: 200 },
  /** 延迟隐藏期间 hover 浮层本体可取消关闭 */
  hideOnBlur: { type: Boolean, default: true },
  showArrow: { type: Boolean, default: false },
  popperClass: { type: [String, Array, Object], default: '' },
  transitionName: { type: String, default: 'eb-popper-fade' },
  /** 虚拟触发：外部传入元素 ref */
  virtualTriggering: { type: Boolean, default: false },
  virtualRef: { type: Object, default: null },
  /** 主轴偏移 */
  offset: { type: Number, default: 8 },
  /** 浮层最小宽度跟随参考元素（Select/Dropdown） */
  matchWidth: { type: Boolean, default: false },
})

const emit = defineEmits(['show', 'hide'])

const attrs = useAttrs()
// trigger 容器透传 attrs（class 等），浮层不透传
const triggerAttrs = computed(() => ({ class: attrs.class, style: attrs.style }))

const referenceRef = ref(null)
const floatingRef = ref(null)
const arrowRef = ref(null)
const show = ref(false)

const { zIndex } = useZIndex()

// virtual-triggering：参考元素来自外部（.value 解包，供事件绑定/定位消费）
const effectiveReference = computed(() =>
  props.virtualTriggering ? props.virtualRef : referenceRef.value
)

const {
  update: updatePosition,
  show: activateFloating,
  hide: deactivateFloating,
} = useFloating({
  reference: effectiveReference,
  floating: floatingRef,
  arrow: arrowRef,
  placement: props.placement,
  offset: props.offset,
  autoUpdate: true,
  // 触发器随滚动越出视口：浮层自动收起（触发器不可见后浮层不应悬空/叠在站点顶栏上）
  onReferenceEscape: () => deactivateFloating(),
})

let showTimer = null
let hideTimer = null

function clearTimers() {
  if (showTimer) {
    clearTimeout(showTimer)
    showTimer = null
  }
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
}

async function open() {
  if (props.disabled || show.value) return
  clearTimers()
  if (props.showAfter > 0) {
    showTimer = setTimeout(doOpen, props.showAfter)
  } else {
    doOpen()
  }
}

async function doOpen() {
  zIndex.value = 2000 + Math.floor(Math.random() * 100)
  show.value = true
  emit('show')
  await nextTick()
  // activateFloating 内部 update + 启动 autoUpdate（滚动跟随的关键）
  await activateFloating()
  // matchWidth：浮层最小宽度 = 参考元素宽度（Select 下拉）
  if (props.matchWidth) {
    const ref = effectiveReference.value
    const el = floatingRef.value
    if (ref && el) {
      el.style.minWidth = `${ref.offsetWidth || ref.getBoundingClientRect?.()?.width || 0}px`
    }
  }
}

function close() {
  if (!show.value) return
  clearTimers()
  if (props.hideAfter > 0) {
    hideTimer = setTimeout(doClose, props.hideAfter)
  } else {
    doClose()
  }
}

function doClose() {
  if (!show.value) return
  show.value = false
  deactivateFloating()
  emit('hide')
}

function toggle() {
  show.value ? close() : open()
}

function onAfterLeave() {
  /* 预留 */
}

// ─── 事件绑定（trigger 语义） ───
const cleanups = []

function bindEvents() {
  if (!inBrowser()) return
  const ref = effectiveReference.value
  if (!ref) return

  if (props.trigger === 'hover') {
    cleanups.push(onEvent(ref, 'mouseenter', open))
    cleanups.push(onEvent(ref, 'mouseleave', () => close()))
    bindFloatingHover()
  } else if (props.trigger === 'click') {
    cleanups.push(
      onEvent(ref, 'click', (e) => {
        e.stopPropagation()
        toggle()
      })
    )
  } else if (props.trigger === 'focus') {
    cleanups.push(onEvent(ref, 'focusin', open))
    cleanups.push(onEvent(ref, 'focusout', close))
  } else if (props.trigger === 'contextmenu') {
    cleanups.push(
      onEvent(ref, 'contextmenu', (e) => {
        e.preventDefault()
        open()
      })
    )
  }
}

// 浮层 hover 保活：floating 元素 v-if 惰性渲染，须在 DOM 就绪后绑定
// （onEvent 只接受真实 EventTarget，传 Vue ref 会静默失败）
let floatingHoverCleanup = []
function bindFloatingHover() {
  floatingHoverCleanup.splice(0).forEach((off) => off())
  if (props.trigger !== 'hover' || !props.hideOnBlur) return
  const el = floatingRef.value
  if (!el) return
  floatingHoverCleanup.push(onEvent(el, 'mouseenter', clearTimers))
  floatingHoverCleanup.push(
    onEvent(el, 'mouseleave', () => {
      if (props.trigger === 'hover') close()
    })
  )
}

watch(floatingRef, (el) => {
  if (el) bindFloatingHover()
  else floatingHoverCleanup.splice(0).forEach((off) => off())
})

// 全局点击关闭（click/contextmenu trigger）+ ESC
function onGlobalPointerDown(e) {
  if (!show.value) return
  const ref = effectiveReference.value
  if (contains(ref, e.target) || contains(floatingRef.value, e.target)) return
  doClose()
}

function onGlobalKeydown(e) {
  if (e.key === 'Escape' && show.value) doClose()
}

function bindGlobal() {
  if (!inBrowser()) return
  cleanups.push(onEvent(document, 'pointerdown', onGlobalPointerDown, { capture: true }))
  cleanups.push(onEvent(document, 'keydown', onGlobalKeydown))
}

// 挂载后同步绑定（referenceRef 此时已填充，事件立即可用）
onMounted(() => {
  if (props.trigger !== 'manual') {
    bindEvents()
  }
  bindGlobal()
})

// trigger/参考元素变化时重绑（virtual-ref 动态场景：换参考元素即换绑定目标，
// 与 onMounted 同条件——虚拟模式此前被排除在此门外，换 ref 后旧监听被解绑却不再重绑）
watch(
  () => [props.trigger, effectiveReference.value],
  () => {
    unbindAll()
    if (props.trigger !== 'manual') {
      bindEvents()
    }
    bindGlobal()
  }
)

// manual 模式：外部 visible 控制
watch(
  () => props.visible,
  (val) => {
    if (props.trigger !== 'manual') return
    val ? open() : doClose()
  },
  { immediate: true }
)

watch(
  () => props.disabled,
  (val) => {
    if (val) doClose()
  }
)

function unbindAll() {
  cleanups.splice(0).forEach((off) => off())
}

onBeforeUnmount(() => {
  clearTimers()
  floatingHoverCleanup.splice(0).forEach((off) => off())
  unbindAll()
})

defineExpose({
  show,
  open,
  close,
  update: updatePosition,
  referenceRef,
  floatingRef,
})
</script>

<style src="./style.css"></style>
