<template>
  <div v-if="platform" class="platform-compat" :class="`is-${platform}`" role="note" :aria-label="label">
    <span v-if="platform !== 'mobile'" class="platform-compat__icon" :title="`${desktopLabel} · 桌面端`">
      <EvIcon name="desktop" :size="14" />
    </span>
    <span v-if="platform !== 'desktop'" class="platform-compat__icon" :title="`${mobileLabel} · 移动端`">
      <EvIcon name="smartphone" :size="14" />
    </span>
    <span class="platform-compat__text">{{ label }}</span>
  </div>
</template>

<script setup>
/**
 * PlatformCompat — 组件页顶部的平台兼容标识
 * 双端兼容：桌面 + 手机 双图标；仅桌面：只显示桌面图标；移动端专属：只显示手机图标。
 * 档位来自 platform-compat.mjs 注册表（按 relativePath 解析，无需逐页写 frontmatter）。
 */
import { computed } from 'vue'
import { useData } from 'vitepress'
import { resolvePlatform } from './platform-compat.mjs'

const LABELS = {
  both: '双端兼容 · 桌面 + 移动',
  desktop: '仅桌面端保证样式',
  mobile: '移动端专属组件',
}

const { page } = useData()
const platform = computed(() => resolvePlatform(page.value.relativePath))
const label = computed(() => LABELS[platform.value] || '')
const desktopLabel = computed(() => (platform.value === 'both' ? '双端兼容' : '仅桌面端'))
const mobileLabel = computed(() => (platform.value === 'both' ? '双端兼容' : '移动端专属'))
</script>

<style scoped>
.platform-compat {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
  padding: 4px 10px;
  border: 1px solid var(--ev-border-color-light);
  border-radius: var(--ev-radius-full);
  background: var(--ev-bg-soft);
}

.platform-compat__icon {
  display: inline-flex;
  align-items: center;
}

.platform-compat__icon :deep(svg) {
  display: block;
}

.platform-compat__text {
  font-size: 12px;
  line-height: 1;
  color: var(--ev-text-secondary);
}

.is-both .platform-compat__icon {
  color: var(--ev-color-primary);
}

.is-desktop .platform-compat__icon {
  color: var(--ev-text-secondary);
}

.is-mobile .platform-compat__icon {
  color: var(--ev-color-primary);
}
</style>
