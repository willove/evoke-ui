# Tabs 标签页

`EvTabs` 提供两种轻量页签形态：`capsule` 分段胶囊（灰轨道 + 弹性滑块）适合视图切换
（如定价的月付/年付），`underline` 下划线适合内容页签。胶囊滑块以 spring 曲线平滑跟随
激活项；内容切换由消费方根据 `v-model` 自行渲染。不绑定 `v-model` 时组件自持状态
（`default-value` 定初值），复制标签即可交互。支持键盘操作：页签聚焦后用 ←/→ 移动
激活项（自动跳过禁用项、首尾环绕），Home/End 跳到首/尾。

## 基础用法

<DemoBlock title="capsule 分段胶囊" description="v-model 驱动切换，点击任意项滑块即时跟随；下方实时显示当前值。">

<div style="display:flex; flex-direction:column; gap:16px; align-items:flex-start;">
  <EvTabs
    v-model="billing"
    :items="[{ label: '月付', value: 'm' }, { label: '年付', value: 'y' }, { label: '买断', value: 'b' }]"
    @change="onBillingChange"
  />
  <p style="margin:0; font-size:13px; color:var(--ev-text-secondary);">
    当前周期：<strong style="color:var(--ev-color-primary);">{{ billing }}</strong>
    <span v-if="billingLog">（最近一次切换：{{ billingLog }}）</span>
  </p>
  <EvTabs v-model="range" size="small" :items="[{ label: '近 7 天', value: 'w' }, { label: '近 30 天', value: 'mo' }]" />
</div>

```vue
<script setup>
import { ref } from 'vue'
const billing = ref('m')
</script>

<template>
  <EvTabs
    v-model="billing"
    :items="[{ label: '月付', value: 'm' }, { label: '年付', value: 'y' }]"
    @change="onBillingChange"
  />
</template>
```

</DemoBlock>

## 下划线变体

<DemoBlock title="underline" description="内容页签形态，活动项着主色下划线；disabled 项保持安静不可点。">

<EvTabs
  v-model="tab"
  variant="underline"
  :items="[
    { label: '概述', value: 'a', icon: 'compass-3-line' },
    { label: '规格', value: 'b' },
    { label: '评价', value: 'c', disabled: true },
  ]"
/>

```vue
<EvTabs v-model="tab" variant="underline" :items="tabItems" />
```

</DemoBlock>

## API

### Props

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| v-model | 当前值 | string / number | `''` |
| default-value | 非受控模式的初始值（未绑定 v-model 时生效） | string / number | — |
| items | 页签项 `[{ label, value, icon?, disabled? }]` | array | `[]` |
| variant | 形态 | `'capsule' \| 'underline'` | `'capsule'` |
| size | 尺寸 | `'small' \| 'default' \| 'large'` | `'default'` |

### 事件

| 事件 | 说明 | 参数 |
| --- | --- | --- |
| update:modelValue | 切换时派发 | value |
| change | 切换时派发 | value |

<script setup>
import { ref } from 'vue'
const billing = ref('m')
const billingLog = ref('')
const range = ref('w')
const tab = ref('a')

function onBillingChange(v) {
  billingLog.value = `change 事件 → ${v}`
}
</script>
