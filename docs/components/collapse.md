# Collapse 折叠面板

将内容收纳在可展开收起的面板中，点击标题切换显示（带高度过渡动画）。支持手风琴模式（同时只展开一项）与禁用单项；展开状态通过 v-model 受控，value 为展开项 name 的数组（手风琴模式下 emits 派发单个 name 或空串）。

## 基础用法

`model-value` 传入数组控制展开项；`name` 是受控的唯一标识，缺省时回退组件实例 uid；`disabled` 禁用单项。

<script setup>
import { ref } from 'vue'

const open = ref(['feedback'])
const names = ref(['guide'])
const lastChange = ref('（尚未变化）')
function onChange(val) {
  lastChange.value = Array.isArray(val) ? val.join('、') : String(val)
}
</script>

<DemoBlock>
<eb-collapse v-model="open">
  <eb-collapse-item title="反馈 Feedback" name="feedback">通过界面样式与交互效果，让用户清晰感知自己的操作结果。</eb-collapse-item>
  <eb-collapse-item title="效率 Efficiency" name="efficiency">设计简洁直观的操作流程，帮助用户快速完成任务。</eb-collapse-item>
  <eb-collapse-item title="可控 Controllability" name="control" disabled>该面板已禁用，无法展开。</eb-collapse-item>
</eb-collapse>
</DemoBlock>

## 手风琴

设置 `accordion` 后同一时刻最多展开一项，再次点击已展开项将其收起；此时 v-model 的值为单个 name 或空串。

<DemoBlock>
<eb-collapse accordion>
  <eb-collapse-item title="第一步 填写信息" name="s1">填写基础资料并上传证件照片。</eb-collapse-item>
  <eb-collapse-item title="第二步 实名认证" name="s2">等待系统核验身份信息。</eb-collapse-item>
  <eb-collapse-item title="第三步 提交审核" name="s3">认证通过后提交入驻审核。</eb-collapse-item>
</eb-collapse>
</DemoBlock>

## change 事件

每次展开项变化都会触发 `change`，参数与 `update:modelValue` 一致，可用于上报埋点或联动其他区域。

<DemoBlock>
<eb-collapse v-model="names" @change="onChange">
  <eb-collapse-item title="全局引导" name="guide">首次进入系统时的功能引导说明。</eb-collapse-item>
  <eb-collapse-item title="快捷键" name="shortcut">Ctrl + K 打开命令面板。</eb-collapse-item>
</eb-collapse>
<p style="margin-top: 8px;">最近一次 change：{{ lastChange }}</p>
</DemoBlock>

## 受控静态展示

不需要联动状态时，直接以 `:model-value` 传入初始展开项做静态展示（组件内部会自行维护后续的展开状态）。

<DemoBlock>
<eb-collapse :model-value="['q1']">
  <eb-collapse-item title="如何退款？" name="q1">订单完成后 7 天内可发起退款申请。</eb-collapse-item>
  <eb-collapse-item title="多久到账？" name="q2">退款将在 1-3 个工作日内原路退回。</eb-collapse-item>
</eb-collapse>
</DemoBlock>

## 自定义标题

`#title` 插槽替换标题区（箭头左侧），可组合富文本；默认插槽为面板内容。

<DemoBlock>
<eb-collapse>
  <eb-collapse-item name="t1">
    <template #title>
      <span style="font-weight: 600;">自营包邮</span>
      <span style="margin-left: 8px; color: var(--eb-text-color-secondary); font-size: 12px;">满 99 元生效</span>
    </template>
    商家承担运费，偏远地区除外。
  </eb-collapse-item>
  <eb-collapse-item title="七天无理由退货" name="t2" disabled>该面板已禁用。</eb-collapse-item>
</eb-collapse>
</DemoBlock>

## API

<ApiTable title="Collapse Props" :rows="[
  { name: 'v-model', desc: '当前展开项 name（数组；手风琴模式下 emits 为单个 name 或空串）', type: 'array | string | number', default: '[]' },
  { name: 'accordion', desc: '手风琴模式，同时最多展开一项', type: 'boolean', default: 'false' },
]" />

<ApiTable title="Collapse Events" :rows="[
  { name: 'change', desc: '展开项变化，参数与 update:modelValue 一致', type: '(names) => void', default: '—' },
  { name: 'update:modelValue', desc: 'v-model 更新', type: '(names) => void', default: '—' },
]" />

<ApiTable title="Collapse Slots" :rows="[
  { name: 'default', desc: 'eb-collapse-item 列表', type: '—', default: '—' },
]" />

<ApiTable title="CollapseItem Props" :rows="[
  { name: 'title', desc: '面板标题（优先级低于 title 插槽）', type: 'string', default: '' },
  { name: 'name', desc: '唯一标识，缺省时回退组件实例 uid', type: 'string | number', default: '—' },
  { name: 'disabled', desc: '禁用该项（不可展开，标题置灰）', type: 'boolean', default: 'false' },
]" />

<ApiTable title="CollapseItem Slots" :rows="[
  { name: 'default', desc: '面板内容', type: '—', default: '—' },
  { name: 'title', desc: '自定义标题（替换箭头左侧区域）', type: '—', default: '—' },
]" />
