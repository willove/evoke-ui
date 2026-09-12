<template>
  <div class="cz-wrap">
    <eb-config-provider
      :theme-color="primary"
      :semantic="semantic"
      :density="density"
      :glass="glassOn"
    >
      <div class="cz-panel">
        <div class="cz-row">
          <span class="cz-label">主色</span>
          <button
            v-for="p in EB_THEME_PRESETS"
            :key="p.value"
            type="button"
            class="cz-swatch"
            :class="{ 'is-active': primary === p.value }"
            :title="p.name"
            :style="{ background: p.value }"
            @click="primary = p.value"
          ></button>
          <input v-model="primary" class="cz-hex" type="text" spellcheck="false" />
          <input v-model="primary" type="color" class="cz-picker" />
        </div>

        <div class="cz-row">
          <span class="cz-label">语义色</span>
          <span v-for="(hex, key) in semantic" :key="key" class="cz-semantic">
            <button
              type="button"
              class="cz-swatch"
              :style="{ background: hex }"
              :title="`${key}（点击换色）`"
              @click="cycleSemantic(key)"
            ></button>
            <span class="cz-semantic-key">{{ key }}</span>
          </span>
        </div>

        <div class="cz-row">
          <span class="cz-label">图表配色</span>
          <button
            v-for="p in CHART_PALETTES"
            :key="p.name"
            type="button"
            class="cz-palette"
            :class="{ 'is-active': chartPalette === p.name }"
            :title="`数据色板：${p.name}`"
            @click="applyChartPalette(p)"
          >
            <span v-for="(c, i) in p.colors.slice(0, 5)" :key="i" class="cz-palette__chip" :style="{ background: c }"></span>
            <span class="cz-palette__name">{{ p.name }}</span>
          </button>
        </div>

        <div class="cz-row">
          <span class="cz-label">密度</span>
          <button
            v-for="d in ['compact', 'default', 'loose']"
            :key="d"
            type="button"
            class="cz-seg"
            :class="{ 'is-active': density === d }"
            @click="density = d"
          >{{ d }}</button>
          <eb-switch v-model="glassOn" active-text="磨砂" class="cz-glass"></eb-switch>
        </div>

        <div class="cz-preview">
          <div class="cz-preview__row">
            <eb-button type="primary">主要操作</eb-button>
            <eb-button>次要操作</eb-button>
            <eb-button type="success">成功</eb-button>
            <eb-button type="warning">警告</eb-button>
            <eb-button type="danger">危险</eb-button>
          </div>
          <div class="cz-preview__row">
            <eb-tag type="primary">primary</eb-tag>
            <eb-tag type="success">success</eb-tag>
            <eb-tag type="warning">warning</eb-tag>
            <eb-tag type="danger">danger</eb-tag>
            <eb-tag type="info">info</eb-tag>
          </div>
          <div class="cz-preview__row">
            <eb-alert type="success" title="同步完成">3 个数据源已接入。</eb-alert>
            <eb-alert type="warning" title="额度提醒">本月同步量已用 82%。</eb-alert>
          </div>
          <div class="cz-preview__row">
            <eb-input placeholder="输入框：聚焦看主色光环" class="cz-input"></eb-input>
            <eb-switch v-model="on"></eb-switch>
            <eb-progress :percentage="62" class="cz-progress"></eb-progress>
          </div>
          <div class="cz-preview__row">
            <eb-chart
              :options="chartPreview"
              :height="180"
              style="max-width: 460px;"
            ></eb-chart>
          </div>
        </div>
      </div>
    </eb-config-provider>

    <h2 class="cz-h2">等效配置代码</h2>
    <p class="cz-p">
      上面每一步调整都会同步生成对应的声明式配置，复制到应用根组件即可获得同样的主题。
      组件卸载时会自动移除注入的令牌回到默认主题；需要跨刷新保留用户选择，加
      <code>persist-theme</code>（存档将优先于声明式配置）。
    </p>
    <pre class="cz-code"><code>{{ codeSnippet }}</code></pre>
  </div>
</template>

<script setup>
/**
 * ThemeCustomizer — 主题定制器（/guide/customizer）
 * 主色 / 语义色 / 密度 / 磨砂实时定制 + 组件预览 + 等效配置代码生成。
 * 独立 SFC：复杂交互演示不走 markdown 内联，规避 md HTML 块解析限制。
 */
import { ref, computed } from 'vue'
import { EB_THEME_PRESETS, setSeriesPalette, clearSeriesPalette } from '@wil-works/evoke-business-ui'

const primary = ref('#175dff')
const semantic = ref({
  success: '#16a34a',
  warning: '#d97706',
  danger: '#dc2626',
  info: '#0e7490',
})
const density = ref('default')
const glassOn = ref(false)
const on = ref(true)

/** 图表数据色板预设（--ev-color-series-1..8，契约与工具来自 evoke-charts） */
const CHART_PALETTES = [
  {
    name: '品牌蓝',
    colors: ['#175DFF', '#5AD8A6', '#F6BD16', '#6DC8EC', '#E8684A', '#9270CA', '#FF9D4D', '#5D7092'],
  },
  {
    name: '青碧',
    colors: ['#12A5A0', '#4D8BFF', '#67C23A', '#F6BD16', '#9270CA', '#E8684A', '#6DC8EC', '#5D7092'],
  },
  {
    name: '暖阳',
    colors: ['#F0852B', '#E8684A', '#F6BD16', '#D9539B', '#9270CA', '#12A5A0', '#5D7092', '#6DC8EC'],
  },
  {
    name: '石墨',
    colors: ['#175DFF', '#6C8CFF', '#98B4FF', '#46557A', '#93A5C8', '#2E4470', '#B9C8E8', '#748199'],
  },
]
const chartPalette = ref('品牌蓝')

