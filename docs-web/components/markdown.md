# Markdown 渲染

`EwMarkdown` 将 Markdown 源文本渲染为富文本：内置零依赖轻量解析器，
覆盖标题、段落、有序/无序列表（含嵌套）、引用、分隔线、表格与代码围栏
（代码围栏复用 EwCodeBlock 的语法高亮分词器）。
安全模型：原文全量 HTML 转义后再渲染，`javascript:` 等注入向量被阻断，
明暗双主题自动跟随。

## 基础用法

<DemoBlock title="content" description="传入 Markdown 源文本即可渲染；语法着色与排版走语义令牌。">

<EwMarkdown :content="basicDemo" />

```vue
<EwMarkdown :content="content" />
```

</DemoBlock>

::: tip 支持范围
解析器覆盖 B 端内容展示的常用子集：标题（# ~ ######）、段落、有序/无序列表
（缩进嵌套）、引用、分隔线、GFM 表格（含对齐）、围栏代码块（js/json/shell，
`auto` 自动识别）与行内格式（加粗/斜体/删除线/行内代码/链接/图片）。
需要完整 CommonMark 语义时建议在业务侧使用成熟解析器后经插槽注入。
:::

## API

### Props

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| content | Markdown 源文本 | string | `''` |

<script setup>
const basicDemo = `# 积云数合

**轻量** 的官网组件库，支持 *行内格式* 与 ~~删除线~~。

- 零依赖渲染
- 语法高亮代码块

| 套餐 | 席位 | 价格 |
| --- | :-: | --: |
| 个人版 | 3 | 免费 |
| 团队版 | 20 | ¥99/月 |

> 从官网的气质，从首屏开始。

\`\`\`js
const site = createSite({ name: 'cumubase' })
site.build()
\`\`\``
</script>
