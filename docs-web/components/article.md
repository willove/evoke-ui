# Article 文章内容

`EvArticle` 为长文阅读设计：页头（眉题 + 标题 + 摘要 + 元信息行）与正文插槽，
正文插槽自带阅读排版——标题刻度、1.85 行高、引用块、列表、行内代码与图片圆角，
排版全部收敛在组件作用域内，不污染页面。

## 基础用法

<DemoBlock title="标题 + 元信息 + 正文排版" description="正文插槽内的 h2 / p / blockquote / ul 已按阅读节奏排好，直接写内容即可。">

<EvArticle
  eyebrow="发布说明"
  title="Evoke UI v0.10：把官网拆成组件的艺术"
  description="从组件粒度到令牌边界，一次开源组件库 API 设计的完整复盘。"
  author="林一舟"
  date="2026 年 9 月 11 日"
  read-time="8 min"
  :tags="['组件设计', 'v0.10']"
>
  <p>官网和应用的分水岭在于：<strong>应用强调密度，官网强调呼吸</strong>。所以我们把行高放宽到 1.85，把标题做成细字重展示体。</p>
  <h2>组件粒度的取舍</h2>
  <p>粒度过细会让组合成本爆炸，过粗又失去灵活性。我们的原则是：能被一句话描述的才配成为一个组件。</p>
  <blockquote>安静优雅不是没有设计，而是设计完退到了内容后面。</blockquote>
  <ul>
    <li>57 个组件，全部支持明暗双主题</li>
    <li>一行令牌即可换主色</li>
  </ul>
</EvArticle>

```vue
<EvArticle
  eyebrow="发布说明"
  title="Evoke UI v0.10"
  author="林一舟"
  date="2026 年 9 月 11 日"
  read-time="8 min"
  :tags="['组件设计']"
>
  <p>正文内容，自带阅读排版。</p>
</EvArticle>
```

</DemoBlock>

## API

### Props

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| title | 标题 | string | `''` |
| description | 摘要导语 | string | `''` |
| eyebrow | 眉题（大写字距小标签） | string | `''` |
| author | 作者 | string | `''` |
| avatar | 作者头像地址 | string | `''` |
| date | 发布日期 | string | `''` |
| read-time | 阅读时长 | string | `''` |
| tags | 标签列表 | array | `[]` |

### 插槽

| 插槽 | 说明 |
| --- | --- |
| default | 正文内容（自带阅读排版） |
| title / description / eyebrow | 标题 / 摘要 / 眉题覆写 |
| footer | 页脚（相关阅读、打赏等） |
