# Result 结果页

流程终态反馈：成功 / 失败 / 警告 / 403 / 404 / 500，自带图标与默认文案，`extra` 插槽放操作按钮。

## 基础用法

<DemoBlock>
  <ev-result status="success" title="提交成功" sub-title="工单已流转至交付部，预计 2 个工作日内响应。">
    <template #extra>
      <ev-space size="middle">
        <ev-button type="primary">查看工单</ev-button>
        <ev-button>返回列表</ev-button>
      </ev-space>
    </template>
  </ev-result>
</DemoBlock>

## 404 与警告

<DemoBlock>
  <ev-space size="large">
    <ev-result status="404" style="padding: 12px 0;" />
    <ev-result status="warning" title="额度不足" sub-title="当前额度余额为 0，请先提交扩容申请。" style="padding: 12px 0;">
      <template #extra>
        <ev-button type="primary" size="small">申请扩容</ev-button>
      </template>
    </ev-result>
  </ev-space>
</DemoBlock>

## Result API

| 名称 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| status | String | `info` | success / error / info / warning / 404 / 403 / 500 |
| title | String | 按状态 | 标题 |
| sub-title | String | — | 副标题 |
| icon | String | 按状态 | 自定义图标名 |
| icon-size | Number | `72` | 图标尺寸 |

插槽：`icon`、`extra`（操作区）、`default`（标题与副标题之间的内容）。
