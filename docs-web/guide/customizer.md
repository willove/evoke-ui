# 主题定制器

整库的**颜色 / 圆角 / 间距 / 容器宽**全部由 `--ew-*` 令牌驱动，可在运行时调整并即时生效。下面的控件修改的是**整个文档站的真实主题**——切主色后注意观察按钮、链接、选中态与侧栏高亮。

<script setup>
import { ref } from 'vue'
import { useThemeConfig } from '../../packages/evoke-ui/src/composables/useThemeConfig'
import { useTheme } from '../../packages/evoke-ui/src/composables/useTheme'
import { EW_COLOR_PRESETS, EW_PALETTE_PRESETS, EW_RADIUS_PRESETS, EW_SPACE_PRESETS, EW_CONTAINER_PRESETS, EW_STYLE_PRESETS } from '../../packages/evoke-ui/src/presets'

const { config, setPrimary, setSemantic, setRadius, setSpace, setContainer, applyPreset, reset } = useThemeConfig()
const { isDark, toggleTheme } = useTheme()

const palettes = EW_PALETTE_PRESETS
const activePalette = ref('classic')

/** 点色卡：主色与整套语义色（success/warning/danger/info）随色系联动 */
function pickPaletteColor(color) {
  setPrimary(color)
  setSemantic(palettes[activePalette.value].semantic)
}
const colorSwatches = Object.entries(EW_COLOR_PRESETS).map(([key, v]) => ({ key, ...v }))
const stylePresets = Object.entries(EW_STYLE_PRESETS).map(([key, v]) => ({ key, ...v }))
const radiusItems = Object.entries(EW_RADIUS_PRESETS).map(([value, v]) => ({ label: v.label, value }))
const spaceItems = Object.entries(EW_SPACE_PRESETS).map(([value, v]) => ({ label: v.label, value }))
const containerItems = Object.entries(EW_CONTAINER_PRESETS).map(([value, v]) => ({ label: v.label, value }))
</script>

## 风格方案

<DemoBlock title="按站点类型一键定制" description="每套方案是一整套 主色/圆角/间距/容器宽 的组合，点击即刻套用到整个文档站 —— 再用下面的单项微调。">

<div class="preset-row">
  <button
    v-for="p in stylePresets"
    :key="p.key"
    class="preset-card"
    :class="{ 'is-active': config.primary === p.config.primary }"
    @click="applyPreset(p.key)"
  >
    <span class="preset-card__dot" :style="{ background: p.config.primary }" />
    <span class="preset-card__name">{{ p.label }}</span>
    <span class="preset-card__desc">{{ p.description }}</span>
  </button>
</div>

</DemoBlock>

## 主色与色系

<DemoBlock title="色系 × 主色 × 语义色" description="先挑一个气质相近的色系，再点色卡换主色 —— success / warning / danger / info 整套语义色随色系联动；淡色阶由主色自动生成，暗色模式自动换档。">

<div class="pal-tabs" role="tablist">
  <button
    v-for="(p, key) in palettes"
    :key="key"
    class="pal-tab"
    :class="{ 'is-active': activePalette === key }"
    role="tab"
    :aria-selected="activePalette === key"
    @click="activePalette = key"
  >
    <span class="pal-tab__preview" aria-hidden="true">
      <i v-for="c in p.colors.slice(0, 3)" :key="c.value" :style="{ background: c.value }" />
    </span>
    <span class="pal-tab__name">{{ p.label }}</span>
  </button>
</div>

<p class="pal-desc">{{ palettes[activePalette].description }}</p>

<div class="pal-grid">
  <button
    v-for="c in palettes[activePalette].colors"
    :key="c.value"
    class="pal-card"
    :class="{ 'is-active': (config.primary || '').toLowerCase() === c.value.toLowerCase() }"
    :style="{ '--swatch': c.value }"
    @click="pickPaletteColor(c.value)"
  >
    <span class="pal-card__dot" />
    <span class="pal-card__name">{{ c.label }}</span>
    <span class="pal-card__value">{{ c.value }}</span>
  </button>
</div>

</DemoBlock>

## 形状与节奏

<DemoBlock title="圆角 / 间距 / 容器宽" description="三种档位直接改写对应的 --ew-* 令牌组，页面所有组件即时跟随。">

<div class="ctrl-grid">
  <div class="ctrl">
    <span class="ctrl__label">圆角</span>
    <EwTabs :items="radiusItems" :model-value="config.radius" @update:model-value="setRadius" />
  </div>
  <div class="ctrl">
    <span class="ctrl__label">间距</span>
    <EwTabs :items="spaceItems" :model-value="config.space" @update:model-value="setSpace" />
  </div>
  <div class="ctrl">
    <span class="ctrl__label">容器宽</span>
    <EwTabs :items="containerItems" :model-value="config.container" @update:model-value="setContainer" />
  </div>
  <div class="ctrl">
    <span class="ctrl__label">暗色</span>
    <EwSwitch :model-value="isDark" @update:model-value="toggleTheme" />
    <span class="ctrl__hint">当前 {{ isDark ? 'Dark' : 'Light' }}</span>
  </div>
</div>

<div style="margin-top:16px; display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
  <EwButton size="small" variant="outline" @click="reset">恢复默认主题</EwButton>
  <EwTag tone="primary" size="small" icon="check">当前主色 {{ config.primary || '默认 #0D70FF' }}</EwTag>
</div>

</DemoBlock>

## 实时预览

<DemoBlock title="同一套令牌驱动的一切" description="不同作用用不同的语义色：操作用主色、成功/警告/危险/信息各就其位 —— 切换上方色系后整排联动。">

