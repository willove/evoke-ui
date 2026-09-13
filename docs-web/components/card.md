# Card 卡片

`EvCard` 是官网区块内容的容器。三种卡面风格对应不同的展示场景：`tone` 粉彩底适合功能亮点与作品展示，
`sticker` 厚白描边营造轻快的贴纸质感，`featured` 深色渐变在浅色页面上天然成为视觉焦点。

## 粉彩与贴纸

<DemoBlock title="tone 粉彩底 × sticker 厚白描边" description="cream / blue / mint / pink / lime 五种粉彩底；sticker 加 3px 白描边与轻投影。">

<div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:16px;">
  <EvCard tone="cream" sticker>
    <h4 style="margin-bottom:6px;">灵感收集</h4>
    <p style="font-size:13px;">奶油底 + 厚白描边<br />网页剪藏、随手速记</p>
    <div style="margin-top:12px; display:flex; gap:8px;">
      <EvTag tone="primary" size="small">新功能</EvTag>
      <EvTag size="small" icon="star-fill">热门</EvTag>
    </div>
  </EvCard>
  <EvCard tone="blue" sticker>
    <h4 style="margin-bottom:6px;">团队空间</h4>
    <p style="font-size:13px;">淡蓝底贴纸卡<br />共享文档与评论协作</p>
  </EvCard>
  <EvCard tone="mint" hoverable>
    <h4 style="margin-bottom:6px;">端到端加密</h4>
    <p style="font-size:13px;">薄荷底 + 悬浮轻抬</p>
  </EvCard>
</div>

```vue
<EvCard tone="cream" sticker>…</EvCard>
<EvCard tone="mint" hoverable>…</EvCard>
```

</DemoBlock>

## 深色精选卡

<DemoBlock title="featured" description="深色渐变 + 主色光晕，适合定价主推档与关键亮点；内部标题与正文自动切换浅色。">

<EvCard featured style="max-width:420px;">
  <h3 style="margin-bottom:8px;">专业版</h3>
  <p style="font-size:13px;">深色渐变卡面，在浅色页面上天然成为视觉焦点。</p>
  <div style="margin-top:16px;">
    <EvButton pill>升级专业版</EvButton>
  </div>
</EvCard>

```vue
<EvCard featured>…</EvCard>
```

</DemoBlock>

::: tip 可点击卡片
`tag="a"` 渲染为链接卡；搭配 `hoverable` 即获得悬浮轻抬反馈。自定义底色用 `custom-bg` 覆写 tone。
:::

## 磨砂玻璃

<DemoBlock title="glass 叠层" description="渐变底上的两张玻璃卡；glass 三态：true 强制开 / false 强制关 / 缺省跟随全局。">

<div style="background:linear-gradient(135deg, #6fb1ff, #a678ff 55%, #ff9ac3); border-radius:14px; padding:24px; display:grid; gap:14px;">
  <EvCard glass>
    <p style="font-weight:600;">玻璃卡 A</p>
    <p style="font-size:13px;">半透明底 + 背景模糊，透出渐变底色。</p>
  </EvCard>
  <EvCard glass style="margin-left:36px;">
    <p style="font-weight:600;">玻璃卡 B（错位叠放）</p>
    <p style="font-size:13px;">上下叠加时透出彼此的边缘，层次立刻出来。</p>
  </EvCard>
</div>

```vue
<EvCard glass>半透明卡片</EvCard>
<EvCard :glass="false">显式退回实底</EvCard>
```

</DemoBlock>

## API

### Props

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| tone | 粉彩底色 | `'plain' \| 'soft' \| 'cream' \| 'blue' \| 'mint' \| 'pink' \| 'lime'` | `'plain'` |
| sticker | 厚白描边贴纸风 | boolean | `false` |
| featured | 深色精选形态 | boolean | `false` |
| hoverable | 悬浮轻抬 | boolean | `false` |
| flat | 去边框与阴影（嵌入场景） | boolean | `false` |
| glass | 磨砂玻璃质感（粉彩 tone / sticker / featured 不参与）；缺省跟随全局（ConfigProvider glass） | boolean | — |
| blur | 磨砂强度（px），内联覆盖 `--ev-glass-blur` | string / number | — |
| tag | 渲染标签（可传 `'a'`） | string | `'div'` |
| custom-bg | 自定义底色（覆盖 tone） | string | — |

### 插槽

| 插槽 | 说明 |
| --- | --- |
| default | 卡片内容 |
