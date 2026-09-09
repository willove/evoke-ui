# Newsletter 订阅

`EwNewsletter` 是一体式邮件订阅框：邮箱输入 + 主按钮胶囊合体，focus 浮现主色光环。
提交后自动切换为成功态；真实订阅逻辑在 `subscribe` 事件中接你自己的接口。

## 基础用法

<DemoBlock title="提交与成功态" description="试一试：输入任意邮箱提交，观察成功态切换。">

<EwNewsletter
  placeholder="输入你的邮箱"
  button-text="订阅更新"
  subscribed-text="订阅成功，请查收确认邮件"
/>

```vue
<EwNewsletter
  placeholder="输入你的邮箱"
  button-text="订阅更新"
  @subscribe="(email) => api.subscribe(email)"
/>
```

</DemoBlock>

::: tip 摆放位置
最常见的两个位置：[EwCta](./cta) 的 default 插槽里（转化收尾），或页脚上方独立成段。
:::

## API

### Props

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| placeholder | 占位文案 | string | `'输入你的邮箱'` |
| button-text | 按钮文案 | string | `'订阅'` |
| subscribed-text | 成功态文案 | string | `'订阅成功，请查收确认邮件'` |
| pill | 按钮胶囊形态 | boolean | `true` |

### 插槽

| 插槽 | 说明 |
| --- | --- |
| subscribed | 成功态文案覆写 |

### 事件

| 事件 | 说明 | 参数 |
| --- | --- | --- |
| subscribe | 表单提交（通过浏览器原生 email 校验后） | email |
