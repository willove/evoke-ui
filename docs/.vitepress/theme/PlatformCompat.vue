<template>
  <div v-if="platform" class="plat-compat" :class="`is-${platform}`" role="note" :aria-label="label">
    <span v-if="platform !== 'mobile'" class="plat-compat__icon" :title="`${desktopLabel} · 桌面端`">
      <Icon name="monitor" :size="14" />
    </span>
    <span v-if="platform !== 'desktop'" class="plat-compat__icon" :title="`${mobileLabel} · 移动端`">
      <Icon name="smartphone" :size="14" />
    </span>
    <span class="plat-compat__text">{{ label }}</span>
  </div>
</template>

<script setup>
/**
 * PlatformCompat — 组件页顶部的平台兼容标识
 * 双端兼容：电脑 + 手机 双图标；仅桌面：只显示电脑图标；移动端专属：只显示手机图标。
 * 档位来自 platform-compat.mjs 注册表（按路由解析，无需逐页写 frontmatter）。
 */
import { computed } from 'vue'
import { useRoute } from 'vitepress'
import Icon from './Icon.vue'
import { resolvePlatform } from './platform-compat.mjs'

const LABELS = {
  both: '双端兼容 · 桌面 + 移动',
  desktop: '仅桌面端保证样式',
  mobile: '移动端专属组件',
}

const route = useRoute()
const platform = computed(() => resolvePlatform(route.path))
const label = computed(() => LABELS[platform.value] || '')
const desktopLabel = computed(() => (platform.value === 'both' ? '双端兼容' : '仅桌面端'))
const mobileLabel = computed(() => (platform.value === 'both' ? '双端兼容' : '移动端专属'))
</script>

<style scoped>
.plat-compat {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding: 4px 12px;
  border: 1px solid var(--eb-border-color-light);
  border-radius: var(--eb-radius-full);
  background: var(--eb-bg-color-page);
}

.plat-compat__icon {
  display: inline-flex;
  align-items: center;
}

.plat-compat__text {
  font-size: 12px;
  line-height: 1;
  color: var(--eb-text-color-secondary);
}

.is-both .plat-compat__icon,
.is-mobile .plat-compat__icon {
  color: var(--eb-color-primary);
}

.is-desktop .plat-compat__icon {
  color: var(--eb-text-secondary);
}
</style>
