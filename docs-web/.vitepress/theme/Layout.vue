<script setup>
/**
 * Layout — 在默认主题布局上注入插槽，抹平首页与文档内页的观感差异：
 * 导航栏品牌区（名称 + 当前版本标签）与动作区（主题切换 / GitHub / 下载）复刻首页 EvNavbar
 */
import DefaultTheme from 'vitepress/theme'
import PlatformCompat from './PlatformCompat.vue'

const { Layout } = DefaultTheme
</script>

<template>
  <Layout>
    <template #layout-top>
      <div class="dev-warn-banner dev-warn-banner--fixed">
        <span class="dev-warn-banner__full">项目正在快速迭代中，API 与视觉细节可能随版本调整，<strong>请勿用于生产环境</strong>。</span>
        <span class="dev-warn-banner__short">开发迭代中，<strong>请勿用于生产环境</strong>。</span>
      </div>
    </template>
    <template #doc-before>
      <PlatformCompat />
    </template>
    <template #nav-bar-title-after>
      <EvTag size="small" style="margin-left: 10px;">v0.12.0</EvTag>
    </template>
    <template #nav-bar-content-after>
      <span class="home-nav-actions">
        <EvThemeToggle />
        <EvIconButton icon="github" aria-label="GitHub" />
        <EvButton
          size="small"
          variant="soft"
          icon="download"
          href="/guide/getting-started"
        >下载</EvButton>
      </span>
    </template>
    <template #nav-screen-content-after>
      <span class="home-nav-screen-actions">
        <EvThemeToggle />
        <EvIconButton icon="github" aria-label="GitHub" />
        <EvButton size="small" variant="soft" icon="download" href="/guide/getting-started">下载</EvButton>
      </span>
    </template>
  </Layout>
</template>

<style>
/* 顶部开发中警示横幅样式在 custom.css（首页 layout:false 也复用同一套） */
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
