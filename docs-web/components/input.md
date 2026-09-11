# Input 输入框

`EwInput` 是前台内容提交的基础件：评论昵称、搜索词、邮箱订阅、资料填写都从这里出发。
支持前缀图标、一键清空、错误态与三档尺寸；`type` 直接透传（email / search / password…）。
聚焦时边框会向外扩散两圈波纹（textarea / select / search-box 同样生效）；
全局关闭：`<html data-ew-ripple="off">`，`prefers-reduced-motion` 下自动停用。

## 基础用法

<DemoBlock title="占位与前缀图标" description="type 支持 text / email / search / password 等原生类型。">

<div style="display:flex; flex-direction:column; gap:12px; max-width:420px;">
  <EwInput v-model="name" placeholder="怎么称呼你" />
  <EwInput v-model="mail" type="email" icon="mail" placeholder="you@example.com" />
  <EwInput v-model="find" type="search" icon="search" placeholder="搜索…" clearable />
</div>

<script setup>
import { ref } from 'vue'
const name = ref('')
const mail = ref('')
const find = ref('')
</script>

```vue
<EwInput v-model="name" placeholder="怎么称呼你" />
<EwInput v-model="mail" type="email" icon="mail" placeholder="you@example.com" />
<EwInput v-model="find" type="search" icon="search" placeholder="搜索…" clearable />
```

</DemoBlock>

## 状态与尺寸

<DemoBlock title="错误态 / 禁用 / 三档尺寸" description="错误态常与 [EwField](./field) 的错误提示搭配使用。">

<div style="display:flex; flex-direction:column; gap:12px; max-width:420px;">
  <EwInput model-value="格式有误的内容" error />
  <EwInput model-value="不可修改" disabled />
  <EwInput size="small" placeholder="small" />
  <EwInput size="large" placeholder="large" />
</div>

```vue
<EwInput model-value="格式有误的内容" error />
<EwInput size="large" placeholder="large" />
```

</DemoBlock>

## API

### Props

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| v-model | 输入值 | string / number | `''` |
| type | 原生类型 | string | `'text'` |
| placeholder | 占位文案 | string | — |
| icon | 前缀图标名 | string | — |
| clearable | 展示清空按钮 | boolean | `false` |
| disabled | 禁用 | boolean | `false` |
| error | 错误态 | boolean | `false` |
| size | 尺寸 | `'small' \| 'default' \| 'large'` | `'default'` |

其余 attrs（`maxlength` 等）直接透传到原生 input。

### 事件

| 事件 | 说明 | 参数 |
| --- | --- | --- |
| update:modelValue | 输入时派发 | value |
| clear | 点击清空按钮 | — |
