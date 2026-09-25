<template>
  <eb-tooltip
    ref="tipRef"
    :placement="placement"
    :disabled="disabled"
    :show-after="showAfter"
    :hide-after="HIDE_DELAY"
    effect="dark"
    :popper-class="['et-screentip__popper', 'et-screentip']"
  >
    <div
      ref="triggerRef"
      class="et-screentip__trigger"
      @mouseover="onPointerOver"
      @mouseout="onPointerOut"
      @focusin="onFocusIn"
      @focusout="onFocusOut"
    >
      <slot />
    </div>

    <template #content>
      <div class="et-screentip__body">
        <div class="et-screentip__title">
          <span class="et-screentip__name">{{ titleText }}</span>
          <et-key-hint v-if="comboText" class="et-screentip__combo" :combo="comboText" />
        </div>
        <div v-if="descText" class="et-screentip__desc">{{ descText }}</div>
      </div>
    </template>
  </eb-tooltip>
</template>

<script setup>
/**
 * EtScreenTip — 替代 title 的富提示（tools-ui 计划 05 §四，M0 原子件）
 *
 * 形态：标题一行 + 说明一行（可选）+ 快捷键后缀（combo 交 EtKeyHint 平台符号化）。
 * 浮层基座复用 EbTooltip（effect=dark），本组件只加三件产品级能力：
 *
 *   ① 延迟契约：首显 / 热显 / 自动隐藏三档（见下方常量与 --et-screentip-delay-* 令牌）；
 *   ② 单例：同屏只开一个提示 —— 模块级登记表，任一发起显示即收起其它实例；
 *   ③ hover + focus 双触发：EbPopper 的 trigger 是单选取值（hover / click / focus /
 *      contextmenu），没有"hover 附带 focus"的组合。故触发器外包一层：鼠标用冒泡的
 *      mouseover / mouseout，键盘焦点用 focusin / focusout，两条路径都汇到本组件的
 *      show / hide 上（单例登记 + 延迟切档只此一处，不会两套触发各读一份 show-after）。
 *      触发器包装用 display: contents（无布局盒，宿主 flex 行无感），代价是收不到
 *      mouseenter / mouseleave（不冒泡、按命中边界派发），改用冒泡事件 + relatedTarget
 *      判定进出，语义等价。Esc 与外部按下收起由底座 EbPopper 的全局监听负责。
 *
 * 槽位语义（踩过的坑）：EbTooltip 的默认子内容 = 触发器（转手交给 EbPopper 的 #trigger，
 * 包在 .eb-popper-trigger 里），具名 content 槽才是浮层内容。所以模板里触发器包装是
 * 非 template 子节点，正文走 #content；反了就会把提示正文渲染进触发器。
 */
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import EbTooltip from '@wil-works/evoke-business-ui/tooltip'
import EtKeyHint from '../key-hint/index.vue'
import {
  dismissOtherTips,
  markTipRequest,
  registerTip,
  releaseTip,
  withinHotWindow,
} from './singleton.js'

defineOptions({ name: 'EtScreenTip' })

const props = defineProps({
  /** 提示名称（一行，必填） */
  title: { type: String, required: true },
  /** 说明（一行，可选） */
  desc: { type: String, default: '' },
  /** 快捷键规范串（如 'mod+shift+z'；非空时标题行渲染 EtKeyHint） */
  combo: { type: String, default: '' },
  /** 挂载方向：校验集与 EbTooltip 的 placement 校验一致（不另立一套）。
      校验集就地内联 —— defineProps 的声明会被提升到 setup() 之外，validator 里
      引用 <script setup> 的本地变量会直接编译失败 */
  placement: {
    type: String,
    default: 'bottom',
    validator: (v) =>
      [
        'top', 'bottom', 'left', 'right',
        'top-start', 'top-end', 'bottom-start', 'bottom-end',
        'left-start', 'left-end', 'right-start', 'right-end',
      ].includes(v),
  },
  disabled: { type: Boolean, default: false },
})

const titleText = computed(() => props.title || '')
const descText = computed(() => props.desc || '')
const comboText = computed(() => props.combo || '')

