# OtpInput 验证码输入框

方框式验证码输入（OTP）：逐位输入自动前进、退格自动回退、粘贴整段验证码自动分配到各位；`type=number` 时移动端唤起数字键盘且首框启用 `one-time-code` 自动填充，明暗一体。

## 基础用法

输入满 `length` 位时触发 `complete`，携带完整验证码；下方以 `@complete` 展示真实结果。

<DemoBlock>
  <ev-otp-input @complete="(v) => (otpResult = v)" />
  <p style="margin-top: 8px;">输入结果：{{ otpResult || '—' }}</p>
</DemoBlock>

## 粘贴与键盘

在**任意方框**上粘贴整段验证码（如短信里的 `836274`），会从该位起逐位分配并自动聚焦末位；方向键在方框间移动，空框上退格回退并清除前一位。

<DemoBlock>
  <ev-otp-input :length="4" @complete="(v) => (otpPaste = v)" />
  <p style="margin-top: 8px;">复制一段 4 位验证码，在任意方框上粘贴试试：{{ otpPaste || '—' }}</p>
</DemoBlock>

## 掩码与字母数字

`masked` 将已填位显示为 ●；`type` 设为 `text` 后收字母数字（适合混合验证码）。

<DemoBlock>
  <div style="display: flex; flex-direction: column; gap: 16px;">
    <ev-otp-input masked :model-value="otpMaskedValue" />
    <ev-otp-input type="text" :length="4" error />
  </div>
</DemoBlock>

## API

<ApiTable title="OtpInput Props" :rows="[
  { name: 'modelValue', desc: '当前值（v-model），各框字符按序拼接', type: 'string', default: '' },
  { name: 'length', desc: '方框数量（1~10）', type: 'number', default: '6' },
  { name: 'type', desc: 'number 只收数字并启用 one-time-code；text 收字母数字', type: 'number | text', default: 'number' },
  { name: 'masked', desc: '掩码显示（已填位显示为圆点）', type: 'boolean', default: 'false' },
  { name: 'size', desc: '尺寸', type: 'small | default | large', default: 'default' },
  { name: 'disabled', desc: '禁用', type: 'boolean', default: 'false' },
  { name: 'error', desc: '错误态（红色边框）', type: 'boolean', default: 'false' },
  { name: 'autofocus', desc: '挂载后自动聚焦首个方框', type: 'boolean', default: 'false' },
]" />

<ApiTable title="Events" :rows="[
  { name: 'update:modelValue', desc: '值变化', type: '(value: string) => void', default: '—' },
  { name: 'change', desc: '值变化', type: '(value: string) => void', default: '—' },
  { name: 'complete', desc: '全部方框填满', type: '(value: string) => void', default: '—' },
]" />

<ApiTable title="Methods" :rows="[
  { name: 'focus', desc: '聚焦指定方框（缺省首个）', type: '(index?) => void', default: '—' },
  { name: 'blur', desc: '失焦', type: '() => void', default: '—' },
  { name: 'clear', desc: '清空全部方框', type: '() => void', default: '—' },
]" />

<script setup>
import { ref } from 'vue'

const otpResult = ref('')
const otpPaste = ref('')
const otpMaskedValue = ref('836274')
</script>