<div style="display:flex; gap:12px; align-items:center; flex-wrap:wrap;">
  <EwButton pill>主按钮</EwButton>
  <EwButton variant="soft">Soft</EwButton>
  <EwButton variant="outline">Outline</EwButton>
  <EwTag tone="primary">主色</EwTag>
  <EwTag tone="success">成功</EwTag>
  <EwTag tone="warning">警告</EwTag>
  <EwTag tone="danger">危险</EwTag>
  <EwTag tone="info">信息</EwTag>
  <EwSwitch :model-value="true" />
</div>

<div style="display:flex; gap:12px; flex-wrap:wrap; margin-top:16px;">
  <EwAlert tone="success" title="发布成功" style="flex:1; min-width:220px;">内容已同步到线上。</EwAlert>
  <EwAlert tone="warning" title="名额有限" style="flex:1; min-width:220px;">早鸟价将于本周日截止。</EwAlert>
  <EwAlert tone="danger" title="支付失败" style="flex:1; min-width:220px;">请更换支付方式后重试。</EwAlert>
</div>

<EwCard tone="cream" sticker style="margin-top:16px; max-width:420px;">
  <h4 style="margin-bottom:6px;">卡片标题</h4>
  <p style="font-size:13px;">圆角、间距、主色与语义色跟随上方定制器。</p>
</EwCard>

</DemoBlock>

## 在你的站点里使用

```vue
<script setup>
import { EwConfigProvider } from '@wil-works/evoke-ui'
</script>

<template>
  <!-- 全局生效：主色 + 圆润档 + 宽松间距 + 宽容器 -->
  <EwConfigProvider
    primary="#7C5CFC"
    radius="round"
    space="loose"
    container="wide"
  >
    <SiteHome />
  </EwConfigProvider>
</template>
```

或者用组合式 API 在任意位置动态切换（如「设置」面板）：

```js
import { useThemeConfig } from '@wil-works/evoke-ui'

const { setPrimary, setRadius, setSpace, setContainer, applyPreset, reset } = useThemeConfig()
setPrimary('#0FA968')      // 淡色阶自动生成
setRadius('round')
setSemantic({ success: '#3E8E6B', warning: '#DFA32E', danger: '#D0492C', info: '#2F5D9E' })
                           // 语义色整套联动（配合色系预设 EW_PALETTE_PRESETS）
applyPreset('corporate')   // 一键套用「企业官网」风格方案
reset()                    // 恢复默认
```

`global: false` 时写入包裹元素而非 `:root`，可做**局部换肤**（如页面内一个演示区独立主题）。

<style>
.preset-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}
.preset-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  padding: 14px 16px;
  border: 1px solid var(--ew-border-color-light);
  border-radius: var(--ew-radius-lg);
  background: var(--ew-bg-container);
  text-align: left;
  cursor: pointer;
  transition: border-color .2s, box-shadow .2s, transform .2s;
}
.preset-card:hover { transform: translateY(-2px); box-shadow: var(--ew-shadow-2); }
.preset-card.is-active { border-color: var(--ew-color-primary); box-shadow: 0 0 0 2px rgba(var(--ew-color-primary-rgb), .18); }
.preset-card__dot { width: 14px; height: 14px; border-radius: 50%; margin-bottom: 4px; }
.preset-card__name { font-size: 14px; font-weight: 600; color: var(--ew-text-primary); }
.preset-card__desc { font-size: 12px; color: var(--ew-text-secondary); }
.pal-tabs { display: flex; flex-wrap: wrap; gap: 8px; }
.pal-tab {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 7px 12px; border: 1px solid var(--ew-border-color-light);
  border-radius: var(--ew-radius-full); background: var(--ew-bg-container);
  cursor: pointer; transition: border-color .2s, background-color .2s;
}
.pal-tab:hover { border-color: var(--ew-border-color); }
.pal-tab.is-active {
  border-color: var(--ew-color-primary);
  background: rgba(var(--ew-color-primary-rgb), .08);
}
.pal-tab__preview { display: inline-flex; }
.pal-tab__preview i {
  width: 10px; height: 10px; border-radius: 50%;
  margin-left: -3px; border: 1.5px solid var(--ew-bg-container);
}
.pal-tab__preview i:first-child { margin-left: 0; }
.pal-tab__name { font-size: 13px; color: var(--ew-text-primary); }
.pal-desc { margin: 12px 0 0; font-size: 13px; color: var(--ew-text-secondary); }
.pal-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(104px, 1fr));
  gap: 10px; margin-top: 14px;
}
.pal-card {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  padding: 14px 8px 12px; border: 1px solid var(--ew-border-color-light);
  border-radius: var(--ew-radius-md); background: var(--ew-bg-container);
  cursor: pointer; transition: border-color .2s, box-shadow .2s, transform .2s;
}
.pal-card:hover { transform: translateY(-2px); box-shadow: var(--ew-shadow-2); }
.pal-card.is-active {
  border-color: var(--swatch);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--swatch) 30%, transparent);
}
.pal-card__dot {
  width: 28px; height: 28px; border-radius: 50%;
  background: var(--swatch);
  box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.35);
}
.pal-card__name { font-size: 12.5px; color: var(--ew-text-primary); }
.pal-card__value { font-size: 11px; color: var(--ew-text-placeholder); text-transform: uppercase; }
.ctrl-grid { display: flex; flex-direction: column; gap: 12px; }
.ctrl { display: flex; align-items: center; gap: 16px; }
.ctrl__label { width: 56px; font-size: 13px; color: var(--ew-text-secondary); }
.ctrl__hint { font-size: 12px; color: var(--ew-text-placeholder); }
</style>
