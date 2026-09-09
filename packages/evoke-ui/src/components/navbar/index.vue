<template>
  <header
    ref="navRef"
    :class="[
      'ew-navbar',
      {
        'is-sticky': sticky,
        'is-scrolled': isScrolled && sticky,
        'is-blur': blur && sticky,
        'is-hidden': hidden && sticky,
      },
    ]"
  >
    <div class="ew-navbar__inner ew-container">
      <div class="ew-navbar__left">
        <slot name="logo">
          <a v-if="logo" href="/" class="ew-navbar__logo">
            <EwIcon v-if="logoIcon" :name="logoIcon" :size="22" />
            <img v-else-if="logoImage" :src="logoImage" alt="logo" class="ew-navbar__logo-img" />
            <span v-if="logoText" class="ew-navbar__logo-text">{{ logoText }}</span>
          </a>
        </slot>
        <slot name="start" />
      </div>

      <nav v-if="items.length || $slots.center" class="ew-navbar__nav" aria-label="主导航">
        <slot name="center">
          <component
            :is="item.href ? 'a' : 'span'"
            v-for="item in items"
            :key="item.label"
            :href="item.href"
            :target="item.target"
            class="ew-navbar__link"
            :class="{ 'is-active': isActive(item) }"
          >
            {{ item.label }}
          </component>
        </slot>
      </nav>

      <div class="ew-navbar__actions">
        <slot name="actions" />
        <!-- 移动端菜单开关 -->
        <EwIconButton
          v-if="items.length || $slots.default"
          class="ew-navbar__burger"
          icon="menu"
          aria-label="打开菜单"
          @click="menuOpen = !menuOpen"
        />
      </div>
    </div>

    <!-- 移动端下拉菜单 -->
    <Transition name="ew-navbar-collapse">
      <nav v-if="menuOpen && ($slots.default || items.length)" class="ew-navbar__mobile" aria-label="移动端导航">
        <slot />
        <component
          :is="item.href ? 'a' : 'span'"
          v-for="item in items"
          :key="item.label"
          :href="item.href"
          :target="item.target"
          class="ew-navbar__mobile-link"
          @click="menuOpen = false"
        >
          {{ item.label }}
        </component>
      </nav>
    </Transition>
  </header>
</template>

<script setup>
/**
 * EwNavbar — 站点导航
 * sticky 吸顶 + 滚动后加边框投影；blur 追加背景磨砂
 * hideOnScroll 开启后：下滑隐藏、上滑浮现（长页面的沉浸式阅读）
 * items [{ label, href, target }]；插槽 logo / start / center / actions / default(移动端)
 */
import { ref, onMounted, onBeforeUnmount } from 'vue'
import EwIcon from '../icon/index.vue'
import EwIconButton from '../icon-button/index.vue'

const props = defineProps({
  /** 吸顶 */
  sticky: { type: Boolean, default: true },
  /** 滚动后背景磨砂 */
  blur: { type: Boolean, default: true },
  /** 下滑隐藏、上滑浮现 */
  hideOnScroll: { type: Boolean, default: false },
  /** 导航项 [{ label, href, target, active }] */
  items: { type: Array, default: () => [] },
  logo: { type: Boolean, default: true },
  logoIcon: { type: String, default: undefined },
  logoImage: { type: String, default: undefined },
  logoText: { type: String, default: '' },
  /** 当前激活项（匹配 items 的 label 或 href） */
  active: { type: String, default: '' },
})

const navRef = ref(null)
const isScrolled = ref(false)
const menuOpen = ref(false)
const hidden = ref(false)
let lastY = 0

function isActive(item) {
  if (item.active != null) return !!item.active
  if (!props.active) return false
  return item.label === props.active || item.href === props.active
}

function onScroll() {
  const y = window.scrollY || 0
  isScrolled.value = y > 8
  if (props.hideOnScroll) {
    // 顶部区域内不隐藏；方向翻转时切换
    if (y < 120) hidden.value = false
    else if (y > lastY + 2) hidden.value = true
    else if (y < lastY - 2) hidden.value = false
  }
  lastY = y
}

onMounted(() => {
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
})

defineExpose({ ref: navRef })
</script>

<style src="./style.css"></style>
