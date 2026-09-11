<template>
  <div :class="['eb-nav-bar', { 'is-bordered': bordered }]">
    <div v-if="fixed && placeholder" class="eb-nav-bar__placeholder" aria-hidden="true" />
    <header
      :class="['eb-nav-bar__inner', { 'is-fixed': fixed }]"
      :style="fixed ? { zIndex } : undefined"
    >
      <div class="eb-nav-bar__side is-left" @click="emit('click-left')">
        <slot name="left">
          <EbIcon v-if="leftArrow" name="arrow-left" :size="18" />
          <span v-if="leftText" class="eb-nav-bar__text">{{ leftText }}</span>
        </slot>
      </div>
      <div class="eb-nav-bar__title">
        <slot name="title">{{ title }}</slot>
      </div>
      <div class="eb-nav-bar__side is-right" @click="emit('click-right')">
        <slot name="right">
          <span v-if="rightText" class="eb-nav-bar__text">{{ rightText }}</span>
        </slot>
      </div>
    </header>
  </div>
</template>

<script setup>
/**
 * EbNavBar — 移动端页头（返回 + 标题 + 右侧动作）
 * H5 页面的标准头部：左区返回箭头/文案、居中标题（超长省略）、右区动作；
 * fixed 吸顶时自动吸收 env(safe-area-inset-top)（刘海屏独立 PWA 生效，普通浏览器为 0），
 * 配 placeholder 生成等高占位避免内容顶到头下。API 对齐通用移动端导航栏。
 */
import EbIcon from '../icon/index.vue'

defineOptions({ name: 'EbNavBar' })

defineProps({
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
})

const emit = defineEmits(['click-left', 'click-right'])
</script>

<style src="./style.css"></style>
