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

<script setup>
import { ref } from 'vue'
const color = ref('#175DFF')
const preset = ref('#10B981')
const alpha = ref('rgba(23, 93, 255, 0.6)')
const predefine = ['#175DFF', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#111827']
</script>

<ApiTable title="ColorPicker Props" :rows="[
  { name: 'modelValue', desc: '绑定值（十六进制或 rgba 字符串）', type: 'string', default: '' },
  { name: 'predefine', desc: '预设色板', type: 'string[]', default: '[]' },
  { name: 'show-alpha', desc: '开启透明度通道', type: 'boolean', default: 'false' },
  { name: 'color-format', desc: '写入格式（hex / rgb / hex 含 alpha 自动带透明）', type: 'string', default: '' },
  { name: 'size', desc: '尺寸（缺省跟随 Form）', type: 'large | default | small', default: 'default' },
  { name: 'disabled', desc: '禁用', type: 'boolean', default: 'false' },
  { name: 'validate-event', desc: '接入 Form 时触发校验', type: 'boolean', default: 'true' },
]" />

<ApiTable title="ColorPicker Events" :rows="[
  { name: 'update:modelValue / change', desc: '值变更（面板确认时）', type: '(value: string) => void', default: '—' },
  { name: 'active-change', desc: '面板内实时取值', type: '(value: string) => void', default: '—' },
]" />
