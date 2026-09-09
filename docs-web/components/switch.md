# Switch 开关

`EwSwitch` 表达二元状态（开/关），用于设置项、演示面板与筛选条件。滑块带平滑位移动效，
开启态着主色；提供三种尺寸与禁用态。不绑定 `v-model` 时组件自持状态（`default-value` 定初值），
复制标签即可交互。

## 基础用法

<DemoBlock title="设置项中的开关" description="与文字标签组合时建议用 label 包裹，扩大可点击区域；change 事件实时回显。">

<div style="display:flex; align-items:center; gap:24px; flex-wrap:wrap;">
  <label style="display:inline-flex; align-items:center; gap:8px; font-size:13px; color:var(--ew-text-regular);">
    <EwSwitch v-model="sync" @change="onChange" /> 自动同步
  </label>
  <label style="display:inline-flex; align-items:center; gap:8px; font-size:13px; color:var(--ew-text-regular);">
    <EwSwitch v-model="publicHome" @change="onChange" /> 公开主页
  </label>
  <span style="font-size:13px; color:var(--ew-text-secondary);">
    同步：{{ sync ? '开' : '关' }} · 主页：{{ publicHome ? '开' : '关' }}
    <template v-if="switchLog">（{{ switchLog }}）</template>
  </span>
</div>

```vue
<script setup>
import { ref } from 'vue'
const sync = ref(true)
</script>

<template>
  <label style="display:inline-flex; align-items:center; gap:8px;">
    <EwSwitch v-model="sync" @change="onChange" /> 自动同步
  </label>
</template>
```

</DemoBlock>

## 尺寸与禁用

<DemoBlock title="small / default / large / disabled" description="各开关均可点击（禁用态除外），独立自持状态。">

<div style="display:flex; align-items:center; gap:16px;">
  <EwSwitch size="small" :default-value="true" />
  <EwSwitch :default-value="true" />
  <EwSwitch size="large" />
  <EwSwitch disabled :default-value="true" />
</div>

```vue
<EwSwitch size="small" :default-value="true" />
<EwSwitch v-model="a" />
<EwSwitch size="large" v-model="b" />
<EwSwitch disabled v-model="c" />
```

</DemoBlock>

## API

### Props

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| v-model | 状态 | boolean | `false` |
| default-value | 非受控模式的初始状态（未绑定 v-model 时生效） | boolean | `false` |
| disabled | 禁用 | boolean | `false` |
| size | 尺寸 | `'small' \| 'default' \| 'large'` | `'default'` |

### 事件

| 事件 | 说明 | 参数 |
| --- | --- | --- |
| update:modelValue | 切换时派发 | boolean |
| change | 切换时派发 | boolean |

<script setup>
import { ref } from 'vue'
const sync = ref(true)
const publicHome = ref(false)
const switchLog = ref('')

function onChange(v) {
  switchLog.value = `change 事件 → ${v ? '开' : '关'}`
}
</script>
