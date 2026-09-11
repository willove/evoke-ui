# ContactForm 留言表单

`EvContactForm` 是企业站的「联系我们 / 商务合作」表单：称呼 + 邮箱 + 留言三字段，内置
必填与邮箱格式校验（错误即时标红提示），提交派发 `submit` 并切换成功态。表单宽度自适应，
窄屏自动单列。

## 基础用法

<DemoBlock title="校验与成功态" description="试试空提交看校验反馈；填写完整后提交切换成功态。">

<EvContactForm
  button-text="发送留言"
  sent-text="已收到你的留言，会尽快回复！"
  style="max-width:560px;"
/>

```vue
<EvContactForm
  button-text="发送留言"
  @submit="(data) => api.send(data)"
/>
```

</DemoBlock>

::: tip 摆放建议
典型组合：左侧公司信息（地址/邮箱/地图），右侧本表单 —— 外层用两栏 grid 包裹即可。
表单本身不发送请求，数据经 `submit` 事件交给你的接口。
:::

## API

### Props

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| button-text | 提交按钮文案 | string | `'发送留言'` |
| sent-text | 成功态文案 | string | `'已收到你的留言，会尽快回复！'` |

### 插槽

| 插槽 | 说明 |
| --- | --- |
| hint | 提交按钮旁的提示文案（如隐私说明） |
| sent | 成功态文案覆写 |

### 事件

| 事件 | 说明 | 参数 |
| --- | --- | --- |
| submit | 校验通过后派发 | `{ name, email, message }` |

### 暴露方法

| 方法 | 说明 |
| --- | --- |
| reset | 清空并回到填写态 |
