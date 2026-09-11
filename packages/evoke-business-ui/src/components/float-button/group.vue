<template>
  <div
    ref="groupRef"
    class="eb-float-button-group eb-float-button-group"
    :class="[
      `is-${positionType}`,
      `eb-float-button-group--${direction}`,
      { 'is-open': opened },
    ]"
    :style="positionStyle"
  >
    <!-- 展开的子按钮区 -->
    <Transition name="eb-float-list">
      <div
        v-if="trigger && opened"
        class="eb-float-button-group__list"
        :class="[`eb-float-button-group__list--${direction}`]"
      >
        <slot />
      </div>
    </Transition>
    <!-- 无触发器：平铺子按钮 -->
    <div v-if="!trigger" class="eb-float-button-group__list" :class="[`eb-float-button-group__list--${direction}`]">
      <slot />
    </div>

    <!-- 触发主按钮 -->
    <div v-if="trigger" class="eb-float-button-group__trigger">
      <slot name="trigger">
        <eb-button
          :type="type"
          :circle="shape === 'circle'"
          :icon="opened ? closeIcon : trigger"
          @click="toggle"
        />
      </slot>
    </div>
  </div>
</template>

<script setup>
/**
 * EbFloatButtonGroup — 悬浮按钮组
 *
 * - trigger（图标名）传入后为主按钮展开/收起形态：点击主按钮弹出子按钮，
 *   点击外部 / Esc 自动收起，主按钮图标旋转过渡
 * - direction：展开方向 up / down（默认 up，适配右下角/右上角布置）
 * - position + position-type：fixed（默认，相对视口）/ absolute（相对最近定位父级，
 *   文档示例容器即用此形态）
 */
import { computed, onBeforeUnmount, ref, watchEffect } from 'vue'
import { useClickOutside } from '../../composables/useClickOutside'
import EbButton from '../button/index.vue'

defineOptions({ name: 'EbFloatButtonGroup' })

const props = defineProps({
  /** 展开触发图标名（不传则平铺展示子按钮） */
  trigger: { type: String, default: '' },
  /** 展开后的收起图标名 */
  closeIcon: { type: String, default: 'close' },
  /** 主按钮语义色 */
  type: { type: String, default: 'primary' },
  /** 子按钮形态 */
  shape: { type: String, default: 'circle' },
  /** 展开方向：up（主按钮在下方）/ down（主按钮在上方） */
  direction: { type: String, default: 'up' },
  /** 统一定位：{ top/right/bottom/left }，值为 px 数字或任意 CSS 值 */
  position: { type: Object, default: null },
  /** 定位方式：fixed（相对视口）/ absolute（相对最近定位父级） */
  positionType: { type: String, default: 'fixed' },
})

const opened = ref(false)
const groupRef = ref(null)

function toggle() {
  opened.value = !opened.value
}
function close() {
  opened.value = false
}

// 点击组外部 / Esc 收起（仅 trigger 模式且展开时启用）
useClickOutside(groupRef, close, true)
watchEffect(() => {
  if (!inBrowserOrSkip()) return
  if (opened.value) {
    document.addEventListener('keydown', onKeydown)
  } else {
    document.removeEventListener('keydown', onKeydown)
  }
})
function inBrowserOrSkip() {
  return typeof document !== 'undefined'
}
function onKeydown(e) {
  if (e.key === 'Escape') close()
}
onBeforeUnmount(() => {
  if (inBrowserOrSkip()) document.removeEventListener('keydown', onKeydown)
})

const positionStyle = computed(() => {
  if (!props.position) return undefined
  const style = { position: props.positionType }
  for (const key of ['top', 'right', 'bottom', 'left']) {
    const v = props.position[key]
    if (v != null) style[key] = typeof v === 'number' ? `${v}px` : v
  }
  return style
})

defineExpose({ toggle, close, open: () => { opened.value = true } })
</script>

<style src="./group.css"></style>
