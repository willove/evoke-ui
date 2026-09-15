# Msgbox 消息弹窗

命令式弹窗三件套：alert（警告）/ confirm（确认）/ prompt（输入），Promise 化返回结果。适合删除确认、关键操作二次校验等流程性交互；纯展示类弹窗用 [Dialog](/components/dialog)。

## 三种形态

`$confirm` 确认时 resolve、取消时 reject，用 try/catch 承接；`$prompt` 的确认值带在 `value` 字段：

<DemoBlock>
  <eb-space wrap>
    <eb-button @click="onAlert">警告</eb-button>
    <eb-button @click="onConfirm">确认删除</eb-button>
    <eb-button @click="onPrompt">输入名称</eb-button>
  </eb-space>
  <eb-text v-if="result" size="small" type="info" style="margin-top:8px;display:block">{{ result }}</eb-text>
</DemoBlock>

## 输入校验

prompt 支持 `inputPattern` 正则与 `inputValidator` 函数两种校验，校验失败阻止确认并显示 `inputErrorMessage`：

<DemoBlock>
  <eb-button type="primary" @click="onValidatedPrompt">重命名（不能为空）</eb-button>
  <eb-text v-if="renamed" size="small" type="success" style="margin-top:8px;display:block">新名称：{{ renamed }}</eb-text>
</DemoBlock>

## 区分「取消」与「关闭」

`distinguishCancelAndClose` 开启后，ESC / 关闭按钮返回 `close`，取消按钮返回 `cancel`，两者可分别处理：

<DemoBlock>
  <eb-button @click="onDistinguish">试用 ESC 与取消按钮</eb-button>
  <eb-text v-if="action" size="small" type="info" style="margin-top:8px;display:block">返回动作：{{ action }}</eb-text>
</DemoBlock>

<script setup>
import { ref } from 'vue'

const result = ref('')
const renamed = ref('')
const action = ref('')

const onAlert = () => {
  $alert('该操作需要管理员权限', '权限不足', { type: 'warning' })
}
const onConfirm = async () => {
  try {
    await $confirm('删除后不可恢复，确认删除该记录？', '删除确认', { type: 'error' })
    result.value = '已确认删除'
  } catch (e) {
    result.value = '已取消'
  }
}
const onPrompt = async () => {
  try {
    const { value } = await $prompt('请输入分组名称', '新建分组')
    result.value = '分组名：' + value
  } catch (e) {
    result.value = '已取消'
  }
}
const onValidatedPrompt = async () => {
  try {
    const { value } = await $prompt('请输入新名称', '重命名', {
      inputPattern: /\S+/,
      inputErrorMessage: '名称不能为空',
    })
    renamed.value = value
  } catch (e) {
    renamed.value = ''
  }
}
const onDistinguish = async () => {
  try {
    await $confirm('内容尚未保存', '离开确认', { distinguishCancelAndClose: true })
    action.value = 'confirm'
  } catch (e) {
    action.value = e?.action
  }
}
</script>

## 调用形式

三种重载等价，参数可缺位：`(message, title?, options?)`、`(message, options?)`，也可对象式整体传入 `$msgbox({ message, title, showCancelButton: true, ... })`。

<ApiTable title="Msgbox Options" :rows="[
  { name: 'message / title', desc: '内容与标题', type: 'string', default: '' },
  { name: 'type', desc: '类型图标与配色', type: 'success | warning | info | error', default: 'info' },
  { name: 'html', desc: '以 HTML 片段渲染 message（内容由调用方负责转义）', type: 'boolean', default: 'false' },
  { name: 'showIcon / showClose', desc: '显示类型图标 / 右上角关闭钮', type: 'boolean', default: 'true' },
  { name: 'showCancelButton', desc: '显示取消按钮（alert 默认无）', type: 'boolean', default: 'false' },
  { name: 'distinguishCancelAndClose', desc: '区分取消与关闭动作', type: 'boolean', default: 'false' },
  { name: 'confirmButtonText / cancelButtonText', desc: '按钮文案', type: 'string', default: '确定 / 取消' },
  { name: 'confirmButtonLoading', desc: '确认按钮 loading（异步校验场景）', type: 'boolean', default: 'false' },
  { name: 'center', desc: '内容居中', type: 'boolean', default: 'false' },
  { name: 'closeOnClickModal / closeOnPressEscape', desc: '点遮罩 / ESC 关闭', type: 'boolean', default: 'true' },
  { name: 'inputType / inputValue / inputPlaceholder', desc: 'prompt 输入框配置', type: 'string', default: '' },
  { name: 'inputPattern', desc: '输入正则校验', type: 'RegExp', default: 'null' },
  { name: 'inputValidator', desc: '输入校验函数，返回错误文案即视为不通过', type: '(value) => string | true', default: 'null' },
  { name: 'inputErrorMessage', desc: '正则校验失败提示', type: 'string', default: '' },
  { name: 'lockScroll', desc: '弹窗期间锁定页面滚动', type: 'boolean', default: 'false' },
]" />

<ApiTable title="返回值" :rows="[
  { name: 'confirm', desc: '确认按钮 → resolve', type: 'Promise<{ action: string, value: string }>', default: '—' },
  { name: 'cancel', desc: '取消按钮 / ESC → reject', type: 'Promise<{ action: string, value: string }>', default: '—' },
  { name: 'close', desc: '开启 distinguishCancelAndClose 后，ESC / 关闭钮 → reject，action 为 close', type: 'Promise<{ action: string, value: string }>', default: '—' },
  { name: 'prompt.value', desc: '确认时携带输入值', type: 'string', default: '' },
]" />
