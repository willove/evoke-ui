# ColorPicker 颜色选择器

取色器：饱和度/色相面板 + 预设色板，支持透明度通道；主题定制后台的常用输入件。

## 基础用法

<DemoBlock>
  <eb-space wrap>
    <eb-color-picker v-model="color" />
    <eb-text size="small" type="info">当前值：{{ color || '未选择' }}</eb-text>
  </eb-space>
</DemoBlock>

## 预设色板与透明度

`predefine` 提供快捷色块；`show-alpha` 开启透明通道（绑定值变为 rgba）：

<DemoBlock>
  <eb-space wrap>
    <eb-color-picker v-model="preset" :predefine="predefine" />
    <eb-color-picker v-model="alpha" show-alpha />
    <eb-text size="small" type="info">透明通道值：{{ alpha || '未选择' }}</eb-text>
  </eb-space>
</DemoBlock>

## 实时取值

拖动面板过程中 `active-change` 持续回传当前色（此时还未写入 `v-model`），适合联动预览；松手或点确定才提交：

<DemoBlock>
  <eb-space wrap>
    <eb-color-picker v-model="brandColor" @active-change="liveColor = $event" />
    <span :style="{ background: liveColor || brandColor, width: '24px', height: '24px', borderRadius: '6px', display: 'inline-block', border: '1px solid var(--eb-border-color)' }" />
    <eb-text size="small" type="info">实时值：{{ liveColor || '未拖动面板' }}</eb-text>
  </eb-space>
</DemoBlock>

## 写入格式

`color-format` 指定写回格式（hex / rgb / hsl / hexa / hsla / rgba），未指定时按 `show-alpha` 自动在 hex 与 rgba 间切换：

<DemoBlock>
  <eb-space wrap>
    <eb-color-picker v-model="rgbColor" color-format="rgb" />
    <eb-text size="small" type="info">rgb：{{ rgbColor }}</eb-text>
    <eb-color-picker v-model="hslColor" color-format="hsl" />
    <eb-text size="small" type="info">hsl：{{ hslColor }}</eb-text>
    <eb-color-picker v-model="hexaColor" color-format="hexa" show-alpha />
    <eb-text size="small" type="info">hexa：{{ hexaColor }}</eb-text>
  </eb-space>
</DemoBlock>

## 禁用与尺寸

`disabled` 后触发钮不可点击；`size` 独立设置，缺省跟随 Form 注入：

<DemoBlock>
  <eb-space wrap size="middle">
    <eb-color-picker model-value="#F59E0B" disabled />
    <eb-color-picker v-model="largeColor" size="large" />
    <eb-color-picker v-model="smallColor" size="small" />
  </eb-space>
</DemoBlock>

<script setup>
import { ref } from 'vue'
const color = ref('#175DFF')
const preset = ref('#10B981')
const alpha = ref('rgba(23, 93, 255, 0.6)')
const predefine = ['#175DFF', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#111827']
const brandColor = ref('#175DFF')
const liveColor = ref('')
const rgbColor = ref('#175DFF')
const hslColor = ref('#10B981')
const hexaColor = ref('#175DFF99')
const largeColor = ref('#8B5CF6')
const smallColor = ref('#EF4444')
</script>

<ApiTable title="ColorPicker Props" :rows="[
  { name: 'modelValue', desc: '绑定值（十六进制或 rgba 字符串）', type: 'string', default: '' },
  { name: 'predefine', desc: '预设色板', type: 'string[]', default: '[]' },
  { name: 'show-alpha', desc: '开启透明度通道', type: 'boolean', default: 'false' },
  { name: 'color-format', desc: '写回格式：hex / rgb / hsl / hexa / hsla / rgba，缺省时按 show-alpha 自动取 hex 或 rgba', type: 'string', default: '' },
  { name: 'popper-class', desc: '弹层面板附加类名（深度定制弹层样式时用）', type: 'string', default: '' },
  { name: 'size', desc: '尺寸（缺省跟随 Form）', type: 'large | default | small', default: 'default' },
  { name: 'disabled', desc: '禁用', type: 'boolean', default: 'false' },
  { name: 'validate-event', desc: '接入 Form 时触发校验', type: 'boolean', default: 'true' },
]" />

<ApiTable title="ColorPicker Events" :rows="[
  { name: 'update:modelValue / change', desc: '值变更（拖拽结束或确认时提交）', type: '(value: string) => void', default: '—' },
  { name: 'active-change', desc: '面板内拖动过程中的实时取值', type: '(value: string) => void', default: '—' },
]" />

<ApiTable title="ColorPicker Methods" :rows="[
  { name: 'show', desc: '打开取色面板', type: '() => void', default: '—' },
  { name: 'hide', desc: '关闭取色面板', type: '() => void', default: '—' },
  { name: 'focus', desc: '聚焦触发钮', type: '() => void', default: '—' },
  { name: 'blur', desc: '失焦触发钮', type: '() => void', default: '—' },
]" />
