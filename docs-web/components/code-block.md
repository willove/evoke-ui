# CodeBlock 命令块

`EwCodeBlock` 以 macOS 终端窗框的形态展示安装命令与代码片段：窗口控制点标题栏、
提示符前缀、语法高亮与一键复制（复制成功后按钮变绿并打勾）。内置轻量高亮器
覆盖 shell / js / json 三种语言（`auto` 自动识别），零额外依赖；
颜色全部走语义令牌，明暗双主题自动跟随。

<script setup>
const jsDemo = `const site = createSite({ name: 'cumubase' })

// 构建并部署
site.build().then(() => deploy(site, 3000))`
</script>

## 基础用法

<DemoBlock title="窗框 + 提示符 + 一键复制" description="复制按钮在标题栏右侧；试试点它，观察成功反馈。">

<EwCodeBlock prefix="$" code="brew install --cask cumubase" />

```vue
<EwCodeBlock prefix="$" code="brew install --cask cumubase" />
```

悬停标题栏的窗口控制点会显现 关闭 / 最小化 / 最大化 符号，点击有按压反馈——细节与真实 macOS 窗框一致。

</DemoBlock>

## 标题栏与按钮文字

<DemoBlock title="title / show-copy-text" description="title 显示在窗口控制点右侧；复制按钮可带文字。">

<EwCodeBlock title="Terminal" code="npx cumubase init my-site" show-copy-text />

```vue
<EwCodeBlock title="Terminal" code="npx cumubase init my-site" show-copy-text />
```

</DemoBlock>

## 语法高亮

<DemoBlock title="language" description="默认 auto 自动识别 shell / js / json；也可显式指定语言。">

<EwCodeBlock title="app.js" language="js" :code="jsDemo" />

```vue
<EwCodeBlock title="app.js" language="js" :code="code" />
```

</DemoBlock>

::: tip 放置建议
命令块通常出现在 Hero 动作区下方或下载页；复制事件 `copy(text)` 可用于埋点统计。
需要完全自定义的渲染（如富文本标注）时，用默认插槽整体覆写代码区。
:::

## API

### Props

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| code | 代码/命令文案 | string | — |
| language | 高亮语言：`auto` / `shell` / `js` / `json` | string | `auto` |
| prefix | 提示符前缀（如 `$`） | string | — |
| title | 标题栏文案 | string | — |
| copyable | 展示复制按钮 | boolean | `true` |
| show-copy-text | 复制按钮带文字 | boolean | `false` |

### 插槽

| 插槽 | 说明 |
| --- | --- |
| default | 覆写代码区渲染内容 |
| title | 标题覆写 |

### 事件

| 事件 | 说明 | 参数 |
| --- | --- | --- |
| copy | 复制成功 | text |
