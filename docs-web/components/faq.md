# Faq 手风琴

`EwFaq` 展示常见问题：+/− 指示器、平滑展开动效、默认单开模式。手风琴收起时只占标题高度，
适合放在定价区之后消化购买疑虑。

## 基础用法

<DemoBlock title="单开模式" description="展开一项自动收起其它；再点一次收起。">

<EwFaq
  :items="[
    { question: '免费版可以一直用吗？', answer: '可以。免费版没有时间限制，基础功能永久可用；需要更多空间与协作能力时可随时升级。' },
    { question: '支持哪些平台？', answer: '提供 macOS、Windows、iOS 与 Android 客户端，网页版开箱即用，所有端数据实时同步。' },
    { question: '我的数据安全吗？', answer: '传输与存储全程加密，团队版支持端到端加密空间；你也可以随时导出全部数据迁移。' },
  ]"
/>

```vue
<EwFaq :items="[{ question: '…', answer: '…' }]" />
```

</DemoBlock>

## 多开与默认展开

<DemoBlock title="multiple / default-open" description="multiple 允许多项同时展开；default-open 指定初始展开下标。">

<EwFaq
  multiple
  :default-open="0"
  :items="[
    { question: '支持退款吗？', answer: '付费版支持 7 天无理由退款。' },
    { question: '可以升级档位吗？', answer: '可以，补差价即可升级。' },
  ]"
/>

```vue
<EwFaq multiple :default-open="0" :items="faqs" />
```

</DemoBlock>

## API

### Props

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| items | `[{ question, answer }]` | array | `[]` |
| multiple | 允许多项同时展开 | boolean | `false` |
| default-open | 默认展开的下标（-1 表示全部收起） | number | `-1` |

### 插槽

| 插槽 | 说明 |
| --- | --- |
| answer | 答案覆写（作用域插槽：`{ item, index }`） |
