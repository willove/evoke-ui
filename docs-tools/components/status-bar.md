# EtStatusBar · 状态栏

chrome 底带：可配置项 + 内置缩放工具位，高度钉死不换行。

<script setup>
import { ref } from 'vue'
const zoom = ref(100)
const last = ref('')
const items = [
  { key: 'ready', label: '就绪' },
  { key: 'selection', label: '选区', value: 'A1:B14', visible: true },
  { key: 'coedit', label: '协同', value: '3 人' },
]
</script>

<DemoBlock densities>
  <et-status-bar :items="items" :zoom="`${zoom}%`" @item-click="last = $event" />
</DemoBlock>

<div class="demo-row">
  <et-tool-button v-for="z in [80, 100, 150]" :key="z" size="small" icon="zoom-in" :label="`${z}%`" :active="zoom === z" @click="zoom = z" />
  <span class="demo-readout">最近点击 <code>{{ last || '—' }}</code></span>
</div>

## API

<CompApi id="status-bar" />

## 行为

- 条目是原生 `button` 包壳 + `aria-label` 组合可访问名（`label` + `value`），可键盘聚焦。
- **读数带是 polite 活区**：条目 `value` 与内置缩放显示各挂 `aria-live="polite"`，值变了读屏跟得上；
  `label` 不是活区（静态名重复播报是噪声）。
- 点击同时走 `item-click` 事件与数据里的 `onClick`；两种接法等价，别同时用（会调两次）。
- 坏条目（非对象）直接跳过不渲染；`visible` 缺省 true。
- 高度钉死 `--et-chrome-statusbar-height`，overflow 隐藏兜底，禁换行禁撑高：左区弹性压缩 + 条目省略号，放不下先切左区条目。
- `zoom` 数字原样显示，带 `%` 等形态由产品传字符串自决。

## 令牌与门禁

- `--et-chrome-statusbar-height`（24px）、`--et-statusbar-item-gap`（12px）。
- G7：chrome 预算不变量，装配出口「无页面级横向溢出」同源。
