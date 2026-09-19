# Msgbox 消息弹窗

命令式弹窗三件套：alert（警告）/ confirm（确认）/ prompt（输入），Promise 化返回结果。适合删除确认、关键操作二次校验等流程性交互；纯展示类弹窗用 [Dialog](/components/dialog)。

## 三种形态

confirm 确认时 resolve、取消时 reject，用 try/catch 承接；prompt 的确认值带在 `value` 字段。脚本中通过导入的 `EbMsgbox` 调用（模板内联表达式也可直接用全局属性 `$alert / $confirm / $prompt`）：

<DemoBlock>
  <eb-space wrap>
    <eb-button @click="onAlert">警告</eb-button>
    <eb-button @click="onConfirm">确认删除</eb-button>
    <eb-button @click="onPrompt">输入名称</eb-button>
  </eb-space>
  <eb-text v-if="result" size="small" type="info" style="margin-top:8px;display:block">{{ result }}</eb-text>
</DemoBlock>

## 输入校验

prompt 支持 `inputPattern` 正则与 `inputValidator` 函数两种校验，校验失败阻止确认并显示错误文案：

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

## HTML 内容与文案定制

`html: true` 时 message 按 HTML 片段渲染（内容由调用方负责转义，警惕 XSS）；`confirmButtonText` 自定义确认文案，`center` 居中、`showIcon` / `showClose` 控制图标与关闭钮：

<DemoBlock>
  <eb-space wrap>
    <eb-button @click="onHtmlAlert">HTML 内容</eb-button>
    <eb-button @click="onCenterAlert">居中无图标</eb-button>
  </eb-space>
</DemoBlock>

## prompt 预置输入与校验函数

`inputValue` 预置输入框初值，`inputValidator` 返回错误文案即视为不通过，适合带业务规则的输入：

<DemoBlock>
  <eb-button @click="onPresetPrompt">修改导出份数</eb-button>
  <eb-text v-if="exported" size="small" type="success" style="margin-top:8px;display:block">当前份数：{{ exported }}</eb-text>
</DemoBlock>

<script setup>
import { ref } from 'vue'
import { EbMsgbox } from '@wil-works/evoke-business-ui'

const result = ref('')
const renamed = ref('')
const action = ref('')
const exported = ref('')

const onAlert = () => {
  EbMsgbox.alert('该操作需要管理员权限', '权限不足', { type: 'warning' })
}
const onConfirm = async () => {
  try {
    await EbMsgbox.confirm('删除后不可恢复，确认删除该记录？', '删除确认', { type: 'error' })
    result.value = '已确认删除'
  } catch (e) {
    result.value = '已取消'
  }
}
const onPrompt = async () => {
  try {
    const { value } = await EbMsgbox.prompt('请输入分组名称', '新建分组')
    result.value = '分组名：' + value
  } catch (e) {
    result.value = '已取消'
  }
}
const onValidatedPrompt = async () => {
  try {
    const { value } = await EbMsgbox.prompt('请输入新名称', '重命名', {
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
    await EbMsgbox.confirm('内容尚未保存', '离开确认', { distinguishCancelAndClose: true })
    action.value = 'confirm'
  } catch (e) {
    action.value = e?.action
  }
}
const onHtmlAlert = () => {
  EbMsgbox.alert('新版本 <strong>2.4.0</strong> 已发布，本次共更新 <strong>12</strong> 个组件', '更新完成', {
    type: 'success',
    html: true,
    confirmButtonText: '知道了',
  })
}
const onCenterAlert = () => {
  EbMsgbox.alert('会话已过期，请重新登录', '居中提示', { center: true, showIcon: false, showClose: false })
}
const onPresetPrompt = async () => {
  try {
    const { value } = await EbMsgbox.prompt('设置导出份数（1-99）', '导出设置', {
      inputValue: '3',
      inputPlaceholder: '请输入份数',
      inputValidator: (v) => (/^\d+$/.test(v) && Number(v) >= 1 && Number(v) <= 99 ? true : '请输入 1-99 的整数'),
    })
    exported.value = value
  } catch (e) {
    exported.value = ''
  }
}
</script>

## 调用形式

三种重载等价，参数可缺位：`(message, title?, options?)`、`(message, options?)`，也可对象式整体传入 `EbMsgbox({ message, title, showCancelButton: true, ... })`；模板内联可用全局属性 `$msgbox / $alert / $confirm / $prompt`。

<ApiTable title="Msgbox Options" :rows="[
  { name: 'message / title', desc: '内容与标题', type: 'string', default: '' },
  { name: 'type', desc: '类型图标与配色', type: 'success | warning | info | error', default: 'info' },
  { name: 'html', desc: '以 HTML 片段渲染 message（内容由调用方负责转义）', type: 'boolean', default: 'false' },
  { name: 'showIcon / showClose', desc: '显示类型图标 / 右上角关闭钮', type: 'boolean', default: 'true' },
  { name: 'showCancelButton', desc: '显示取消按钮（alert 默认无）', type: 'boolean', default: 'false' },
  { name: 'distinguishCancelAndClose', desc: '区分取消与关闭动作', type: 'boolean', default: 'false' },
  { name: 'confirmButtonText / cancelButtonText', desc: '按钮文案', type: 'string', default: '确定 / 取消' },
  { name: 'confirmButtonClass', desc: '确认按钮类型色（同 Button 的 type）', type: 'string', default: 'primary' },
  { name: 'confirmButtonLoading / cancelButtonLoading', desc: '确认 / 取消按钮 loading（异步校验场景）', type: 'boolean', default: 'false' },
  { name: 'roundButton / buttonSize', desc: '按钮圆角与尺寸', type: 'boolean / string', default: 'false / default' },
  { name: 'center', desc: '内容居中', type: 'boolean', default: 'false' },
  { name: 'closeOnClickModal / closeOnPressEscape', desc: '点遮罩 / ESC 关闭', type: 'boolean', default: 'true' },
  { name: 'inputType / inputValue / inputPlaceholder', desc: 'prompt 输入框类型 / 预置值 / 占位文案', type: 'string', default: '' },
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
