# ArticleCard 文章卡

`EwArticleCard` 展示博客文章、公司动态或教程条目：封面（缺省为图标占位底）+ 日期与标签
元信息 + 两行截断的标题与摘要。`tag="a"` 整卡可点击，配合多列 grid 构成博客列表页。

## 基础用法

<DemoBlock title="文章列表三连" description="无封面时用图标占位底；有封面时 hover 缓慢放大。">

<div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:16px;">
  <EwArticleCard
    title="从 0 到 1 搭建团队知识库"
    excerpt="工具选型、目录设计与冷启动策略，一次讲清知识库落地。"
    date="2026-09-01"
    :tags="['最佳实践']"
    icon="brush-line"
  />
  <EwArticleCard
    title="远程协作的 12 个小习惯"
    excerpt="异步优先的沟通节奏，让分布在世界各地的团队保持同频。"
    date="2026-08-18"
    :tags="['团队', '效率']"
    icon="device-line"
  />
  <EwArticleCard
    title="版本 2.0 发布说明"
    excerpt="全新编辑器内核与团队空间，同步引擎性能提升 60%。"
    date="2026-09-01"
    :tags="['更新']"
    icon="flashlight-line"
  />
</div>

```vue
<EwArticleCard
  title="从 0 到 1 搭建团队知识库"
  excerpt="…"
  date="2026-09-01"
  :tags="['最佳实践']"
  icon="brush-line"
  tag="a"
  href="/blog/1"
/>
```

</DemoBlock>

## API

### Props

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| title | 标题（最多两行截断） | string | — |
| excerpt | 摘要（最多两行截断） | string | — |
| cover | 封面图地址 | string | — |
| icon | 无封面时的占位图标 | string | `'compass-3-line'` |
| date | 日期文案 | string | — |
| tags | 标签列表 | string[] | `[]` |
| href | 链接地址（tag 为 `'a'` 时生效） | string | — |
| tag | 渲染标签 | string | `'article'` |
| hoverable | 悬浮上浮 + 封面缩放 | boolean | `true` |

### 插槽

| 插槽 | 说明 |
| --- | --- |
| title / excerpt | 标题/摘要覆写 |
