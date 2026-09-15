# TimeSelect 时间选择

下拉式固定时间点选择：由 start / end / step 生成等间隔选项，适合会议安排、班次选择这类离散时间点场景；连续时间请用 [TimePicker](/components/time-picker)。

## 基础用法

<DemoBlock>
  <eb-space wrap>
    <eb-time-select v-model="t1" placeholder="选择时间" />
    <eb-text size="small" type="info">当前值：{{ t1 ?? '未选择' }}</eb-text>
  </eb-space>
</DemoBlock>

## 间隔与起止

<DemoBlock>
  <eb-time-select v-model="t2" start="08:00" end="20:00" step="01:00" placeholder="整点班次" />
</DemoBlock>

## 限定可选范围

minTime / maxTime 之外的时间点置灰，适合「不早于当前选择」的联动：

<DemoBlock>
  <eb-time-select v-model="t3" start="09:00" end="18:00" min-time="10:30" max-time="16:00" placeholder="10:30–16:00 可选" />
</DemoBlock>

<script setup>
import { ref } from 'vue'
const t1 = ref(null)
const t2 = ref(null)
const t3 = ref(null)
</script>

<ApiTable title="TimeSelect Props" :rows="[
  { name: 'modelValue', desc: '绑定值（HH:mm 字符串或 Date）', type: 'string | date', default: 'null' },
  { name: 'start / end', desc: '选项起止时间', type: 'string', default: '09:00 / 18:00' },
  { name: 'step', desc: '选项间隔', type: 'string', default: '00:30' },
  { name: 'min-time / max-time', desc: '可选范围（之外置灰）', type: 'string', default: '' },
  { name: 'placeholder', desc: '占位文案', type: 'string', default: '' },
  { name: 'clearable / editable / disabled', desc: '可清空 / 可键入 / 禁用', type: 'boolean', default: 'true / true / false' },
  { name: 'size', desc: '尺寸（缺省跟随 Form）', type: 'large | default | small', default: '' },
  { name: 'ripple', desc: '激活涟漪动效开关：聚焦时实体色影向外扩展；也可在 Form 上批量关闭或全局 setRipple(false)', type: 'boolean', default: 'true' },
]" />

<ApiTable title="TimeSelect Events" :rows="[
  { name: 'change', desc: '确认选择', type: '(value: string) => void', default: '—' },
  { name: 'clear', desc: '清空', type: '() => void', default: '—' },
  { name: 'visible-change', desc: '面板显隐', type: '(visible: boolean) => void', default: '—' },
]" />
