# EtSelect · 工具界面选择器

底座 `EbSelect` 的密度适配包装：size 缺省时按当前密度档映射，其余全透传。

<script setup>
import { ref } from 'vue'
const size = ref(12)
const options = [
  { value: 12, label: '12' },
  { value: 14, label: '14' },
  { value: 16, label: '16' },
]
</script>

<DemoBlock densities>
  <et-select v-model="size" :options="options" size="small" />
</DemoBlock>

<p class="demo-readout">字号 <code>{{ size }}</code></p>

## API

<CompApi id="select" />

## 行为

- 密度映射：`compact → small`、`default → ''`、`relaxed → large`；同文件导出 `mapDensityToSelectSize(density)` 供单测。
- 未挂 EtProvider 时 `useDensity()` 回落 `'default'`。
- 暴露 `focus()` / `blur()` / `toggleDropdown()` / `clearSelection()` / `updateDropdown()`。
- 控件高 24/32/40 对齐 Fluent UI 的 small/medium/large 阶梯，不发明新档位。

## 令牌与门禁

- 密度覆盖写在全局 `.eb-select__dropdown` 上（与 EtDropdown 同因：底座浮层经 Teleport 渲染）。
- G1 / G7：密度由容器负责，不改底座组件内部。
