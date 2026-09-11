# PricingCard 定价卡

`EvPricingCard` 是转化链路的核心区块，把产品定价卡的全部要素组件化：右上促销徽章、划线原价、
橙色促销注记、蓝色勾选特性列表与胶囊 CTA。`featured` 深色形态用于主推档位。

## 基础用法

<DemoBlock title="完整定价要素" description="badge / original-price / offer-note / features 按需传入，未传的要素自动精简。">

<div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:16px; align-items:start;">
  <EvPricingCard
    title="免费版"
    description="个人起步的最佳选择。"
    price="¥0"
    :features="['基础编辑器', '3 个团队空间', '社区支持']"
    action-text="免费开始"
  />
  <EvPricingCard
    title="专业版"
    description="为高频创作者准备。"
    price="¥12"
    original-price="¥18"
    offer-note="新用户首年 7 折"
    badge="最受欢迎"
    :features="['无限空间', '离线同步', '版本历史', '优先支持']"
    action-text="立即订阅"
  />
</div>

```vue
<EvPricingCard
  title="专业版"
  price="¥12"
  original-price="¥18"
  offer-note="新用户首年 7 折"
  badge="最受欢迎"
  :features="['无限空间', '离线同步']"
  action-text="立即订阅"
  @action="subscribe()"
/>
```

</DemoBlock>

## 深色主推卡

<DemoBlock title="featured" description="深色渐变卡面在浅色页面上天然聚焦，CTA 自动切换为蓝色实心。">

<div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:16px;">
  <EvPricingCard
    featured
    title="团队版"
    description="5 人起，按团队协作设计。"
    price="¥28"
    original-price="¥40"
    offer-note="年付方案限时 8 折"
    badge="省 30%"
    :features="['专业版全部功能', '共享工作区', '权限管理', '专属客户成功']"
    action-text="联系销售"
  />
</div>

```vue
<EvPricingCard featured title="团队版" price="¥28" action-text="联系销售" />
```

</DemoBlock>

::: tip 与 EvComparisonTable 搭配
档位差异多时，定价卡只保留亮点，完整功能差异交给 [EvComparisonTable](./comparison-table)。
:::

## API

### Props

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| title / description | 标题与描述 | string | — |
| price | 价格文案 | string | — |
| original-price | 划线原价 | string | — |
| offer-note | 橙色促销注记 | string | — |
| badge | 右上角徽章文案 | string | — |
| features | 勾选特性列表 | string[] | `[]` |
| featured | 深色主推形态 | boolean | `false` |
| action-text | 动作按钮文案 | string | — |
| pill | 动作按钮胶囊形态 | boolean | `true` |

### 插槽

| 插槽 | 说明 |
| --- | --- |
| badge / title / description / price / note | 各要素覆写 |
| features | 特性列表覆写 |
| action | 动作按钮覆写 |
| footer | 底部追加内容 |

### 事件

| 事件 | 说明 |
| --- | --- |
| action | 点击动作按钮时派发 |
