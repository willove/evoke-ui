<template>
  <EwIconButton
    :icon="isDark ? 'sun' : 'moon'"
    :variant="variant"
    :size="size"
    :round="round"
    :aria-label="isDark ? '切换到浅色模式' : '切换到深色模式'"
    @click="toggleTheme"
  />
</template>

<script setup>
/**
 * EwThemeToggle — 明暗主题切换按钮
 * 基于 useTheme（html.dark 驱动暗色令牌重映射），日/月图标随状态切换
 */
import EwIconButton from '../icon-button/index.vue'
import { useTheme } from '../../composables/useTheme'

defineProps({
  variant: { type: String, default: 'ghost' },
  size: { type: String, default: 'default' },
  round: { type: Boolean, default: false },
})

const { isDark, toggleTheme } = useTheme()
</script>
