# Typography 排版

排版是中英文界面信息层级的基础。本库提供 `EvTitle` / `EvParagraph` / `EvText` 三件套，统一消费字号刻度（12–40px）与行高令牌，中文以 PingFang/微软雅黑回退、拉丁以 Inter 优先，数字启用等宽（tabular-nums）。

## 标题 Title

`level` 1–5 对应 32 / 24 / 20 / 16 / 14 px，默认渲染语义化 `h1–h5` 标签（可用 `tag` 覆盖）。

<DemoBlock>
  <ev-title :level="1">Level 1 主标题 H1</ev-title>
  <ev-title :level="2">Level 2 区块标题 H2</ev-title>
  <ev-title :level="3">Level 3 卡片标题 H3</ev-title>
  <ev-title :level="4">Level 4 分组标题 H4</ev-title>
  <ev-title :level="5">Level 5 辅助标题 H5</ev-title>
</DemoBlock>

`copyable` 在悬停时显示复制按钮，点击复制标题纯文本：

<DemoBlock>
  <ev-title :level="4" copyable>订单详情 #A-1001</ev-title>
</DemoBlock>

## 段落 Paragraph

`ellipsis` 多行截断：传 `true`（3 行）或 `{ rows: n }`；`copyable` 同标题。

<DemoBlock>
  <div style="max-width: 560px">
    <ev-paragraph>
      企业级中后台组件库面向数据密集场景设计：表格、表单、图表与业务组件组合覆盖增删改查、审批流、
      监控看板等高频页面。所有颜色、间距、圆角、动效均由设计令牌驱动，明暗主题自动跟随。
    </ev-paragraph>
    <ev-paragraph :ellipsis="{ rows: 2 }" style="margin-top: 12px">
      多行截断示例：这里是一段较长的说明文字，超过指定行数后自动以省略号收尾，适用于列表摘要、
      卡片简介、通知预览等空间受限的场景。超过两行的内容将不再展示，鼠标悬停可配合 Tooltip 查看全文。
    </ev-paragraph>
  </div>
</DemoBlock>

## 文本 Text

`EvText` 在基础语义色之上提供行内标记与复制能力：

<DemoBlock>
  <ev-space size="middle" style="flex-wrap: wrap">
    <ev-text type="primary">Primary</ev-text>
    <ev-text type="success">Success</ev-text>
    <ev-text type="warning">Warning</ev-text>
    <ev-text type="danger">Danger</ev-text>
    <ev-text mark>Mark 标记</ev-text>
    <ev-text code>Code 片段</ev-text>
    <ev-text underline>Underline 下划线</ev-text>
    <ev-text delete>Delete 删除线</ev-text>
    <ev-text strong>Strong 加粗</ev-text>
    <ev-text truncated style="max-width: 120px">Truncated 单行截断超长文本示例</ev-text>
  </ev-space>
</DemoBlock>

## Typography API

### EvTitle

| 名称 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| level | Number | `1` | 层级 1–5，对应 32/24/20/16/14px |
| tag | String | 按 level | 渲染标签，默认 h1–h5 |
| copyable | Boolean | `false` | 悬停显示复制按钮 |
| copy-text | String | 组件文本 | 复制内容 |

### EvParagraph

| 名称 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| ellipsis | Boolean / Object | `false` | 多行截断；`{ rows: n }` 指定行数 |
| copyable | Boolean | `false` | 复制按钮 |
| spacing | Boolean | `true` | 段距 |

### EvText（在原 API 上新增）

`ellipsis`（Boolean / `{ rows }`）、`copyable`、`copy-text`、`mark`、`code`、`underline`、`delete`、`strong`。
