# Segmented 分段控制

分段选择器：互斥选项的轻量切换控件，常用于视图切换（列表/卡片）、时间范围（今日/本周/本月）。滑块带位移过渡动画；支持 v-model 受控与无 v-model 的非受控使用。

## 基础用法

<DemoBlock>
  <ev-space size="middle" direction="column">
    <ev-segmented v-model="view" :options="['列表', '卡片', '看板']" />
    <ev-text size="small" type="info">当前视图：{{ view }}</ev-text>
  </ev-space>
</DemoBlock>

## 尺寸与圆角

<DemoBlock>
  <ev-space size="middle" direction="column">
    <ev-segmented v-model="s1" :options="['今日', '本周', '本月']" size="small" />
    <ev-segmented v-model="s2" :options="['今日', '本周', '本月']" size="middle" />
    <ev-segmented v-model="s3" :options="['今日', '本周', '本月']" size="large" />
    <ev-segmented v-model="s4" :options="['开启', '关闭']" shape="round" />
  </ev-space>
</DemoBlock>

## 对象选项与禁用项

options 支持 `{ label, value, disabled, icon }` 对象形态：

<DemoBlock>
  <ev-segmented v-model="mode" :options="segmentOptions" />
  <p style="margin-top: 8px; font-size: 12px; color: var(--ev-text-color-secondary);">当前模式：{{ mode }}（「历史」为禁用项）</p>
</DemoBlock>

## 块级铺满

<DemoBlock>
  <ev-segmented v-model="range" :options="['今日', '本周', '本月', '本年']" block />
</DemoBlock>

<script setup>
import { ref } from 'vue'
const view = ref('列表')
const s1 = ref('今日')
const s2 = ref('今日')
const s3 = ref('今日')
const s4 = ref('开启')
const mode = ref('实时')
const range = ref('今日')
const segmentOptions = [
  { label: '实时', value: '实时', icon: 'dashboard' },
  { label: '日报', value: '日报' },
  { label: '历史', value: '历史', disabled: true },
]
</script>

## Segmented API

| 名称 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| modelValue | String / Number | — | 选中值（v-model）；不传时组件内部维护选中态 |
| options | Array | `[]` | 纯值数组或 `{ label, value, disabled, icon }` |
| size | String | `middle` | large / middle / small |
| shape | String | `default` | default / round |
| block | Boolean | `false` | 铺满父容器宽度 |
| vertical | Boolean | `false` | 垂直排布 |
| disabled | Boolean | `false` | 整体禁用 |

事件：`change(value)`。