function applyChartPalette(p) {
  chartPalette.value = p.name
  setSeriesPalette(p.colors)
}

/** 色板预览图：当前预设的前四个系列 */
const chartPreview = {
  type: 'bar',
  labels: ['一季度', '二季度', '三季度', '四季度'],
  series: [
    { name: '系列一', data: [120, 132, 101, 134] },
    { name: '系列二', data: [80, 92, 91, 94] },
    { name: '系列三', data: [60, 72, 81, 84] },
    { name: '系列四', data: [40, 52, 61, 54] },
  ],
  legend: { show: true },
}

const SEMANTIC_PALETTES = {
  success: ['#16a34a', '#0d9488', '#65a30d', '#059669'],
  warning: ['#d97706', '#f08c00', '#ca8a04', '#eab308'],
  danger: ['#dc2626', '#e64980', '#c2410c', '#f5222d'],
  info: ['#0e7490', '#7b2ff2', '#175dff', '#64748b'],
}

function cycleSemantic(key) {
  const list = SEMANTIC_PALETTES[key]
  const next = list[(list.indexOf(semantic.value[key]) + 1) % list.length]
  semantic.value = { ...semantic.value, [key]: next }
}

const codeSnippet = computed(() => {
  const semanticJson = JSON.stringify(semantic.value)
  const preset = CHART_PALETTES.find((p) => p.name === chartPalette.value)
  const seriesJson = JSON.stringify(preset.colors)
  const lines = [
    '<eb-config-provider',
    `  theme-color="${primary.value}"`,
    `  :semantic='${semanticJson}'`,
    `  :series='${seriesJson}'`,
    `  density="${density.value}"`,
  ]
  if (glassOn.value) lines.push('  glass')
  lines.push('>', '  <router-view />', '</eb-config-provider>')
  return lines.join('\n')
})
</script>

<style scoped>
.cz-wrap {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.cz-panel {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 20px;
  border: 1px solid var(--bd-border-light, var(--eb-border-color-light));
  border-radius: 12px;
}
.cz-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}
.cz-label {
  min-width: 48px;
  font-size: 13px;
  color: var(--bd-text-secondary, var(--eb-text-color-secondary));
}
.cz-swatch {
  width: 30px;
  height: 30px;
  padding: 0;
  border: 2px solid transparent;
  border-radius: 8px;
  cursor: pointer;
}
.cz-swatch.is-active {
  border-color: var(--bd-text, #1f2329);
}
.cz-hex {
  width: 96px;
  padding: 5px 10px;
  border: 1px solid var(--bd-border-light, var(--eb-border-color-light));
  border-radius: 6px;
  background: transparent;
  font-family: var(--bd-mono, monospace);
  font-size: 12px;
  color: inherit;
}
.cz-picker {
  width: 34px;
  height: 30px;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
}
.cz-semantic {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.cz-palette {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 5px 10px;
  border: 1px solid var(--bd-border-light, var(--eb-border-color-light));
  border-radius: 999px;
  background: transparent;
  cursor: pointer;
}
.cz-palette.is-active {
  border-color: var(--eb-color-primary);
}
.cz-palette__chip {
  width: 10px;
  height: 10px;
  border-radius: 3px;
}
.cz-palette__name {
  margin-left: 4px;
  font-size: 12px;
  color: var(--bd-text-secondary, var(--eb-text-color-secondary));
}
.cz-semantic-key {
  font-size: 12px;
  color: var(--bd-text-tertiary, var(--eb-text-color-secondary));
}
.cz-seg {
  padding: 5px 14px;
  border: 1px solid var(--bd-border-light, var(--eb-border-color-light));
  border-radius: 999px;
  background: transparent;
  cursor: pointer;
  font-size: 12px;
  color: inherit;
}
.cz-seg.is-active {
  background: var(--eb-color-primary);
  border-color: var(--eb-color-primary);
  color: #fff;
}
.cz-glass {
  margin-left: 16px;
}
.cz-preview {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px;
  border: 1px dashed var(--bd-border-light, var(--eb-border-color-light));
  border-radius: 10px;
}
.cz-preview__row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}
.cz-preview__row .eb-alert {
  min-width: 260px;
}
.cz-input {
  max-width: 280px;
}
.cz-progress {
  max-width: 220px;
}
.cz-h2 {
  margin: 8px 0 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--bd-text, var(--eb-text-color-primary));
}
.cz-p {
  margin: 0;
  font-size: 14px;
  line-height: 1.8;
  color: var(--bd-text-secondary, var(--eb-text-color-secondary));
}
.cz-p code,
.cz-wrap code {
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--bd-bg-secondary, var(--eb-fill-color-light));
  font-size: 12px;
  color: var(--eb-color-primary);
}
.cz-code {
  margin: 0;
  padding: 16px 18px;
  overflow-x: auto;
  border-radius: 10px;
  background: var(--bd-bg-secondary, var(--eb-fill-color-light));
  border: 1px solid var(--bd-border-light, var(--eb-border-color-light));
  font-size: 13px;
  line-height: 1.7;
  white-space: pre-wrap;
  color: var(--bd-text, var(--eb-text-color-primary));
}
</style>
