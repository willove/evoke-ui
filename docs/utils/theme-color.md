# 主题与颜色

运行时主题工具：主色切换、色阶生成、颜色解析混合。全部从包根导出：

```js
import { setPrimaryColor, generatePrimaryRamp, mixHex } from '@wil-works/evoke-business-ui'
```

## setPrimaryColor — 运行时主色

传入十六进制主色，立即重写 `--eb-color-primary` 及 7 档色阶（`--eb-color-primary-light-N` / `dark-2`），图表色板（Chart 系列）同步跟随。**无需刷新页面**：

<DemoBlock>
  <div style="display: flex; gap: 16px; align-items: center; flex-wrap: wrap;">
    <eb-button
      v-for="c in ['#175DFF', '#0FA968', '#D4380D', '#7B2FF2']"
      :key="c"
      :type="current === c ? 'primary' : 'default'"
      @click="apply(c)"
    >{{ c }}</eb-button>
    <eb-input v-model="custom" style="width: 140px;" placeholder="#RRGGBB"></eb-input>
    <eb-button @click="apply(custom)">应用</eb-button>
    <eb-button text @click="apply('#175DFF')">恢复默认</eb-button>
    <eb-button type="primary">主色按钮（随切换变化）</eb-button>
    <eb-switch v-model="switchOn"></eb-switch>
  </div>
</DemoBlock>

::: warning 全局副作用
`setPrimaryColor` / `setDensity` 作用于 `documentElement`，影响整页。组件树内推荐用 [ConfigProvider](/components/config-provider) 的 `theme-color` / `density` 属性声明式下发。
:::

## generatePrimaryRamp — 色阶生成

由主色派生全部 7 档梯度令牌（`dark-2`、`base`、`light-3/5/7/8/9`，sRGB 线性混合：light-N 向白混合 N×10%，dark-2 向黑混合 20%），与 `variables.css` 手调梯度同一算法。**点击上方主色，下方梯度实时重算**：

<DemoBlock>
  <div style="display: flex; flex-direction: column; gap: 8px;">
    <div style="display: flex; gap: 4px; flex-wrap: wrap;">
      <div
        v-for="(c, i) in ramp"
        :key="i"
        :style="{ width: '88px', height: '40px', background: c, borderRadius: '6px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontSize: '10px', color: '#fff', paddingBottom: '2px' }"
      >{{ rampLabels[i] }}</div>
    </div>
    <div style="font-size: 12px; color: var(--eb-text-color-secondary);">generatePrimaryRamp('{{ current }}') 的输出（dark-2 → light-9），与页面当前主色一致</div>
  </div>
</DemoBlock>

## 颜色解析与混合

`normalizeHex` / `hexToRgb` / `rgbToHex` / `mixHex` 四件套，容错输入、不抛错：

<DemoBlock>
  <div style="display: flex; flex-direction: column; gap: 6px; font-size: 13px; font-family: monospace;">
    <div>normalizeHex('#3b82f6') → '{{ c1 }}'</div>
    <div>hexToRgb('#3b82f6') → {{ c2 }}</div>
    <div>mixHex('#3b82f6', '#ffffff', 0.5) → '{{ c3 }}'（50% 向白混合）</div>
    <div>normalizeHex('oops') → '{{ c4 }}'（非法返回 null）</div>
  </div>
</DemoBlock>

## 密度与头像色

`setDensity` 作用于 `html[data-eb-density]`，切换**整页所有按钮/输入框的高度**：default 32px → compact 28px → loose 36px（循环），按钮上实时显示当前档位与控件高度：

<DemoBlock>
  <div style="display: flex; gap: 16px; align-items: center; flex-wrap: wrap;">
    <eb-button type="primary" @click="toggleDensity">切换全局密度：{{ density }}（控件 {{ sizePx }}px）</eb-button>
    <div style="display: flex; gap: 8px;">
      <div
        v-for="name in ['张伟', '王芳', '李娜', '系统']"
        :key="name"
        :style="{ width: '32px', height: '32px', borderRadius: '50%', background: avatarColor(name), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px' }"
      >{{ name[0] }}</div>
    </div>
    <span style="font-size: 12px; color: var(--eb-text-color-secondary);">avatarColor(字符串) 稳定映射头像底色</span>
  </div>
</DemoBlock>

<script setup>
import {
  setPrimaryColor,
  getDensity,
  setDensity,
  generatePrimaryRamp,
  normalizeHex,
  hexToRgb,
  mixHex,
  avatarColor,
} from '@wil-works/evoke-business-ui'

import { ref, computed, onBeforeUnmount } from 'vue'

const current = ref('#175DFF')
const custom = ref('')
const switchOn = ref(true)

// 密度档位用 ref 持有（getDensity() 非响应式，直接在模板调用不会触发重渲染）
const DENSITY_ORDER = ['default', 'compact', 'loose']
const DENSITY_PX = { default: 32, compact: 28, loose: 36 }
const density = ref(getDensity())
const sizePx = computed(() => DENSITY_PX[density.value] ?? 32)
function toggleDensity() {
  const next = DENSITY_ORDER[(DENSITY_ORDER.indexOf(density.value) + 1) % DENSITY_ORDER.length]
  setDensity(next)
  density.value = getDensity()
}
// 离开页面恢复默认密度，不把演示副作用带给后续浏览
onBeforeUnmount(() => setDensity('default'))

function apply(color) {
  const normalized = normalizeHex(color)
  if (!normalized) return
  current.value = normalized
  setPrimaryColor(normalized)
}

const rampLabels = ['dark-2', 'base', 'light-3', 'light-5', 'light-7', 'light-8', 'light-9']
const rampOrder = [
  '--eb-color-primary-dark-2',
  '--eb-color-primary',
  '--eb-color-primary-light-3',
  '--eb-color-primary-light-5',
  '--eb-color-primary-light-7',
  '--eb-color-primary-light-8',
  '--eb-color-primary-light-9',
]
// 跟随当前主色实时重算（current 由上方 setPrimaryColor 演示驱动）
const ramp = computed(() => {
  const record = generatePrimaryRamp(current.value) || {}
  return rampOrder.map((k) => record[k])
})

const c1 = normalizeHex('#3b82f6')
const c2 = JSON.stringify(hexToRgb('#3b82f6'))
const c3 = mixHex('#3b82f6', '#ffffff', 0.5)
const c4 = String(normalizeHex('oops'))
</script>

## API

| 函数 | 类型 | 说明 |
| --- | --- | --- |
| setPrimaryColor | `(hex: string, target?: HTMLElement) => void` | 重写主色与色阶 CSS 变量；默认作用于 documentElement |
| generatePrimaryRamp | `(hex: string) => Record<string, string> \| null` | 返回 `{ '--eb-color-primary': …, '-light-3': …, '-rgb': 'r, g, b' }` 令牌表 |
| normalizeHex | `(hex: unknown) => string \| null` | 容错归一化为 `#RRGGBB`；非法返回 null |
| hexToRgb | `(hex: string) => { r, g, b } \| null` | — |
| rgbToHex | `(r, g, b) => string` | — |
| mixHex | `(a, b, t: number) => string \| null` | t=0 返回 a，t=1 返回 b |
| setDensity / getDensity | `(mode) => void` / `() => string` | `html[data-eb-density]` |
| avatarColor | `(str: string) => string` | 字符串哈希 → 稳定色值 |
