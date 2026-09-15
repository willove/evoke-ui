<template>
  <eb-config-provider :locale="libLocale">
    <AdminLayout />
  </eb-config-provider>
</template>

<script setup>
/**
 * 根组件：ConfigProvider 注入库内文案 locale（跟随脚手架语言实时切换，
 * 分页 / 空态 / 弹层等库内文案同步中英），AdminLayout 承载全部壳层能力。
 * 设置为模块级单例（src/settings.js），无需 provide/inject 装配。
 */
import { computed } from 'vue'
import { zhCN, en } from '@wil-works/evoke-business-ui/src/locale/index.js'
import AdminLayout from './layouts/AdminLayout.vue'
import { useSettings } from './settings'

const { locale } = useSettings()
const libLocale = computed(() => (locale.value === 'en-US' ? en : zhCN))
</script>
