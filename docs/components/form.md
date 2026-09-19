# Form 表单

> 移动端：标签上置 + 主按钮吸底的表单范式，参见 [移动端 · 数据录入](/mobile/data-entry)。

<script setup>
import { ref } from 'vue'

const baseForm = ref({ name: '', region: '' })
const inlineForm = ref({ approver: '', status: '', city: '' })
const labelRight = ref('')
const labelLeft = ref('')
const labelTop = ref('')
const sizeLarge = ref('')
const sizeDisabled = ref('')
const manualForm = ref({ host: '', remark: '' })
const nestedForm = ref({ user: { city: '' } })
const loginFormRef = ref(null)
const loginForm = ref({ username: '', password: '', scope: '' })
const loginRules = {
  username: [{ required: true, message: '请输入登录账号', trigger: 'blur' }, { min: 2, max: 32, message: '长度 2 到 32 个字符', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }, { min: 6, message: '密码至少 6 位', trigger: 'blur' }],
  scope: [{ required: true, message: '请选择账号类型', trigger: 'change' }],
}
const loginResult = ref('')
function submitLogin() {
  loginFormRef.value?.validate((ok) => { loginResult.value = ok ? '校验通过，执行登录' : '请先修正标红的字段' })
}
const registerFormRef = ref(null)
const registerForm = ref({ username: '', role: '', password: '', confirm: '' })
const submitting = ref(false)
const registerResult = ref('')
const registerRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }, { min: 3, max: 12, message: '用户名长度为 3 到 12 个字符', trigger: 'blur' }],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }, { min: 6, message: '密码至少 6 位，建议字母加数字', trigger: 'blur' }],
  confirm: [{ required: true, message: '请再次输入密码', trigger: 'blur' }, { validator: validateConfirm, trigger: 'blur' }],
}
function validateConfirm(rule, value, callback) {
  if (!value) return callback(new Error('请再次输入密码'))
  if (value !== registerForm.value.password) return callback(new Error('两次输入的密码不一致'))
  callback()
}
async function submitRegister() {
  try { await registerFormRef.value.validate() } catch { registerResult.value = ''; return }
  submitting.value = true
  await new Promise((resolve) => setTimeout(resolve, 1200))
  submitting.value = false
  registerResult.value = '注册成功，表单已重置'
  registerFormRef.value.resetFields()
}
const revalidateConfirm = () => registerFormRef.value?.validateField('confirm')?.catch(() => {})

const checkFormRef = ref(null)
const checkForm = ref({ email: '', age: undefined })
const checkRules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: ['blur', 'change'] },
  ],
  age: [
    { required: true, message: '请输入年龄', trigger: 'change' },
    { type: 'number', min: 18, max: 60, message: '年龄需在 18 到 60 之间', trigger: 'change' },
  ],
}
const checkResult = ref('')
function handleValidate() {
  checkFormRef.value?.validate((ok, fields) => {
    checkResult.value = ok ? '校验通过' : `校验失败：${Object.values(fields || {})[0]?.[0] ?? '存在不合法字段'}`
  })
}
function handleClearValidate() {
  checkFormRef.value?.clearValidate()
  checkResult.value = ''
}
function handleReset() {
  checkFormRef.value?.resetFields()
  checkResult.value = ''
}

const eventFormRef = ref(null)
const eventForm = ref({ name: '', email: '' })
const eventRules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  email: [{ type: 'email', message: '邮箱格式不正确', trigger: 'blur' }],
}
const eventStatus = ref('')
function onFormFinish(values) {
  eventStatus.value = `finish：${JSON.stringify(values)}`
}
function onFormFinishFailed({ errors }) {
  const first = Object.values(errors || {})[0]
  eventStatus.value = `finish-failed：${first ?? '存在校验失败字段'}`
}
</script>

表单容器与表单项：`model` + `rules`（async-validator 格式）声明式校验，blur / change 时机自动触发，错误信息内联展示，支持 label 位置与宽度、行内布局、尺寸与禁用注入。FormItem 挂载时向 Form 注册（携带 prop），校验与重置按字段管理；`prop` 对应 `model` 中的字段路径，支持 a.b.c 嵌套。

