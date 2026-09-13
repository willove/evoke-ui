# Slider 滑块

`EvSlider` 在小范围内选取数值：音量、透明度、磨砂强度这类连续参数。原生 range 之上的
受控封装，键盘方向键可调，导轨「已走过」的部分着主色；提供三种尺寸与禁用态。
不绑定 `v-model` 时组件自持状态（`default-value` 定初值），复制标签即可拖动。

## 基础用法

<DemoBlock title="绑定 v-model" description="拖动即派发 update:modelValue 与 change，数值实时回显；范围与步长用 min / max / step 控制。">

<div style="display:grid; gap:16px; max-width:420px;">
  <div>
    <EvSlider v-model="volume" :min="0" :max="100" @change="onSlide" />
    <p style="margin:6px 0 0; font-size:13px; color:var(--ev-text-secondary);">
      音量：{{ volume }} <template v-if="slideLog">（{{ slideLog }}）</template>
    </p>
  </div>
  <div>
    <EvSlider v-model="ratio" :min="0" :max="1" :step="0.05" />
    <p style="margin:6px 0 0; font-size:13px; color:var(--ev-text-secondary);">比例：{{ ratio.toFixed(2) }}</p>
  </div>
</div>

```vue
<script setup>
import { ref } from 'vue'
const volume = ref(30)
</script>

<template>
  <EvSlider v-model="volume" :min="0" :max="100" />
  <EvSlider v-model="ratio" :min="0" :max="1" :step="0.05" />
</template>
```

</DemoBlock>

## 尺寸与禁用

<DemoBlock title="small / default / large / disabled" description="各滑块均可拖动（禁用态除外），未绑定 v-model 时独立自持状态。">

<div style="display:grid; gap:14px; max-width:420px;">
  <EvSlider size="small" :default-value="20" />
  <EvSlider :default-value="45" />
  <EvSlider size="large" :default-value="70" />
  <EvSlider disabled :default-value="60" />
</div>

```vue
<EvSlider size="small" :default-value="20" />
<EvSlider :default-value="45" />
<EvSlider size="large" :default-value="70" />
<EvSlider disabled :default-value="60" />
```

</DemoBlock>

## API

### Props

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| v-model | 当前值 | number | `0` |
| default-value | 非受控模式的初始值（未绑定 v-model 时生效） | number | — |
| min | 最小值 | number | `0` |
| max | 最大值 | number | `100` |
| step | 步长 | number | `1` |
| disabled | 禁用 | boolean | `false` |
| size | 尺寸 | `'small' \| 'default' \| 'large'` | `'default'` |

### 事件

| 事件 | 说明 | 参数 |
| --- | --- | --- |
| update:modelValue | 拖动时持续派发 | number |
| change | 拖动时持续派发 | number |

`aria-label` 等原生属性会透传到内部 input 上（单独使用时建议补一个可读名称）。

初始值不必落在步长格点上：不在 `min + k·step` 上的值会就近吸附显示（如 `min=30`、
`step=5` 的 `72` 显示为 `70`），圆钮与导轨填充始终一致；拖动派发的一律是格点值。

<script setup>
import { ref } from 'vue'
const volume = ref(30)
const ratio = ref(0.5)
const slideLog = ref('')

function onSlide(v) {
  slideLog.value = `change 事件 → ${v}`
}
</script>
