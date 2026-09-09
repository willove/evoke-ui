# Card 卡片

`EwCard` 是官网区块内容的容器。三种卡面风格对应不同的展示场景：`tone` 粉彩底适合功能亮点与作品展示，
`sticker` 厚白描边营造轻快的贴纸质感，`featured` 深色渐变在浅色页面上天然成为视觉焦点。

## 粉彩与贴纸

<DemoBlock title="tone 粉彩底 × sticker 厚白描边" description="cream / blue / mint / pink / lime 五种粉彩底；sticker 加 3px 白描边与轻投影。">

<div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:16px;">
  <EwCard tone="cream" sticker>
    <h4 style="margin-bottom:6px;">灵感收集</h4>
    <p style="font-size:13px;">奶油底 + 厚白描边<br />网页剪藏、随手速记</p>
    <div style="margin-top:12px; display:flex; gap:8px;">
      <EwTag tone="primary" size="small">新功能</EwTag>
      <EwTag size="small" icon="star-fill">热门</EwTag>
    </div>
  </EwCard>
  <EwCard tone="blue" sticker>
    <h4 style="margin-bottom:6px;">团队空间</h4>
    <p style="font-size:13px;">淡蓝底贴纸卡<br />共享文档与评论协作</p>
  </EwCard>
  <EwCard tone="mint" hoverable>
    <h4 style="margin-bottom:6px;">端到端加密</h4>
    <p style="font-size:13px;">薄荷底 + 悬浮轻抬</p>
  </EwCard>
</div>

```vue
<EwCard tone="cream" sticker>…</EwCard>
<EwCard tone="mint" hoverable>…</EwCard>
```

</DemoBlock>

## 深色精选卡

<DemoBlock title="featured" description="深色渐变 + 主色光晕，适合定价主推档与关键亮点；内部标题与正文自动切换浅色。">

<EwCard featured style="max-width:420px;">
  <h3 style="margin-bottom:8px;">专业版</h3>
  <p style="font-size:13px;">深色渐变卡面，在浅色页面上天然成为视觉焦点。</p>
  <div style="margin-top:16px;">
    <EwButton pill>升级专业版</EwButton>
  </div>
</EwCard>

```vue
<EwCard featured>…</EwCard>
```

</DemoBlock>

::: tip 可点击卡片
`tag="a"` 渲染为链接卡；搭配 `hoverable` 即获得悬浮轻抬反馈。自定义底色用 `custom-bg` 覆写 tone。
:::

## API

### Props

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| tone | 粉彩底色 | `'plain' \| 'soft' \| 'cream' \| 'blue' \| 'mint' \| 'pink' \| 'lime'` | `'plain'` |
| sticker | 厚白描边贴纸风 | boolean | `false` |
| featured | 深色精选形态 | boolean | `false` |
| hoverable | 悬浮轻抬 | boolean | `false` |
| flat | 去边框与阴影（嵌入场景） | boolean | `false` |
| tag | 渲染标签（可传 `'a'`） | string | `'div'` |
| custom-bg | 自定义底色（覆盖 tone） | string | — |

### 插槽

| 插槽 | 说明 |
| --- | --- |
| default | 卡片内容 |