## 基础用法

`prop` 对应 `model` 中的字段路径；规则通过 `trigger: 'blur' | 'change'` 声明校验时机，控件失焦或值变化时自动校验并在字段下方内联展示错误。

<DemoBlock>
  <eb-form ref="demoForm" :model="baseForm"
    :rules="{ name: [{ required: true, message: '请输入姓名', trigger: 'blur' }], region: [{ required: true, message: '请选择地区', trigger: 'change' }] }"
    label-width="80px">
    <eb-form-item label="姓名" prop="name"><eb-input v-model="baseForm.name" placeholder="请输入姓名" /></eb-form-item>
    <eb-form-item label="地区" prop="region"><eb-select v-model="baseForm.region" placeholder="请选择地区" style="width: 200px;"><eb-option label="华东" value="east" /><eb-option label="华南" value="south" /></eb-select></eb-form-item>
    <eb-form-item><eb-button @click="$refs.demoForm.resetFields()">重置</eb-button></eb-form-item>
  </eb-form>
</DemoBlock>

## 典型场景：登录表单

中后台表单页的推荐布局：`label-position="right"`（默认）配合固定 `label-width`，标签尾端与输入框对齐、间距一致，视线往返最短；校验时机按控件类型分开声明，文本类字段用 `blur`（输完即验，输入过程不打断）、选择类字段用 `change`（选中即反馈），同一字段的多条规则可各自声明 trigger；错误由 FormItem 在字段下方内联渲染（is-error 红字），占位稳定不引起布局跳动，提交时用 `validate` 统一拦截。

<DemoBlock>
  <eb-form ref="loginFormRef" :model="loginForm" :rules="loginRules" label-position="right" label-width="80px" style="max-width: 380px;">
    <eb-form-item label="登录账号" prop="username"><eb-input v-model="loginForm.username" placeholder="工号 / 邮箱" /></eb-form-item>
    <eb-form-item label="密码" prop="password"><eb-input v-model="loginForm.password" type="password" placeholder="至少 6 位" /></eb-form-item>
    <eb-form-item label="账号类型" prop="scope"><eb-select v-model="loginForm.scope" placeholder="选择类字段用 change 校验" style="width: 100%;"><eb-option label="主账号" value="master" /><eb-option label="子账号" value="sub" /></eb-select></eb-form-item>
    <eb-form-item><eb-button type="primary" @click="submitLogin">登录</eb-button></eb-form-item>
  </eb-form>
  <div style="margin-top: 8px;">{{ loginResult || '留空提交体验内联错误与提交拦截' }}</div>
</DemoBlock>

## 综合示例：注册表单

覆盖两种字段类型（输入框 + 下拉选择）；确认密码用自定义 `validator`，async-validator 协议：失败 `callback(new Error('文案'))`，通过 `callback()`，也可返回 `Promise.reject(new Error('文案'))`；提交按钮 `loading` 防重复提交，`validate` 全通过后再发请求，成功后 `resetFields` 还原初始值并清除校验；密码变化时用 `validateField('confirm')` 联动复检确认密码（返回 Promise 失败会 reject，需 catch 静默）。

<DemoBlock>
  <eb-form ref="registerFormRef" :model="registerForm" :rules="registerRules" label-width="90px" style="max-width: 400px;">
    <eb-form-item label="用户名" prop="username"><eb-input v-model="registerForm.username" placeholder="3 到 12 个字符" /></eb-form-item>
    <eb-form-item label="角色" prop="role"><eb-select v-model="registerForm.role" placeholder="请选择角色" style="width: 100%;"><eb-option label="管理员" value="admin" /><eb-option label="成员" value="member" /></eb-select></eb-form-item>
    <eb-form-item label="密码" prop="password"><eb-input v-model="registerForm.password" type="password" placeholder="至少 6 位" @change="revalidateConfirm" /></eb-form-item>
    <eb-form-item label="确认密码" prop="confirm"><eb-input v-model="registerForm.confirm" type="password" placeholder="再次输入密码" /></eb-form-item>
    <eb-form-item>
      <eb-button type="primary" :loading="submitting" @click="submitRegister">注册</eb-button>
      <eb-button style="margin-left: 8px;" @click="registerFormRef?.resetFields()">重置</eb-button>
    </eb-form-item>
  </eb-form>
  <div style="margin-top: 8px;">{{ registerResult || '故意让两次密码不一致，体验自定义校验' }}</div>
