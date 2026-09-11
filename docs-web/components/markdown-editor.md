# Markdown 编辑器

`EvMarkdownEditor` 提供「编辑 + 预览」一体化的 Markdown 编辑体验：
工具栏快捷排版（加粗/斜体/删除线/行内代码/标题/引用/列表/链接），
`split` 双栏实时预览或 `toggle` 编辑/预览切换，支持 Ctrl/⌘+B、⌘+I 快捷键。
预览由 `EvMarkdown` 承载（零依赖解析 + 语法高亮），明暗双主题自动跟随。

## 基础用法

<DemoBlock title="v-model + split 预览" description="左侧编辑右侧实时渲染；选中文字后点工具栏试试排版快捷键。">

<EvMarkdownEditor v-model="demoContent" height="260px" />

```vue
<script setup>
import { ref } from 'vue'
const content = ref('# 开始写作\n')
</script>

<template>
  <EvMarkdownEditor v-model="content" />
</template>
```

</DemoBlock>

## 切换模式

<DemoBlock title="preview = toggle" description="通过右上角切换编辑与预览，适合窄版面。">

<EvMarkdownEditor v-model="toggleContent" preview="toggle" height="220px" />

```vue
<EvMarkdownEditor v-model="content" preview="toggle" />
```

</DemoBlock>

## API

### Props

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| v-model | Markdown 源文本 | string | `''` |
| placeholder | 占位文案 | string | — |
| height | 编辑区高度（数字按 px） | string / number | `'320px'` |
| preview | 预览形态：`split` 双栏实时 / `toggle` 切换 | string | `'split'` |
| toolbar | 展示工具栏 | boolean | `true` |
| disabled | 禁用编辑 | boolean | `false` |

### 事件

| 事件 | 说明 | 参数 |
| --- | --- | --- |
| update:model-value | 内容变化 | value |
| change | 内容变化 | value |

<script setup>
import { ref } from 'vue'

const demoContent = ref(`# 开始写作

EvMarkdownEditor 支持**加粗**、*斜体*、\`行内代码\`与[链接](https://example.com)。

1. 选中文字点工具栏
2. 或使用 Ctrl/⌘ + B 加粗
`)

const toggleContent = ref(`## 切换模式

右上角可在编辑与预览之间切换。`)
</script>
