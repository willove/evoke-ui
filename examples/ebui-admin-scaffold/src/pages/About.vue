<template>
  <div class="page-card page">
    <h3 class="about-title">{{ t('pages.about') }}</h3>
    <p class="about-intro">{{ t('about.intro') }}</p>

    <h4 class="about-sub">{{ t('about.features') }}</h4>
    <ul class="about-list">
      <li v-for="(item, i) in t('about.featureList')" :key="i">
        <eb-icon name="check" :size="14" class="about-check" />
        {{ item }}
      </li>
    </ul>

    <h4 class="about-sub">{{ t('about.stack') }}</h4>
    <div class="about-stack">
      <eb-tag v-for="item in stack" :key="item" size="small">{{ item }}</eb-tag>
    </div>
  </div>
</template>

<script setup>
import { useSettings } from '../settings'

const { t } = useSettings()
const stack = [
  'Vue 3.5',
  'Vite 8',
  'vue-router 4',
  '@wil-works/evoke-business-ui 0.6.0',
  '@wil-works/evoke-charts 0.6.0',
  'pnpm workspace',
]
</script>

<style scoped>
.about-title {
  margin: 0 0 var(--eb-space-3);
  font-size: var(--eb-font-size-lg);
}
.about-intro {
  margin: 0 0 var(--eb-space-4);
  color: var(--eb-text-color-secondary);
  line-height: 1.8;
}
.about-sub {
  margin: 0 0 var(--eb-space-2);
  font-size: var(--eb-font-size-md);
}
.about-list {
  margin: 0 0 var(--eb-space-4);
  padding: 0;
  list-style: none;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: var(--eb-space-2);
}
.about-list li {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--eb-text-color-regular);
  font-size: var(--eb-font-size-sm);
}
.about-check {
  color: var(--eb-color-success);
  flex-shrink: 0;
}
.about-stack {
  display: flex;
  flex-wrap: wrap;
  gap: var(--eb-space-2);
}
</style>