</DemoBlock>

## 行内表单

`inline` 让表单项横向排列，适合筛选栏：字段少且标签短时可用 `label-position="left"` 让标签左对齐，字段过多换行后布局依旧稳定；`label-width` 与 `label-position` 均可在 FormItem 上单独覆盖。

<DemoBlock>
  <eb-form inline>
    <eb-form-item label="审批人"><eb-input v-model="inlineForm.approver" placeholder="审批人" /></eb-form-item>
    <eb-form-item label="状态"><eb-select v-model="inlineForm.status" placeholder="状态" style="width: 140px;"><eb-option label="已通过" value="passed" /><eb-option label="已驳回" value="rejected" /></eb-select></eb-form-item>
    <eb-form-item label="城市"><eb-select v-model="inlineForm.city" placeholder="城市" style="width: 140px;"><eb-option label="杭州" value="hangzhou" /><eb-option label="上海" value="shanghai" /></eb-select></eb-form-item>
  </eb-form>
</DemoBlock>

## 标签位置

`label-position` 三态选型：`right`（默认）是表单页首选，标签与输入框起始位置固定、逐行扫读最快；`left` 适合筛选栏与标签长短不一的工具条，视觉重心平稳；`top` 适合标签文案较长或容器较窄的场景（抽屉、弹窗、移动端），以纵向空间换横向空间。非 top 位置需配合 `label-width` 固定标签宽度。

<DemoBlock>
  <eb-form label-position="right" label-width="80px" style="max-width: 340px;"><eb-form-item label="右侧标签"><eb-input v-model="labelRight" placeholder="right，默认" /></eb-form-item></eb-form>
  <eb-form label-position="left" label-width="80px" style="max-width: 340px;"><eb-form-item label="左侧标签"><eb-input v-model="labelLeft" placeholder="left" /></eb-form-item></eb-form>
  <eb-form label-position="top" style="max-width: 340px;"><eb-form-item label="顶部标签"><eb-input v-model="labelTop" placeholder="top" /></eb-form-item></eb-form>
</DemoBlock>

## 尺寸与禁用

`size` 统一注入表单内全部控件的尺寸，`disabled` 注入禁用态，FormItem 上的同名属性可单独覆盖。

<DemoBlock>
  <eb-form size="large" label-width="70px" style="max-width: 340px;"><eb-form-item label="大型"><eb-input v-model="sizeLarge" placeholder="large" /></eb-form-item></eb-form>
  <eb-form disabled label-width="70px" style="max-width: 340px;"><eb-form-item label="禁用表单"><eb-input v-model="sizeDisabled" placeholder="整表禁用" /></eb-form-item></eb-form>
</DemoBlock>

## 手动错误信息与必填星号

FormItem `error` 直接指定错误文案并覆盖校验结果；`required` 只控制必填星号展示，不参与校验；Form `hide-required-asterisk` 全局隐藏星号，`inline-message` 让错误信息行内展示。

<DemoBlock>
  <eb-form label-width="90px" style="max-width: 380px;">
    <eb-form-item label="服务地址" prop="host" required error="地址需以 https:// 开头"><eb-input v-model="manualForm.host" placeholder="error 属性手动指定错误信息" /></eb-form-item>
    <eb-form-item label="备注" prop="remark"><eb-input v-model="manualForm.remark" placeholder="required 只显示星号，不参与校验" /></eb-form-item>
  </eb-form>
</DemoBlock>

## 嵌套字段路径

`prop` 支持 a.b.c 路径，rules 的 key 使用同样的路径字符串，深层对象字段无需拍平；`#label` 插槽可自定义标签内容。

<DemoBlock>
  <eb-form :model="nestedForm" :rules="{ 'user.city': [{ required: true, message: '请选择所在城市', trigger: 'change' }] }" label-width="80px" style="max-width: 380px;">
    <eb-form-item label="所在城市" prop="user.city"><eb-select v-model="nestedForm.user.city" placeholder="prop 支持 a.b.c 路径" style="width: 220px;"><eb-option label="杭州" value="hangzhou" /><eb-option label="深圳" value="shenzhen" /></eb-select></eb-form-item>
  </eb-form>
