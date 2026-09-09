# Field 字段包装

`EwField` 是表单字段的排版外壳：标签 + 控件插槽 + 错误/提示文案。它不接管值与校验，
只负责一个字段的视觉结构 —— 与 [EwInput](./input) / [EwTextarea](./textarea) /
[EwSelect](./select) 任意组合出前台提交表单。

## 基础用法

<DemoBlock title="标签 / 必填星标 / 错误与提示" description="error 传非空字符串即进入错误态，并隐藏 hint。">

<div style="display:flex; flex-direction:column; gap:20px; max-width:440px;">
  <EwField label="称呼" required>
    <EwInput placeholder="怎么称呼你" />
  </EwField>
  <EwField label="邮箱" hint="仅用于回复，不会公开">
    <EwInput type="email" icon="mail" placeholder="you@example.com" />
  </EwField>
  <EwField label="邮箱" error="邮箱格式不正确">
    <EwInput model-value="not-an-email" error />
  </EwField>
</div>

```vue
<EwField label="称呼" required>
  <EwInput v-model="name" />
</EwField>
<EwField label="邮箱" hint="仅用于回复，不会公开">
  <EwInput v-model="email" type="email" />
</EwField>
<EwField label="邮箱" :error="emailError">
  <EwInput v-model="email" :error="!!emailError" />
</EwField>
```

</DemoBlock>

::: tip 与 EwContactForm 的分工
三个字段以内的简单联系表单直接用 [EwContactForm](./contact-form)（已内置校验与成功态）；
字段更多或需要自定义校验流程时，用 EwField + 各输入组件自由组装。
:::

## API

### Props

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| label | 字段标签 | string | — |
| error | 错误提示（非空即错误态） | string | — |
| hint | 提示文案（有 error 时隐藏） | string | — |
| required | 必填星标 | boolean | `false` |

### 插槽

| 插槽 | 说明 |
| --- | --- |
| default | 控件区（放任意输入组件） |
| label / hint | 标签/提示覆写 |