// ─── 延迟契约（毫秒数值）──
// 与 --et-screentip-delay-first / -hot / -hide 三个令牌同源：令牌在 CSS 侧服务样式
// 过渡，JS 侧要的是数值，两处各存一份。改令牌时同步这三个常量。
const DELAY_FIRST = 400 // --et-screentip-delay-first
const DELAY_HOT = 120 // --et-screentip-delay-hot
const HIDE_DELAY = 200 // --et-screentip-delay-hide
/** 热显窗口：一次提示出现后 1 秒内再触发，首显延迟降到热显档 */
const HOT_WINDOW = 1000

// ─── 单例登记表 ───
// 状态本体在 ./singleton.js（普通模块 = 跨实例共享；<script setup> 顶层声明编译后都在
// setup() 里，每实例各一份，单例会退化成"自己管自己"）。
// 登记时机 = 发起显示（含 show-after 延时窗口内）：这一小段时间里浮层还没出现，
// 但别的提示若此时弹出就会一屏两开，所以"已发起"那一刻就要把别人收掉。
const tipRef = ref(null)
const triggerRef = ref(null)
/** 当前档位的首显延迟：热显 / 首显切档后随渲染推给底座 EbTooltip */
const showAfter = ref(DELAY_FIRST)

/** 本实例在登记表里的句柄（模块级表按实例区分，需在定义 dismiss 前建好） */
const self = { dismiss: () => dismiss() }

let dismissTimer = null

function clearDismissTimer() {
  if (dismissTimer) {
    clearTimeout(dismissTimer)
    dismissTimer = null
  }
}

/** 发起显示：收掉其它实例 → 定档 → 登记 → 等 prop 落到底座后调 show */
function requestShow() {
  if (props.disabled) return
  clearDismissTimer()
  // 单例：其它实例立即收起（各自仍走自己的自动隐藏延时，那是隐藏契约不是竞争）
  dismissOtherTips(self)
  registerTip(self)
  const hot = withinHotWindow(HOT_WINDOW)
  showAfter.value = hot ? DELAY_HOT : DELAY_FIRST
  markTipRequest()
  // showAfter 是 EbTooltip 的 prop：底座自己的 hover 监听已经用上一档值排过一次定时器，
  // 必须等本次切档渲染下去，再用 show() 让底座按新档重排（open 内部先 clearTimers），
  // 否则热显档就丢了
  nextTick(() => {
    if (!props.disabled) tipRef.value?.show()
  })
}

/** 收起：走 hide-after 淡出；淡出窗口内仍算"已发起"，避免一屏两开 */
function dismiss() {
  clearDismissTimer()
  tipRef.value?.hide()
  dismissTimer = setTimeout(() => {
    dismissTimer = null
    releaseTip(self)
  }, HIDE_DELAY)
}

/** 指针是否仍在触发器内部（mouseover/mouseout 的进出判定） */
function withinTrigger(e) {
  const root = triggerRef.value
  return !!root && !!e.relatedTarget && root.contains(e.relatedTarget)
}

/** 指针进入触发器（等价 mouseenter，见 style.css 对本层事件的说明） */
function onPointerOver(e) {
  if (!withinTrigger(e)) requestShow()
}

/** 指针离开触发器（等价 mouseleave） */
function onPointerOut(e) {
  if (!withinTrigger(e)) dismiss()
}

/** 键盘聚焦也显示（计划 05 §四 验收要点） */
function onFocusIn() {
  requestShow()
}

/** 焦点离开触发器；焦点在触发器内部转移（钮内多个可聚焦元素）不算离开 */
function onFocusOut(e) {
  if (withinTrigger(e)) return
  dismiss()
}

// 名称缺失在开发期告警：ScreenTip 是 title 的替代品，没有名称就没有提示内容
watch(
  () => props.title,
  (value) => {
    if (import.meta.env?.DEV && !value) {
      console.warn('[et-screen-tip] 缺少 title：富提示必须有名称（title 为必填 prop）')
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  clearDismissTimer()
  releaseTip(self)
})

defineExpose({
  /** 发起显示（走单例 + 延迟契约；不是裸转发——裸转发会绕过二者） */
  show: () => requestShow(),
  /** 收起（走自动隐藏延时） */
  hide: () => dismiss(),
  /** 位置刷新：直通 EbTooltip */
  update: () => tipRef.value?.update(),
})
</script>

<style src="./style.css"></style>
