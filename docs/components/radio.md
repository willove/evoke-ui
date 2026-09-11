# Radio 单选框

<script setup>
import { ref } from 'vue'

const v = ref('hangzhou')
const v2 = ref('daily')
const v3 = ref('day')
const sizeL = ref('a')
const sizeS = ref('a')
const fillV = ref('pass')
const notifyV = ref('app')
const freqV = ref('daily')
</script>


一组互斥的选项控件：在 `eb-radio-group` 中放置若干 `eb-radio`（或按钮风格的 `eb-radio-button`），由 group 统一管理选中值并通过 provide/inject 下发，`label` 即选项值，插槽内容为显示文案。在 eb-form 中 change 时机自动触发校验。

## 基础用法

<DemoBlock>
  <eb-radio-group v-model="v">
    <eb-radio label="hangzhou">杭州</eb-radio>
    <eb-radio label="shanghai">上海</eb-radio>
    <eb-radio label="shenzhen" disabled>深圳</eb-radio>
  </eb-radio-group>
</DemoBlock>

v-model 绑定选中项的 label；单个 radio 设置 disabled 只禁用自身（如上例深圳），适合个别选项不可用的场景。

## 整组禁用

group 设置 disabled 后整组不可选，常用于权限不足或前置条件未满足时的回显展示。

<DemoBlock>
  <eb-radio-group model-value="hangzhou" disabled>
    <eb-radio label="hangzhou">杭州</eb-radio>
    <eb-radio label="shanghai">上海</eb-radio>
  </eb-radio-group>
</DemoBlock>

## 边框与按钮风格

`border` 让 Radio 呈卡片描边样式（激活态描边可用 group 的 `fill` 定制）；`eb-radio-button` 为连体按钮组风格，视觉上更紧凑。

<DemoBlock>
  <eb-radio-group v-model="v2">
    <eb-radio label="daily" border>日报</eb-radio>
    <eb-radio label="weekly" border>周报</eb-radio>
    <eb-radio label="monthly" border disabled>月报</eb-radio>
  </eb-radio-group>
  <eb-radio-group v-model="v3" style="margin-top: 12px;">
    <eb-radio-button label="day">日</eb-radio-button>
    <eb-radio-button label="week">周</eb-radio-button>
    <eb-radio-button label="month">月</eb-radio-button>
  </eb-radio-group>
</DemoBlock>

## 尺寸

group 的 size 统一控制组内尺寸（子项单独设置会被 group 覆盖），border 与按钮风格均生效。

<DemoBlock>
  <eb-radio-group v-model="sizeL" size="large">
    <eb-radio label="a" border>large</eb-radio>
    <eb-radio label="b" border>middle</eb-radio>
  </eb-radio-group>
  <eb-radio-group v-model="sizeS" size="small" style="margin-left: 24px;">
    <eb-radio label="a" border>small</eb-radio>
    <eb-radio label="b" border>middle</eb-radio>
  </eb-radio-group>
</DemoBlock>

## 自定义激活色

group 的 `fill` 定制 border 模式激活态描边色（默认主色 #175DFF）；`text-color` 为按钮模式激活态文字色，适合按语义着色（如通过绿、驳回红）。

<DemoBlock>
  <eb-radio-group v-model="fillV" fill="#13ce66">
    <eb-radio label="pass" border>通过</eb-radio>
    <eb-radio label="reject" border>驳回</eb-radio>
  </eb-radio-group>
</DemoBlock>

## 组合场景：通知偏好

表单里常见的两级选择：通知渠道用按钮风格、推送频率用常规风格，各自独立绑定互不影响。

<DemoBlock>
  <eb-radio-group v-model="notifyV">
    <eb-radio-button label="app">站内信</eb-radio-button>
    <eb-radio-button label="sms">短信</eb-radio-button>
    <eb-radio-button label="email" disabled>邮件</eb-radio-button>
  </eb-radio-group>
  <eb-radio-group v-model="freqV" style="margin-top: 12px; display: flex;">
    <eb-radio label="realtime">实时推送</eb-radio>
    <eb-radio label="daily">每日汇总</eb-radio>
    <eb-radio label="weekly">每周汇总</eb-radio>
  </eb-radio-group>
</DemoBlock>

## API

<ApiTable title="RadioGroup Props" :rows="[
  { name: 'v-model', desc: '绑定值（选中项的 label），组内所有子项共享', type: 'string | number | boolean', default: '' },
  { name: 'size', desc: '组内尺寸，支持 large / small，子项单独设置会被覆盖', type: 'string', default: '' },
  { name: 'disabled', desc: '禁用整组', type: 'boolean', default: 'false' },
  { name: 'name', desc: '组内原生 radio 的 name（子项可覆盖）', type: 'string', default: '—' },
  { name: 'text-color', desc: '激活态文字颜色', type: 'string', default: '#ffffff' },
  { name: 'fill', desc: '激活态填充 / 描边色（border 模式生效，默认主色）', type: 'string', default: '#175DFF' },
]" />

<ApiTable title="Radio Props" :rows="[
  { name: 'v-model', desc: '独立使用时的绑定值（在 group 内由 group 接管）', type: 'string | number | boolean', default: '' },
  { name: 'label', desc: '选项值；无插槽内容时兼作显示文案', type: 'string | number | boolean', default: '' },
  { name: 'disabled', desc: '禁用（与 group disabled 叠加）', type: 'boolean', default: 'false' },
  { name: 'border', desc: '卡片描边样式', type: 'boolean', default: 'false' },
  { name: 'size', desc: '尺寸（优先级低于 group）', type: 'string', default: '' },
  { name: 'name', desc: '原生 name 属性，缺省继承 group 的 name', type: 'string', default: '—' },
]" />

<ApiTable title="RadioButton Props" :rows="[
  { name: 'v-model', desc: '独立使用时的绑定值', type: 'string | number | boolean', default: '' },
  { name: 'label', desc: '选项值；无插槽内容时兼作显示文案', type: 'string | number | boolean', default: '' },
  { name: 'disabled', desc: '禁用（与 group disabled 叠加）', type: 'boolean', default: 'false' },
  { name: 'size', desc: '尺寸（优先级低于 group）', type: 'string', default: '' },
  { name: 'name', desc: '原生 name 属性，缺省继承 group 的 name', type: 'string', default: '—' },
]" />

<ApiTable title="Events" :rows="[
  { name: 'update:modelValue / change', desc: '选中值变化，返回新选中项的 label（RadioGroup 与子项均触发）', type: '(value: string | number | boolean) => void', default: '—' },
]" />

<ApiTable title="Slots" :rows="[
  { name: 'default', desc: 'Radio / RadioButton 的显示文案，缺省显示 label', type: '—', default: '—' },
]" />

<ApiTable title="Methods" :rows="[
  { name: 'focus', desc: '使内部原生 radio 聚焦（Radio、RadioButton）', type: '() => void', default: '—' },
  { name: 'blur', desc: '使内部原生 radio 失焦（Radio、RadioButton）', type: '() => void', default: '—' },
]" />
