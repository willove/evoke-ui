# Slider 滑块

<script setup>
import { ref } from 'vue'

const s = ref(30)
const s2 = ref(4)
const range = ref([20, 60])
</script>


在数值区间内拖动手柄取值，支持单值与区间（range）双手柄、垂直布局、步进挡点、marks 刻度与数值输入框联动。拖动结束提交 update:modelValue 与 change，拖动过程中实时触发 input；区间模式两手柄互相不越过。手柄获得焦点后支持方向键步进、PageUp / PageDown 大步调整、Home / End 跳到最小最大值。

## 基础用法

`v-model` 绑定数值；`range` 开启区间双手柄模式（此时绑定值为 [start, end] 数组）；`disabled` 禁用拖拽与键盘。

<DemoBlock>
  <eb-slider v-model="s" style="width: 320px;" />
  <eb-slider v-model="range" range style="width: 320px; margin-top: 16px;" />
  <eb-slider :model-value="30" disabled style="width: 320px; margin-top: 16px;" />
</DemoBlock>

## 取值联动

绑定值可实时展示在任意自定义内容中；下方文本随拖动同步。

<DemoBlock>
  <eb-slider v-model="s" style="width: 320px;" />
  <div style="margin-top: 8px;">当前值：{{ s }}，区间值：{{ range[0] }} - {{ range[1] }}</div>
</DemoBlock>

## 取值范围与步长

`min` / `max` 限定范围，`step` 为步长（可为小数），取值会自动吸附到步进挡位。

<DemoBlock>
  <eb-slider v-model="s2" :min="0" :max="10" :step="0.5" show-stops style="width: 320px;" />
  <div style="margin-top: 8px;">当前值：{{ s2 }}</div>
</DemoBlock>

## 步进挡点与刻度

`show-stops` 按步长显示挡点，`marks` 在轨道上标注刻度文本（key 为数值，值可为文本或 `{ label, style }`），`format-tooltip` 自定义悬停气泡文案。

<DemoBlock>
  <eb-slider
    :model-value="40"
    :step="10"
    :max="90"
    show-stops
    :marks="{ 0: '0°C', 45: '45°C', 90: '90°C' }"
    :format-tooltip="(v) => v + '°C'"
    style="width: 440px; padding-top: 16px; margin-top: 12px;"
  />
</DemoBlock>

## 气泡显示

`show-tooltip` 关闭后拖动与悬停均不出现气泡，适合与 marks 或外部数值展示搭配。

<DemoBlock>
  <eb-slider :model-value="60" :show-tooltip="false" style="width: 320px;" />
</DemoBlock>

## 垂直模式与数值输入

`vertical` 切换为垂直滑块（需同时指定 `height`）；`show-input` 在水平单值模式下联动一个数字输入框，`show-input-controls` 可去掉增减按钮，`input-size` 控制输入框尺寸。

<DemoBlock>
  <eb-slider vertical height="180px" :model-value="40" style="margin-left: 20px;" />
  <eb-slider :model-value="30" show-input style="width: 420px;" />
  <eb-slider :model-value="50" show-input :show-input-controls="false" style="width: 420px; margin-top: 16px;" />
</DemoBlock>

## API

<ApiTable title="Slider Props" :rows="[
  { name: 'v-model', desc: '绑定值，range 时为 [start, end]', type: 'number | array', default: '0' },
  { name: 'min / max', desc: '取值范围', type: 'number', default: '0 / 100' },
  { name: 'step', desc: '步长（可为小数），取值吸附到步进挡位', type: 'number', default: '1' },
  { name: 'range', desc: '区间模式（双手柄，绑定值为数组，两手柄互不越过）', type: 'boolean', default: 'false' },
  { name: 'vertical', desc: '垂直模式', type: 'boolean', default: 'false' },
  { name: 'height', desc: '垂直模式轨道高度（如 200px）', type: 'string', default: '' },
  { name: 'disabled', desc: '禁用拖拽 / 点击 / 键盘', type: 'boolean', default: 'false' },
  { name: 'showTooltip', desc: '拖拽/悬停时显示气泡', type: 'boolean', default: 'true' },
  { name: 'formatTooltip', desc: '气泡文案格式化', type: '(value) => string', default: '—' },
  { name: 'showInput', desc: '显示数值输入框（仅水平单值模式）', type: 'boolean', default: 'false' },
  { name: 'showInputControls', desc: '输入框增减按钮', type: 'boolean', default: 'true' },
  { name: 'inputSize', desc: '输入框尺寸', type: 'string', default: 'small' },
  { name: 'showStops', desc: '显示步进挡点（不含首尾）', type: 'boolean', default: 'false' },
  { name: 'marks', desc: '刻度标记，key 为位置值，值可为文本或 { label, style }', type: 'object', default: 'null' },
  { name: 'label / ariaLabel', desc: '无障碍标签', type: 'string', default: '' },
  { name: 'debounce', desc: '防抖间隔（预留，当前实现未使用）', type: 'number', default: '300' },
]" />

<ApiTable title="Events" :rows="[
  { name: 'update:modelValue', desc: '值提交（拖拽结束、键盘调整、输入框确认）', type: '(value) => void', default: '—' },
  { name: 'input', desc: '拖拽/键盘过程中实时触发', type: '(value) => void', default: '—' },
  { name: 'change', desc: '与 update:modelValue 同步触发', type: '(value) => void', default: '—' },
]" />

<ApiTable title="Methods" :rows="[
  { name: 'focus', desc: '聚焦当前激活手柄', type: '() => void', default: '—' },
  { name: 'blur', desc: '激活手柄失焦', type: '() => void', default: '—' },
]" />
