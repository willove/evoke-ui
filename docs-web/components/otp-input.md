# OtpInput 验证码输入框

方框式验证码输入（OTP）：逐位输入自动前进、退格自动回退、粘贴整段验证码自动分配到各位；`type="number"` 时移动端唤起数字键盘且首框启用 `one-time-code` 自动填充，明暗一体。

## 基础用法

<DemoBlock title="六位数字验证码" description="输满 6 位触发 complete，携带完整验证码。">

<div style="display:flex; flex-direction:column; gap:12px;">
  <EvOtpInput @complete="(v) => (otpResult = v)" />
  <p style="margin:0; color:var(--ev-text-secondary);">输入结果：{{ otpResult || '—' }}</p>
</div>

<script setup>
import { ref } from 'vue'
const otpResult = ref('')
const otpPaste = ref('')
</script>

```vue
<EvOtpInput @complete="(v) => (otpResult = v)" />
```

</DemoBlock>

## 粘贴与键盘

<DemoBlock title="任意框粘贴整段验证码" description="复制一段 4 位验证码，在任意方框上粘贴——自动从该位起逐位分配并聚焦末位；空框上退格回退并清除前一位。">

<div style="display:flex; flex-direction:column; gap:12px;">
  <EvOtpInput :length="4" @complete="(v) => (otpPaste = v)" />
  <p style="margin:0; color:var(--ev-text-secondary);">粘贴结果：{{ otpPaste || '—' }}</p>
</div>

```vue
<EvOtpInput :length="4" @complete="(v) => (otpPaste = v)" />
```

</DemoBlock>

## 掩码与字母数字

<DemoBlock title="掩码显示 / 混合验证码 / 错误态" description="masked 将已填位显示为圆点；type 设为 text 后收字母数字；error 进入红色边框错误态。">

<div style="display:flex; flex-direction:column; gap:12px;">
  <EvOtpInput masked model-value="836274" />
  <EvOtpInput type="text" :length="4" error />
</div>

```vue
<EvOtpInput masked model-value="836274" />
<EvOtpInput type="text" :length="4" error />
```

</DemoBlock>

## API

### Props

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| v-model | 当前值，各框字符按序拼接 | string | `''` |
| length | 方框数量（1~10） | number | `6` |
| type | number 只收数字并启用 one-time-code；text 收字母数字 | `'number'` \| `'text'` | `'number'` |
| masked | 掩码显示（已填位显示为圆点） | boolean | `false` |
| size | 尺寸 | `'small'` \| `'default'` \| `'large'` | `'default'` |
| disabled | 禁用 | boolean | `false` |
| error | 错误态（红色边框） | boolean | `false` |
| autofocus | 挂载后自动聚焦首个方框 | boolean | `false` |

### 事件

| 事件 | 说明 | 参数 |
| --- | --- | --- |
| update:modelValue | 值变化 | `(value: string)` |
| change | 值变化 | `(value: string)` |
| complete | 全部方框填满 | `(value: string)` |

### 方法

| 方法 | 说明 | 参数 |
| --- | --- | --- |
| focus | 聚焦指定方框（缺省首个） | `(index?: number)` |
| blur | 失焦 | — |
| clear | 清空全部方框 | — |
