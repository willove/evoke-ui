# Backtop 返回顶部

滚动超过 `visibility-height` 后出现在右下角的返回顶部按钮，默认监听 window，可用 `target` 指定内部滚动容器。

<DemoBlock>
  <ev-alert type="info" :closable="false">向下滚动本页，右下角出现返回顶部按钮。</ev-alert>
</DemoBlock>

## Backtop API

| 名称 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| target | String | window | 监听滚动的容器选择器 |
| visibility-height | Number | `200` | 滚动多少距离后显示（px） |
| right | Number | `40` | 距右侧（px） |
| bottom | Number | `40` | 距底部（px） |

事件：`click`；默认插槽可自定义图标内容。
