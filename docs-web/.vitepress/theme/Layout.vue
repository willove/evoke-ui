<script setup>
/**
 * Layout — 在默认主题布局上注入插槽，抹平首页与文档内页的观感差异：
 * 导航栏品牌区（名称 + v0.1.0）与动作区（主题切换 / GitHub / 下载）复刻首页 EwNavbar
 */
import DefaultTheme from 'vitepress/theme'
import PlatformCompat from './PlatformCompat.vue'

const { Layout } = DefaultTheme
</script>

<template>
  <Layout>
    <template #doc-before>
      <PlatformCompat />
    </template>
    <template #nav-bar-title-after>
      <EwTag size="small" style="margin-left: 10px;">v0.1.0</EwTag>
    </template>
    <template #nav-bar-content-after>
      <span class="home-nav-actions">
        <EwThemeToggle />
        <EwIconButton icon="github" aria-label="GitHub" />
        <EwButton
          size="small"
          variant="soft"
          icon="download"
          href="/guide/getting-started"
        >下载</EwButton>
      </span>
    </template>
    <template #nav-screen-content-after>
      <span class="home-nav-screen-actions">
        <EwThemeToggle />
        <EwIconButton icon="github" aria-label="GitHub" />
        <EwButton size="small" variant="soft" icon="download" href="/guide/getting-started">下载</EwButton>
      </span>
    </template>
  </Layout>
</template>

<style>
.home-nav-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
  padding-left: 8px;
}
@media (max-width: 959px) {
  .home-nav-actions {
    display: none;
  }
}
.home-nav-screen-actions {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px 0;
}
</style>
