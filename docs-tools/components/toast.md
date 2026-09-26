# EtToast · 瞬时通知

不抢焦点的轻提示：`role="status"` + `aria-live="polite"`，自动关定时器随关闭/卸载清理。


<script setup>
import { ref } from 'vue'
const toastOpen = ref(false)
const toastMsg = ref('')
const toastKind = ref('info')
const show = (t) => {
  toastKind.value = t
  toastMsg.value = `这是 ${t} 提示`
  toastOpen.value = true
}
</script>

<DemoBlock>
  <div style="display: flex; gap: 8px;">
    <eb-button v-for="t in ['info', 'success', 'warn', 'error']" :key="t" size="small" @click="show(t)">{{ t }}</eb-button>
  </div>
  <et-toast v-model="toastOpen" :message="toastMsg" :type="toastKind" :duration="2400" />
</DemoBlock>

## Props

| 名称 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `modelValue` | Boolean | `false` | 开关 |
| `message` | String | `''` | 提示文本（默认槽可整体替换） |
| `type` | String | `'info'` | `info` / `success` / `warn` / `error`；未知值回落 info |
| `duration` | Number | `3000` | 自动关毫秒数；`0` = 常驻到消费方关闭 |
| `position` | String | `'top'` | `top` / `center` / `bottom`；未知值回落 top |

## Emits

| 名称 | 载荷 | 说明 |
| --- | --- | --- |
| `update:modelValue` | boolean | 开关回写（自动关到点时也发） |
| `action` | —— | 操作位点击 |

## Slots

| 名称 | 作用域 | 说明 |
| --- | --- | --- |
| 默认 | —— | 替换 message 的正文 |
| `action` | —— | 操作位（撤销等）；给了才渲染 |

## 行为

- Teleport 到 body，走 `--et-z-notify`（恒在 modal 之上：弹窗上方的提示不被对话框盖住）。
- `duration > 0` 才挂自动关定时器；重开 / 改 duration 都重挂，关闭与卸载即清。
- 类型图标用库内 semantic 名（info / success / warning / error）。
- 三档语义色 + 中性文字，一屏彩色 ≤3 纪律。

## 令牌与门禁

- `--et-z-notify`（4000）、`--et-icon-sm`（16 档图标）。
- G6：瞬时通知禁成段说明。
