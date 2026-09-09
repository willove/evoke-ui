<script setup>
import AppCreateForm from '../../examples/ebui-example-step-form/src/pages/AppCreateForm.vue'
import appCreateFormSource from '../../examples/ebui-example-step-form/src/pages/AppCreateForm.vue?raw'
</script>

# 分步表单

开放平台「新建应用」式的向导页：把长表单拆成三步收集 → 复核 → 提交，每步独立校验，回退不丢数据，提交后进入结果页展示一次性凭证。此示例覆盖 Form 校验的 Promise 用法、Steps 的受控驱动和 Result 结果页的组合。

<a class="bd-live-link" href="/examples/live/step-form">在全屏示例中心打开「分步表单」</a>

## 在线预览

试试：第一步名称留空点「下一步」（被校验拦下）、第二步勾掉全部能力（至少一项）、回调地址填非 http(s) 格式；走完三步提交拿到 AppId / AppSecret。

<DocExample :code="appCreateFormSource">
  <AppCreateForm />
</DocExample>

## 组件构成

| 组件 | 在本场景中的角色 |
| --- | --- |
| Steps / Step | 步骤指示（`active` 为普通 prop，由父层状态驱动，不支持 `v-model:active`） |
| Form + FormItem | 每步一个独立 `model` 与 `rules`；`validate()` 失败走 reject，需捕获 |
| Input / Textarea | 名称（maxlength + 字数统计）、简介多行输入 |
| RadioGroup / CheckboxGroup | 应用类型单选、开通能力多选（`v-model` 均绑定 `label` 值，多选为数组） |
| InputNumber / Switch | 频率限制（min/max/step 钳制）、签名校验开关（active/inactive-text） |
| Alert | 第三步计费警示条（`show-icon` + 不可关闭） |
| DetailDescriptions | 确认页配置式回显（支持点路径取值与 `span` 跨列） |
| Result | 成功结果页（`#extra` 操作区 + 默认插槽放凭证卡片） |
| Message | 校验拦截、提交成功、复制反馈 |
| PageHeader / SectionCard | 页头与容器 |

## 关键实现说明

**每步独立校验，通过才前进**。三个步骤共用一个 `stepIndex`，「下一步」只校验当前步的 form 实例：

```js
async function next() {
  const formRef = stepIndex.value === 0 ? form0Ref.value : form1Ref.value
  try {
    await formRef.validate()
  } catch {
    EvMessage.warning('请先完善当前步骤的必填信息')
    return
  }
  stepIndex.value++
}
```

**v-show 而不是 v-if**。三个步骤的表单始终挂载：回退时已填值天然保留，`formRef` 也不会因卸载变成 undefined。

**确认页零成本回显**。用 `computed` 把两个表单模型投影成 `confirmData`（枚举值翻译成文案、数组 join），DetailDescriptions 按 `items` 配置渲染，不写一行重复模板。

**重置要清校验**。「再创建一个」除了重置 model，还必须对两个 form 调 `clearValidate()`，否则残留的红字会跟着新表单出现。

## 本地运行

```bash
pnpm example:ebui-step-form   # http://localhost:8623
```

```text
examples/ebui-example-step-form/
  src/
    App.vue
    pages/
      AppCreateForm.vue       # 本页预览的源码（含分步状态机与校验规则）
```

## 接入真实业务

- `submit()` 里的 setTimeout 换成创建接口；`AppSecret` 这类一次性凭证只在结果页内存态展示，不落 store；
- 步骤数增减只改 `steps` 数组与 `stepIndex` 边界（`stepIndex < 2` 改成 `< steps.length - 1`）；
- 需要草稿续填时，把 `base / capability` 的初始化从接口快照恢复，再 `stepIndex` 跳到上次停留步。