</DemoBlock>

## 表单校验

完整校验流程示例：`rules` 声明 required / type / min / max 等规则（async-validator 格式），blur、change 时机自动触发内联报错；提交前 `validate` 统一校验（回调可拿到失败字段集合），`clearValidate` 只清除报错不动数据，`resetFields` 还原初始值并清报错。

<DemoBlock>
  <eb-form ref="checkFormRef" :model="checkForm" :rules="checkRules" label-width="70px" style="max-width: 380px;">
    <eb-form-item label="邮箱" prop="email">
      <eb-input v-model="checkForm.email" placeholder="name@example.com" />
    </eb-form-item>
    <eb-form-item label="年龄" prop="age">
      <eb-input-number v-model="checkForm.age" :min="1" :max="99" placeholder="18 - 60" style="width: 100%;" />
    </eb-form-item>
    <eb-form-item>
      <eb-button type="primary" @click="handleValidate">提交校验</eb-button>
      <eb-button style="margin-left: 8px;" @click="handleClearValidate">清除校验</eb-button>
      <eb-button style="margin-left: 8px;" @click="handleReset">重置表单</eb-button>
    </eb-form-item>
  </eb-form>
  <p v-if="checkResult" style="margin: 8px 0 0; font-size: 13px; color: var(--eb-text-color-secondary);">{{ checkResult }}</p>
</DemoBlock>

## 提交事件

Form 根元素收口原生 submit：回车或 `native-type="submit"` 按钮触发时自动先跑 `validate`，全部通过触发 `finish`（负载为 model 副本），存在失败触发 `finish-failed`（负载 `values` 与 `errors`），页面不会真实提交；配合 `scroll-to-error` 在失败时自动滚到第一个错误项。任一字段值变化还会触发 `values-change`，负载为本次变化字段的最小集与全量值。

<DemoBlock>
  <eb-form ref="eventFormRef" :model="eventForm" :rules="eventRules" label-width="80px" style="max-width: 380px;" scroll-to-error @finish="onFormFinish" @finish-failed="onFormFinishFailed">
    <eb-form-item label="姓名" prop="name"><eb-input v-model="eventForm.name" placeholder="必填" /></eb-form-item>
    <eb-form-item label="邮箱" prop="email"><eb-input v-model="eventForm.email" placeholder="选填，格式需合法" /></eb-form-item>
    <eb-form-item><eb-button native-type="submit" type="primary">提交</eb-button></eb-form-item>
  </eb-form>
  <div style="margin-top: 8px;">{{ eventStatus || '留空回车提交体验 finish-failed，填写后提交体验 finish' }}</div>
</DemoBlock>

## API

<ApiTable title="Form Props" :rows="[
  { name: 'model', desc: '表单数据对象，校验与重置的数据源', type: 'object', default: '{}' },
  { name: 'rules', desc: '校验规则（async-validator 格式），key 为字段 prop', type: 'object', default: '{}' },
  { name: 'labelPosition', desc: 'label 位置（item 可覆盖）', type: 'left | right | top', default: 'right' },
  { name: 'labelWidth', desc: 'label 宽度（item 可覆盖）', type: 'string | number', default: '空' },
  { name: 'inline', desc: '行内布局', type: 'boolean', default: 'false' },
  { name: 'disabled', desc: '禁用注入（全部表单控件）', type: 'boolean', default: 'false' },
  { name: 'size', desc: '控件尺寸注入', type: 'large | default | small', default: '空' },
  { name: 'showMessage', desc: '显示校验错误信息', type: 'boolean', default: 'true' },
  { name: 'inlineMessage', desc: '错误信息行内展示', type: 'boolean', default: 'false' },
  { name: 'statusIcon', desc: '校验状态图标（预留，当前 FormItem 未消费）', type: 'boolean', default: 'false' },
  { name: 'scrollToError', desc: '校验失败自动滚动到第一个错误项（validate 与原生 submit 链路生效）', type: 'boolean', default: 'false' },
  { name: 'hideRequiredAsterisk', desc: '隐藏必填星号', type: 'boolean', default: 'false' },
  { name: 'validateOnRuleChange', desc: 'rules 变化时自动重新校验', type: 'boolean', default: 'true' },
  { name: 'ripple', desc: '批量关闭表单内所有输入类组件的激活涟漪动效（组件级 ripple prop 可单独关闭；全局见 setRipple）', type: 'boolean', default: 'true' },
]" />

