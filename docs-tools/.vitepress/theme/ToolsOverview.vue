<template>
  <div class="tools-overview">
    <p class="tools-overview__lead">{{ layer.desc }}</p>

    <section v-for="group in groups" :key="group.key" class="tools-overview__cat">
      <h2 class="tools-overview__cat-title">
        {{ group.category.zh }}
        <span class="tools-overview__cat-key">{{ group.category.key }}</span>
      </h2>
      <p class="tools-overview__cat-desc">{{ group.category.desc }}</p>
      <div class="tools-overview__grid">
        <a v-for="c in group.components" :key="c.id" class="tools-card" :href="`/components/${c.id}`">
          <div class="tools-card__top">
            <strong class="tools-card__name">{{ c.zh }}</strong>
            <span class="tools-card__gran">{{ granLabel(c.granularity) }}</span>
          </div>
          <code class="tools-card__id">{{ c.id }}</code>
          <p class="tools-card__summary">{{ c.summary }}</p>
        </a>
      </div>
    </section>

    <p class="tools-overview__foot">
      装配用法见<a href="/guide/getting-started">快速开始</a>，
      完整可跑的整页装配见<a href="/examples/">案例</a>。
    </p>
  </div>
</template>

<script setup>
/**
 * 两层概览页（/common/ 与 /office/）—— 由包内 taxonomy 派生，不手写清单。
 * 新增组件时只改 packages/evoke-tools-ui/src/taxonomy.js，本页自动跟着变。
 */
import { computed } from 'vue'
import { LAYERS, GRANULARITIES, groupedByCategory } from '../../../packages/evoke-tools-ui/src/taxonomy.js'

const props = defineProps({
  /** common | office */
  layer: { type: String, required: true },
})

const layer = computed(() => LAYERS[props.layer])
const groups = computed(() => groupedByCategory(props.layer))
const granLabel = (key) => GRANULARITIES[key]?.zh ?? key
</script>

<style scoped>
.tools-overview__lead {
  margin: 0 0 8px;
  font-size: 14px;
  line-height: 1.8;
  color: var(--td-text-secondary);
}
.tools-overview__cat {
  margin: 34px 0 0;
}
.tools-overview__cat-title {
  margin: 0 0 4px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--td-border-light);
  font-size: 18px;
  font-weight: 600;
  color: var(--td-text);
}
.tools-overview__cat-key {
  margin-left: 8px;
  font-size: 11px;
  font-weight: 500;
  font-family: var(--td-mono);
  color: var(--td-text-tertiary);
}
.tools-overview__cat-desc {
  margin: 8px 0 14px;
  font-size: 13px;
  color: var(--td-text-secondary);
}
.tools-overview__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
}
.tools-card {
  display: block;
  padding: 14px 16px 12px;
  border: 1px solid var(--td-border);
  border-radius: 10px;
  background: var(--td-bg);
  text-decoration: none;
  transition: border-color 0.15s;
}
.tools-card:hover {
  border-color: var(--td-primary);
}
.tools-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.tools-card__name {
  font-size: 14px;
  color: var(--td-text);
}
.tools-card__gran {
  flex-shrink: 0;
  padding: 1px 7px;
  border-radius: 999px;
  background: var(--td-primary-bg);
  font-size: 11px;
  color: var(--td-primary);
}
.tools-card__id {
  display: block;
  margin: 6px 0 8px;
  font-family: var(--td-mono);
  font-size: 11.5px;
  color: var(--td-text-tertiary);
}
.tools-card__summary {
  margin: 0;
  font-size: 12.5px;
  line-height: 1.7;
  color: var(--td-text-secondary);
}
.tools-overview__foot {
  margin: 34px 0 0;
  font-size: 13px;
  color: var(--td-text-secondary);
}
.tools-overview__foot a {
  color: var(--td-primary);
}
</style>