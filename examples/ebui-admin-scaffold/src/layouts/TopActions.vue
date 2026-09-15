<template>
  <div class="adm-actions">
    <!-- 全局搜索（Ctrl / ⌘ + K） -->
    <button type="button" class="adm-actions__search" @click="$emit('search')">
      <eb-icon name="search" :size="15" />
      <span class="adm-actions__search-text">{{ t('bar.search') }}</span>
      <kbd class="adm-actions__kbd">⌘K</kbd>
    </button>

    <!-- 通知中心（EbNotify Toast 历史） -->
    <eb-popover placement="bottom-end" :width="300" :title="t('bar.notice')" trigger="click">
      <template #reference>
        <button type="button" class="adm-actions__icon-btn" :aria-label="t('bar.notice')">
          <eb-icon name="notification" :size="17" />
          <span v-if="notices.length" class="adm-actions__badge">{{ notices.length }}</span>
        </button>
      </template>
      <div class="adm-notice">
        <div v-if="!notices.length" class="adm-notice__empty">{{ t('bar.noNotice') }}</div>
        <div v-else class="adm-notice__list">
          <div v-for="item in notices" :key="item.id" class="adm-notice__item">
            <span class="adm-notice__dot" :class="`is-${item.type}`" />
            <div class="adm-notice__body">
              <p class="adm-notice__title">{{ item.title }}</p>
              <p v-if="item.message" class="adm-notice__msg">{{ item.message }}</p>
            </div>
            <span class="adm-notice__time">{{ item.time }}</span>
          </div>
        </div>
        <div v-if="notices.length" class="adm-notice__foot">
          <eb-button text size="small" @click="clearNotices">{{ t('bar.clearNotice') }}</eb-button>
        </div>
      </div>
    </eb-popover>

    <!-- 中英切换 -->
    <button type="button" class="adm-actions__icon-btn" :title="t('bar.language')" @click="toggleLocale">
      <eb-icon name="translate" :size="17" />
      <span class="adm-actions__lang">{{ isZh ? 'EN' : '中' }}</span>
    </button>

    <!-- 明暗切换 -->
    <button
      type="button"
      class="adm-actions__icon-btn"
      :title="t('bar.dark')"
      :aria-label="t('bar.dark')"
      @click="toggleDark"
    >
      <eb-icon :name="isDark ? 'sunny' : 'moon'" :size="17" />
    </button>

    <!-- 主题定制 -->
    <button type="button" class="adm-actions__icon-btn" :title="t('bar.theme')" @click="$emit('settings')">
      <eb-icon name="palette" :size="17" />
    </button>

    <span class="adm-actions__avatar">{{ isZh ? '管' : 'A' }}</span>
  </div>
</template>

<script setup>
/**
 * 顶栏动作区：全局搜索入口 / 通知中心（Toast 历史）/ 语言切换 / 明暗切换 / 主题定制 / 用户
 */
import { useSettings } from '../settings'

const { t, notices, clearNotices, toggleLocale, isZh, isDark, toggleDark } = useSettings()

defineEmits(['search', 'settings'])
</script>
