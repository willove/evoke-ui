# TimePicker 时间选择器

时间（点选面板）选择器：支持时:分:秒与任意 format，范围选择用 `is-range`。日期 + 时间一起选请用 [DatePicker](/components/date-picker)。

## 基础用法

<DemoBlock>
  <eb-space wrap>
    <eb-time-picker v-model="t1" placeholder="选择时间" />
    <eb-text size="small" type="info">当前值：{{ t1 ?? '未选择' }}</eb-text>
  </eb-space>
</DemoBlock>

## 范围选择

<DemoBlock>
  <eb-time-picker v-model="range" is-range start-placeholder="开始时间" end-placeholder="结束时间" />
</DemoBlock>

## 格式与取值格式

`format` 控制展示（不含 ss 即隐藏秒列），`value-format` 控制绑定值格式（缺省绑定 Date 对象）：

<DemoBlock>
  <eb-space wrap>
    <eb-time-picker v-model="hm" format="HH:mm" placeholder="时:分" />
    <eb-time-picker v-model="str" format="HH:mm:ss" value-format="HH:mm:ss" placeholder="绑定为字符串" />
    <eb-text size="small" type="info">字符串值：{{ str ?? '未选择' }}</eb-text>
  </eb-space>
</DemoBlock>

<script setup>
import { ref } from 'vue'
const t1 = ref(null)
const range = ref(null)
const hm = ref(null)
const str = ref('')
</script>

<ApiTable title="TimePicker Props" :rows="[
  { name: 'modelValue', desc: '绑定值；value-format 缺省时为 Date', type: 'date | string | array', default: 'null' },
  { name: 'is-range', desc: '范围选择，绑定值为 [起, 止] 数组', type: 'boolean', default: 'false' },
  { name: 'format', desc: '展示格式（不含 ss 隐藏秒列）', type: 'string', default: 'HH:mm:ss' },
  { name: 'value-format', desc: '绑定值格式化（dayjs 格式），缺省绑定 Date', type: 'string', default: '' },
  { name: 'placeholder', desc: '占位文案（范围用 start/end-placeholder）', type: 'string', default: '' },
  { name: 'clearable', desc: '可清空', type: 'boolean', default: 'true' },
  { name: 'editable', desc: '允许手动键入', type: 'boolean', default: 'true' },
  { name: 'disabled', desc: '禁用', type: 'boolean', default: 'false' },
  { name: 'size', desc: '尺寸（缺省跟随 Form）', type: 'large | default | small', default: '' },
]" />

<ApiTable title="TimePicker Events" :rows="[
  { name: 'change', desc: '确认选择', type: '(value) => void', default: '—' },
  { name: 'clear', desc: '清空', type: '() => void', default: '—' },
  { name: 'visible-change', desc: '面板显隐', type: '(visible: boolean) => void', default: '—' },
  { name: 'focus / blur', desc: '聚焦 / 失焦', type: '(e: FocusEvent) => void', default: '—' },
]" />
