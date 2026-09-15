<template>
  <eb-drawer :model-value="modelValue" :title="t('settings.title')" direction="rtl" size="320px" @update:model-value="emit('update:modelValue', $event)">
    <div class="adm-settings">
      <!-- 布局模式 -->
      <section class="adm-settings__section">
        <h4 class="adm-settings__label">{{ t('settings.layout') }}</h4>
        <div class="adm-layouts">
          <button
            v-for="mode in LAYOUT_MODES"
            :key="mode"
            type="button"
            class="adm-layouts__card"
            :class="{ 'is-active': layoutMode === mode }"
            @click="layoutMode = mode"
          >
            <span class="adm-layouts__diagram" :class="`is-${mode}`">
              <i v-if="diagram(mode).top" class="d-top" />
              <i v-if="diagram(mode).aside1" class="d-side" />
              <i v-if="diagram(mode).aside2" class="d-side d-side2" />
              <i class="d-main" />
            </span>
            <span class="adm-layouts__name">{{ t(`settings.layouts.${mode}`) }}</span>
          </button>
        </div>
      </section>

      <!-- 主题色 -->
      <section class="adm-settings__section">
        <h4 class="adm-settings__label">{{ t('settings.theme') }}</h4>
        <div class="adm-theme">
          <button
            v-for="preset in THEME_PRESETS"
            :key="preset.value"
            type="button"
            class="adm-theme__swatch"
            :class="{ 'is-active': primary === preset.value }"
            :style="{ backgroundColor: preset.value }"
            :title="preset.name"
            @click="applyPreset(preset.value)"
          />
          <label class="adm-theme__custom" :style="{ backgroundColor: primary || 'var(--eb-color-primary)' }">
            <input type="color" :value="primary || '#175dff'" @input="applyPreset($event.target.value)" />
          </label>
        </div>
        <p class="adm-settings__tip">{{ t('settings.themeTip') }}</p>
      </section>

      <!-- 明暗 -->
      <section class="adm-settings__section adm-settings__row">
        <span>{{ t('settings.darkMode') }}</span>
        <eb-switch v-model="darkOn" />
        <span class="adm-settings__dim">{{ isDark ? t('settings.dark') : t('settings.light') }}</span>
      </section>

      <!-- 语言 -->
      <section class="adm-settings__section adm-settings__row">
        <span>{{ t('settings.language') }}</span>
        <eb-segmented
          :model-value="locale"
          :options="[{ label: '中文', value: 'zh-CN' }, { label: 'English', value: 'en-US' }]"
          @update:model-value="locale = $event"
        />
      </section>

      <!-- 密度 -->
      <section class="adm-settings__section adm-settings__row">
        <span>{{ t('settings.density') }}</span>
        <eb-segmented
          :model-value="density"
          :options="[
            { label: t('settings.densityCompact'), value: 'compact' },
            { label: t('settings.densityDefault'), value: 'default' },
            { label: t('settings.densityLoose'), value: 'loose' },
          ]"
          @update:model-value="applyDensity($event)"
        />
      </section>

      <div class="adm-settings__foot">
        <eb-button size="small" @click="resetAll">{{ t('settings.reset') }}</eb-button>
      </div>
    </div>
  </eb-drawer>
</template>

<script setup>
/**
 * 主题定制抽屉：5 种布局模式实时切换 / 主色预设与自定义（整条色阶实时生成）/ 明暗 / 语言 / 密度
 */
import { ref } from 'vue'
import { setDensity } from '@wil-works/evoke-business-ui'
import { LAYOUT_MODES, THEME_PRESETS, useSettings } from '../settings'

const props = defineProps({ modelValue: { type: Boolean, default: false } })
const emit = defineEmits(['update:modelValue'])

const { t, layoutMode, locale, isDark, toggleDark, primary, applyPreset, resetAll } = useSettings()

// 明暗：开关直接绑 isDark ref（useDarkMode 内部 watchEffect 应用 html.dark）
const darkOn = isDark

// 密度：本地 ref 跟随 setDensity（html[data-eb-density]）
const density = ref('default')
function applyDensity(mode) {
  density.value = mode
  setDensity(mode)
}

// 布局示意图的三段结构：top 顶栏 / aside1 一级侧栏 / aside2 二级侧栏
function diagram(mode) {
  switch (mode) {
    case 'sidebar':
      return { top: false, aside1: true, aside2: false }
    case 'double-sidebar':
      return { top: false, aside1: true, aside2: true }
    case 'top-nav':
      return { top: true, aside1: false, aside2: false }
    case 'mixed':
      return { top: true, aside1: true, aside2: false }
    default:
      return { top: true, aside1: true, aside2: true }
  }
}
</script>
