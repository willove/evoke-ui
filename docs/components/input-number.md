# InputNumber 计数器

<script setup>
import { ref } from 'vue'

const v = ref(1)
const stepV = ref(5)
const strictV = ref(20)
const rangeV = ref(20)
const sizeV = ref(1)
const clearV = ref(5)
const fmtV = ref(1234567)
const fmtAddonV = ref(9)
</script>


仅允许输入标准数字值的输入框：内置步进按钮与键盘上下键步进，min/max 自动钳制（到边界后对应按钮禁用），支持精度格式化与步长倍数约束。在 eb-form 中 change / blur 时机自动触发校验。

## 基础用法

<DemoBlock>
  <eb-input-number v-model="v" :min="1" :max="10" />
  <eb-input-number :model-value="1.5" :step="0.1" :precision="1" disabled />
</DemoBlock>

v-model 绑定数值，min / max 约束有效范围：步进与手动输入超出范围时自动钳制到边界值；未绑定初始值时步进以 min（min 为负无穷时取 0）为基准。

## 步长与严格步长

step 定义每次步进的幅度（默认 1），支持小数；step-strictly 开启后绑定值只能是 step 的倍数，手动输入的值会在失焦时四舍五入到最近倍数，适合按固定档位取值的场景（如每 10 件一箱）。

<DemoBlock>
  <eb-input-number v-model="stepV" :step="5" />
  <eb-input-number v-model="strictV" :step="10" step-strictly />
</DemoBlock>

## 范围与精度

min / max 是最常用的约束（如库存 0 - 100）；precision 固定小数位数，输入后按位格式化（如金额保留两位），建议与 step 的小数位对齐。

<DemoBlock>
  <eb-input-number v-model="rangeV" :min="0" :max="100" placeholder="0 - 100" />
  <eb-input-number v-model="rangeV" :precision="2" :step="0.01" placeholder="保留两位小数" />
</DemoBlock>

## 控制按钮

`controls-position="right"` 将步进按钮收拢到右侧上下排列（默认在输入框两侧）；`controls` 设为 false 时隐藏按钮，仅保留键盘步进。

<DemoBlock>
  <eb-input-number :model-value="2" controls-position="right" />
  <eb-input-number :model-value="8" :controls="false" />
</DemoBlock>

## 尺寸

size 支持 large / small（缺省为默认高度），位于 eb-form 内时会继承表单尺寸。

<DemoBlock>
  <eb-input-number v-model="sizeV" size="large" />
  <eb-input-number v-model="sizeV" />
  <eb-input-number v-model="sizeV" size="small" />
</DemoBlock>

## 禁用与只读

disabled 整体禁用（含步进按钮）；readonly 只读，输入与步进均被禁止，适合回显数值。

<DemoBlock>
  <eb-input-number :model-value="3" disabled />
  <eb-input-number :model-value="6" readonly />
</DemoBlock>

## 清空与替代值

手动清空输入框后，value-on-clear 不为 null 时以替代值写入绑定值（默认 null 表示清空后不更新），常与 min 配合保证业务上不允许空值。

<DemoBlock>
  <eb-input-number v-model="clearV" :min="1" :value-on-clear="1" placeholder="清空后写回 1" />
</DemoBlock>

## 格式化展示

`formatter` 控制展示格式（如千分位金额），`parser` 把输入文本解析回数值；只传 formatter 时聚焦显原始数值串、失焦回显格式化值，缺省 parser 会自动去千分位逗号解析。传入 formatter 或 parser 后输入框切换为文本输入（inputmode 为 decimal），以容纳格式字符。

<DemoBlock>
  <eb-input-number
    v-model="fmtV"
    :formatter="(val) => String(val).replace(/\B(?=(\d{3})+(?!\d))/g, ',')"
    :parser="(text) => Number(String(text).replace(/,/g, ''))"
  />
</DemoBlock>

## 前后缀块

`addon-before` / `addon-after` 在输入框外侧拼接前后缀块（货币符号、单位等），插槽 `addon-before` / `addon-after` 优先于同名 prop，可承载任意内容。

<DemoBlock>
  <eb-input-number v-model="fmtAddonV" :min="1" addon-before="￥" addon-after="件" />
</DemoBlock>

## API

<ApiTable title="InputNumber Props" :rows="[
  { name: 'v-model', desc: '绑定值', type: 'number', default: '—' },
  { name: 'min / max', desc: '允许的最小值 / 最大值（超出自动钳制，到边界后对应按钮禁用）', type: 'number', default: '-Infinity / Infinity' },
  { name: 'step', desc: '步长，支持小数', type: 'number', default: '1' },
  { name: 'step-strictly', desc: '只能输入 step 的倍数（手动输入取整到最近倍数）', type: 'boolean', default: 'false' },
  { name: 'precision', desc: '数值精度（小数位数），输入后按位格式化', type: 'number', default: '—' },
  { name: 'size', desc: '尺寸，支持 large / small', type: 'string', default: '' },
  { name: 'controls', desc: '是否显示步进按钮', type: 'boolean', default: 'true' },
  { name: 'controls-position', desc: '按钮位置：right 为右侧上下排列，缺省在两侧', type: 'string', default: '' },
  { name: 'value-on-clear', desc: '清空输入时的替代值，null 表示清空后不更新绑定值', type: 'number | null', default: 'null' },
  { name: 'disabled', desc: '禁用（同时响应表单禁用态）', type: 'boolean', default: 'false' },
  { name: 'readonly', desc: '只读（输入与步进均被禁止）', type: 'boolean', default: 'false' },
  { name: 'placeholder', desc: '占位文本', type: 'string', default: '' },
  { name: 'name', desc: '原生 name 属性', type: 'string', default: '—' },
  { name: 'formatter', desc: '展示格式化函数（如千分位），传入后输入框切换为文本输入', type: '(value: number) => string', default: '—' },
  { name: 'parser', desc: '把输入文本解析回数值，缺省去千分位逗号后解析', type: '(text: string) => number', default: '—' },
  { name: 'addon-before', desc: '框外前缀块文案，与 addon-before 插槽二选一（插槽优先）', type: 'string', default: '' },
  { name: 'addon-after', desc: '框外后缀块文案，与 addon-after 插槽二选一（插槽优先）', type: 'string', default: '' },
  { name: 'ripple', desc: '激活涟漪动效开关：聚焦时实体色影向外扩展；也可在 Form 上批量关闭或全局 setRipple(false)', type: 'boolean', default: 'true' },
]" />

<ApiTable title="InputNumber Events" :rows="[
  { name: 'update:modelValue / change', desc: '值变化（步进、输入失焦提交），返回钳制与格式化后的数值', type: '(value: number) => void', default: '—' },
  { name: 'blur', desc: '失焦，并触发表单项 blur 校验', type: '(e: FocusEvent) => void', default: '—' },
  { name: 'focus', desc: '聚焦', type: '(e: FocusEvent) => void', default: '—' },
]" />

<ApiTable title="InputNumber Slots" :rows="[
  { name: 'addon-before', desc: '框外前缀块内容，优先于 addon-before prop', type: '—', default: '—' },
  { name: 'addon-after', desc: '框外后缀块内容，优先于 addon-after prop', type: '—', default: '—' },
]" />

<ApiTable title="InputNumber Methods" :rows="[
  { name: 'focus', desc: '使输入框聚焦', type: '() => void', default: '—' },
  { name: 'blur', desc: '使输入框失焦', type: '() => void', default: '—' },
  { name: 'ref', desc: '内部原生 input 元素引用', type: 'HTMLInputElement', default: '—' },
]" />
