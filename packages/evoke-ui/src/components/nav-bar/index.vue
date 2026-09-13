<template>
  <div
    :class="['ev-nav-bar', { 'is-bordered': bordered, 'is-glass': glass === true, 'no-glass': glass === false }]"
    :style="glassVars"
  >
    <div v-if="fixed && placeholder" class="ev-nav-bar__placeholder" aria-hidden="true" />
    <header
      :class="['ev-nav-bar__inner', { 'is-fixed': fixed }]"
      :style="fixed ? { zIndex } : undefined"
    >
      <div class="ev-nav-bar__side is-left" @click="emit('click-left')">
        <slot name="left">
          <EvIcon v-if="leftArrow" name="arrow-left" :size="18" />
          <span v-if="leftText" class="ev-nav-bar__text">{{ leftText }}</span>
        </slot>
      </div>
      <div class="ev-nav-bar__title">
        <slot name="title">{{ title }}</slot>
      </div>
      <div class="ev-nav-bar__side is-right" @click="emit('click-right')">
        <slot name="right">
          <span v-if="rightText" class="ev-nav-bar__text">{{ rightText }}</span>
        </slot>
      </div>
    </header>
  </div>
</template>

<script setup>
/**
 * EvNavBar — 移动端页头（返回 + 标题 + 右侧动作）
 * H5 页面的标准头部：左区返回箭头/文案、居中标题（超长省略）、右区动作；
 * fixed 吸顶时自动吸收 env(safe-area-inset-top)（刘海屏独立 PWA 生效，普通浏览器为 0），
 * 配 placeholder 生成等高占位避免内容顶到头下。区别于桌面站点的 EvNavbar。
 * 前台库零外部依赖：无滚动锁定与层级计数，固定层级默认压在弹层之下。
 */
import { computed } from 'vue'
import EvIcon from '../icon/index.vue'

defineOptions({ name: 'EvNavBar' })

const props = defineProps({
  /** 标题文本（title 插槽可替换） */
  title: { type: String, default: '' },
  /** 左区文案（常配「返回」），left 插槽可替换 */
  leftText: { type: String, default: '' },
  /** 右区文案，right 插槽可替换 */
  rightText: { type: String, default: '' },
  /** 左区显示返回箭头 */
  leftArrow: { type: Boolean, default: false },
  /** 固定在视口顶部（演示壳/transform 容器内表现为吸容器顶） */
  fixed: { type: Boolean, default: false },
  /** fixed 时渲染等高占位，避免后续内容被头部遮挡 */
  placeholder: { type: Boolean, default: false },
  /** 底部描边 */
  bordered: { type: Boolean, default: true },
  /** fixed 时的层级（默认压在弹层之下） */
  zIndex: { type: Number, default: 900 },
  /** 磨砂玻璃页头：true 强制开 / false 强制关 / 缺省跟随全局（ConfigProvider 的 glass） */
  glass: { type: Boolean, default: undefined },
  /** 磨砂强度（px），内联覆盖 --ev-glass-blur；缺省跟随令牌 */
  blur: { type: [Number, String], default: undefined },
})

const emit = defineEmits(['click-left', 'click-right'])

// 组件级磨砂强度：内联覆盖 --ev-glass-blur，缺省不产出内联样式（跟随令牌）
const glassVars = computed(() => {
  if (props.blur === undefined || props.blur === null || props.blur === '') return undefined
  return { '--ev-glass-blur': typeof props.blur === 'number' ? `${props.blur}px` : props.blur }
})
</script>

<style src="./style.css"></style>
