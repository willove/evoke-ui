# Cta 行动召唤

`EwCta` 是页面的转化收尾区：窄容器居中排版，默认铺 hero 同款淡蓝灰光带，把访客的注意力
收束到最后一组动作按钮上。通常放在 FAQ 之后、页脚之前。

## 基础用法

<DemoBlock title="标题 + 描述 + 动作" description="tinted 关闭后为透明底，适合已经处于光带区块内的场景。">

<EwCta
  title="现在就开始"
  description="免费创建你的第一个空间，无需信用卡。"
>
  <template #actions>
    <EwButton size="large" pill>免费开始</EwButton>
    <EwButton size="large" variant="outline">联系销售</EwButton>
  </template>
</EwCta>

```vue
<EwCta title="现在就开始" description="…">
  <template #actions>
    <EwButton size="large" pill>免费开始</EwButton>
  </template>
</EwCta>
```

</DemoBlock>

## API

### Props

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| title | 标题 | string | — |
| description | 描述 | string | — |
| tinted | 淡蓝灰光带底 | boolean | `true` |
| container | 内部容器宽度档 | `'narrow' \| 'default' \| 'wide' \| 'full'` | `'narrow'` |

### 插槽

| 插槽 | 说明 |
| --- | --- |
| title / description | 标题/描述覆写 |
| actions | 动作按钮区 |
| default | 主体追加内容（如 [EwNewsletter](./newsletter)） |
