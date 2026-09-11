# Checkbox 多选框

<script setup>
import { ref } from 'vue'

const v = ref(['vue'])
const borderV = ref(true)
const btnV = ref(['a', 'b'])
const limitV = ref(['a'])
const checkAll = ref(false)
const checkedCities = ref(['北京'])
const cities = ['北京', '上海', '广州', '深圳']
function handleCheckAll(val) {
  checkAll.value = val
  checkedCities.value = val ? [...cities] : []
}
function handleCityChange() {
  checkAll.value = checkedCities.value.length === cities.length
}
</script>


可多选的勾选控件：在 `eb-checkbox-group` 中放置若干 `eb-checkbox`（或按钮风格的 `eb-checkbox-button`），绑定值为选中 label 组成的数组；独立使用时支持 boolean / 数组 / true-label 等值语义。在 eb-form 中 change 时机自动触发校验。

## 基础用法

<DemoBlock>
  <eb-checkbox-group v-model="v">
    <eb-checkbox label="vue">Vue</eb-checkbox>
    <eb-checkbox label="react">React</eb-checkbox>
    <eb-checkbox label="svelte" disabled>Svelte</eb-checkbox>
  </eb-checkbox-group>
</DemoBlock>

绑定值为选中 label 组成的数组；单个 checkbox 设置 disabled 只禁用自身（如上例 Svelte），适合个别选项不可勾选的场景。

## 整组禁用

group 设置 disabled 后整组不可勾选，常用于权限不足、前置条件未满足时的回显展示。

<DemoBlock>
  <eb-checkbox-group :model-value="['北京', '上海']" disabled>
    <eb-checkbox label="北京">北京</eb-checkbox>
    <eb-checkbox label="上海">上海</eb-checkbox>
  </eb-checkbox-group>
</DemoBlock>

## 边框与尺寸

border 呈卡片描边样式；size 控制尺寸（large / small），组内可由 group 的 size 统一设置。

<DemoBlock>
  <eb-checkbox v-model="borderV" border>默认尺寸</eb-checkbox>
  <eb-checkbox v-model="borderV" border size="large">large</eb-checkbox>
  <eb-checkbox v-model="borderV" border size="small">small</eb-checkbox>
</DemoBlock>

## 按钮风格

eb-checkbox-button 为连体按钮组风格，适合筛选项较多的紧凑布局。

<DemoBlock>
  <eb-checkbox-group v-model="btnV">
    <eb-checkbox-button label="a">选项 A</eb-checkbox-button>
    <eb-checkbox-button label="b">选项 B</eb-checkbox-button>
    <eb-checkbox-button label="c">选项 C</eb-checkbox-button>
  </eb-checkbox-group>
</DemoBlock>

## 数量限制

group 的 `max / min` 限制可勾选数量：达到上限后未选项自动禁用，达到下限后已选项禁止取消，用于限选场景（如最多选 2 个标签）。

<DemoBlock>
  <eb-checkbox-group v-model="limitV" :max="2">
    <eb-checkbox label="a">选项 A</eb-checkbox>
    <eb-checkbox label="b">选项 B</eb-checkbox>
    <eb-checkbox label="c">选项 C</eb-checkbox>
  </eb-checkbox-group>
</DemoBlock>

## 全选联动

经典全选组合：全选框用 indeterminate 表达半选态（部分选中），change 时全量写入 / 清空数组；子项 change 里根据选中数量同步全选态。indeterminate 只影响样式，不写入绑定值。

<DemoBlock>
  <eb-checkbox v-model="checkAll" :indeterminate="checkedCities.length > 0 && checkedCities.length < cities.length" @change="handleCheckAll">全选</eb-checkbox>
  <eb-checkbox-group v-model="checkedCities" @change="handleCityChange" style="margin-top: 12px; display: flex;">
    <eb-checkbox v-for="city in cities" :key="city" :label="city">{{ city }}</eb-checkbox>
  </eb-checkbox-group>
</DemoBlock>

handleCheckAll / handleCityChange 定义见页面顶部 script：全选时写入 `[...cities]`，取消时清空数组，子项变化后按数量回写 checkAll。

## API

<ApiTable title="CheckboxGroup Props" :rows="[
  { name: 'v-model', desc: '绑定值（选中项 label 组成的数组），组内所有子项共享', type: 'array', default: '[]' },
  { name: 'min / max', desc: '可勾选数量下限 / 上限（到限后相应选项自动禁用）', type: 'number', default: '—' },
  { name: 'size', desc: '组内尺寸，支持 large / small', type: 'string', default: '' },
  { name: 'disabled', desc: '禁用整组', type: 'boolean', default: 'false' },
  { name: 'fill', desc: '激活态填充色（border / 按钮模式）', type: 'string', default: '—' },
  { name: 'text-color', desc: '激活态文字颜色', type: 'string', default: '—' },
]" />

<ApiTable title="Checkbox Props" :rows="[
  { name: 'v-model', desc: '独立使用时的绑定值（boolean / 数组 / true-label 值；group 内由 group 接管）', type: 'boolean | array | string | number', default: '—' },
  { name: 'label', desc: '选项值（group 内必填）；无插槽内容时兼作显示文案', type: 'string | number | boolean', default: '—' },
  { name: 'indeterminate', desc: '半选态（只影响样式，不改变实际选中值），常用于全选控制', type: 'boolean', default: 'false' },
  { name: 'true-label / false-label', desc: '选中 / 未选中时写入绑定值的替代值', type: 'string | number', default: '—' },
  { name: 'checked', desc: 'modelValue 缺省时的初始选中态', type: 'boolean', default: '—' },
  { name: 'disabled', desc: '禁用（叠加 group disabled 与数量限制判定）', type: 'boolean', default: 'false' },
  { name: 'border', desc: '卡片描边样式', type: 'boolean', default: 'false' },
  { name: 'size', desc: '尺寸（优先级低于 group）', type: 'string', default: '' },
  { name: 'name', desc: '原生 name 属性', type: 'string', default: '—' },
]" />

<ApiTable title="CheckboxButton Props" :rows="[
  { name: 'v-model', desc: '独立使用时的绑定值', type: 'boolean | array', default: '—' },
  { name: 'label', desc: '选项值；无插槽内容时兼作显示文案', type: 'string | number | boolean', default: '—' },
  { name: 'checked', desc: 'modelValue 缺省时的初始选中态', type: 'boolean', default: '—' },
  { name: 'disabled', desc: '禁用（叠加 group disabled）', type: 'boolean', default: 'false' },
  { name: 'size', desc: '尺寸（优先级低于 group）', type: 'string', default: '' },
  { name: 'name', desc: '原生 name 属性', type: 'string', default: '—' },
]" />

<ApiTable title="Events" :rows="[
  { name: 'update:modelValue / change', desc: '勾选变化，group 返回数组，独立使用返回 boolean / 数组 / 标签值', type: '(value: any) => void', default: '—' },
]" />

<ApiTable title="Slots" :rows="[
  { name: 'default', desc: 'Checkbox / CheckboxButton 的显示文案，缺省显示 label', type: '—', default: '—' },
]" />

<ApiTable title="Methods" :rows="[
  { name: 'focus', desc: '使内部原生 input 聚焦（Checkbox、CheckboxButton）', type: '() => void', default: '—' },
  { name: 'blur', desc: '使内部原生 input 失焦（Checkbox、CheckboxButton）', type: '() => void', default: '—' },
]" />
