# Quote 评价

`EwQuote` 展示用户评价与引用文案，适合放在介绍页的收尾位置赢得信任。自带引号装饰与署名结构；
`sticker` 开启贴纸描边，适合轻快的品牌语境。

## 基础用法

<DemoBlock title="署名 + 来源链接" description="source/source-href 组成右侧来源链接，自动带外链图标。">

<div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(260px,1fr)); gap:16px;">
  <EwQuote
    quote="把整个团队的文档搬进来之后，找东西的时间少了一半，写作体验也是最接近纸面的一款。"
    author="林一舟"
    role="产品设计师"
    source="少数派"
    source-href="#"
  />
  <EwQuote
    sticker
    quote="离线同步稳得出奇，高铁上写完的稿子回到网络自动出现在电脑上。"
    author="Wen"
    role="自由撰稿人"
  />
</div>

```vue
<EwQuote
  quote="…"
  author="林一舟"
  role="产品设计师"
  source="少数派"
  source-href="https://…"
/>
<EwQuote quote="…" author="Wen" sticker />
```

</DemoBlock>

::: tip 组合建议
三张以上评价并排时，中间一张用 `sticker` 变化节奏；配合 [EwAvatar](./avatar) 可在署名区加头像（经 author 插槽）。
:::

## API

### Props

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| quote | 引用内容 | string | — |
| author | 署名 | string | — |
| role | 身份/角色 | string | — |
| source | 来源名称 | string | — |
| source-href | 来源链接 | string | — |
| sticker | 贴纸描边形态 | boolean | `false` |

### 插槽

| 插槽 | 说明 |
| --- | --- |
| default | 引用内容覆写 |
| author | 署名区覆写（可放头像） |