<ApiTable title="Form Events" :rows="[
  { name: 'finish', desc: '原生 submit（回车或 native-type=submit 按钮）校验全部通过后触发，负载为 model 副本', type: '(values: object) => void', default: '—' },
  { name: 'finish-failed', desc: '原生 submit 校验失败后触发', type: '({ values, errors }) => void', default: '—' },
  { name: 'values-change', desc: '任一字段值变化时触发（change 校验链路收口）', type: '(changedValues, allValues) => void', default: '—' },
]" />

<ApiTable title="FormItem Props" :rows="[
  { name: 'prop', desc: 'model 字段路径（支持 a.b.c，未设置则不参与整体校验）', type: 'string', default: '空' },
  { name: 'label', desc: 'label 文本', type: 'string', default: '空' },
  { name: 'labelWidth', desc: '覆盖 form 的 label 宽度', type: 'string | number', default: '继承 form' },
  { name: 'labelPosition', desc: '覆盖 form 的 label 位置', type: 'left | right | top', default: '继承 form' },
  { name: 'required', desc: '强制显示必填星号（不参与校验）', type: 'boolean', default: 'undefined' },
  { name: 'rules', desc: '覆盖 form.rules 中该字段的规则', type: 'object | array', default: 'undefined' },
  { name: 'error', desc: '手动错误信息（覆盖校验结果）', type: 'string', default: '空' },
  { name: 'showMessage', desc: '是否显示错误信息', type: 'boolean', default: '继承 form' },
  { name: 'inlineMessage', desc: '错误信息行内展示', type: 'boolean', default: '继承 form' },
  { name: 'size', desc: '表单项尺寸（向下注入控件）', type: 'string', default: '继承 form' },
]" />

<ApiTable title="Slots" :rows="[
  { name: 'default', desc: 'Form / FormItem 的控件内容', type: '—', default: '—' },
  { name: 'label', desc: '自定义标签内容（仅 FormItem）', type: '—', default: 'label 文本' },
]" />

<ApiTable title="Form Methods" :rows="[
  { name: 'validate', desc: '校验全部字段，全通过 resolve(true)，失败 reject({ prop: message })；也支持回调风格 callback(ok, invalidFields)', type: '(callback?) => Promise<boolean>', default: '—' },
  { name: 'validateField', desc: '校验指定字段（单个 prop 或数组），返回值语义同 validate', type: '(props, callback?) => Promise<boolean>', default: '—' },
  { name: 'resetFields', desc: '重置全部字段为初始值并清除校验', type: '() => void', default: '—' },
  { name: 'clearValidate', desc: '清除校验状态，可传 prop 数组，缺省清全部', type: '(props?) => void', default: '—' },
  { name: 'scrollToField', desc: '平滑滚动到指定字段', type: '(prop) => void', default: '—' },
  { name: 'fields', desc: '已注册的 FormItem 实例列表（含 validateState 等内部状态）', type: 'array', default: '[]' },
]" />

<ApiTable title="FormItem Methods" :rows="[
  { name: 'validate', desc: '触发校验，trigger 可为 blur / change 或空（不过滤），成功 resolve(true)，失败 reject({ prop: message })', type: '(trigger?) => Promise<boolean>', default: '—' },
  { name: 'resetField', desc: '重置为初始值并清除校验', type: '() => void', default: '—' },
  { name: 'clearValidate', desc: '仅清除校验状态', type: '() => void', default: '—' },
  { name: 'scrollToField', desc: '滚动到当前项', type: '() => void', default: '—' },
  { name: 'validateState / validateMessage', desc: '当前校验状态与错误信息（响应式）', type: 'string / string', default: '空' },
]" />
