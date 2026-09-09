# CodeBlock 命令块

`EwCodeBlock` 以 macOS 窗框的形态展示安装命令与代码片段：红绿灯标题栏、提示符前缀与
一键复制（复制成功后按钮变绿并打勾）。颜色全部走语义令牌，明暗双主题自动跟随。

## 基础用法

<DemoBlock title="窗框 + 提示符 + 一键复制" description="复制按钮在标题栏右侧；试试点它，观察成功反馈。">

<EwCodeBlock prefix="$" code="brew install --cask nimbus" />

```vue
<EwCodeBlock prefix="$" code="brew install --cask nimbus" />
```

</DemoBlock>

## 标题栏与按钮文字

<DemoBlock title="title / show-copy-text" description="title 显示在红绿灯旁；复制按钮可带文字。">

<EwCodeBlock title="Terminal" code="npx nimbus init my-site" show-copy-text />

```vue
<EwCodeBlock title="Terminal" code="npx nimbus init my-site" show-copy-text />
```

</DemoBlock>

::: tip 放置建议
命令块通常出现在 Hero 动作区下方或下载页；复制事件 `copy(text)` 可用于埋点统计。
:::

## API

### Props

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| code | 代码/命令文案 | string | — |
| prefix | 提示符前缀（如 `$`） | string | — |
| title | 标题栏文案 | string | — |
| copyable | 展示复制按钮 | boolean | `true` |
| show-copy-text | 复制按钮带文字 | boolean | `false` |

### 插槽

| 插槽 | 说明 |
| --- | --- |
| default | 覆写代码内容（可承载高亮标记） |
| title | 标题覆写 |

### 事件

| 事件 | 说明 | 参数 |
| --- | --- | --- |
| copy | 复制成功 | text |
