# Comment 评论

审批意见 / 工单回复组件：作者 + 头像 + 时间 + 内容 + 操作区，`replies` 插槽嵌套自身形成缩进层级。

## 基础用法与嵌套

<DemoBlock>
  <div style="max-width: 560px">
    <ev-comment author="王敏" datetime="2026-09-07 10:24">
      <template #avatar>
        <ev-avatar size="32" style="background: var(--ev-color-primary); color: #fff;">王</ev-avatar>
      </template>
      <p>发票金额与报销单一致，同意通过。</p>
      <template #actions>
        <span>回复</span><span>点赞</span>
      </template>
      <template #replies>
        <ev-comment author="李雷" datetime="2026-09-07 10:40">
          <template #avatar>
            <ev-avatar size="32" style="background: var(--ev-color-info); color: #fff;">李</ev-avatar>
          </template>
          <p>已确认，走下一步审批。</p>
          <template #actions><span>回复</span></template>
        </ev-comment>
      </template>
    </ev-comment>
  </div>
</DemoBlock>

<script setup>
</script>

## Comment API

| 名称 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| author | String | — | 作者名 |
| avatar | String | — | 头像地址（avatar 插槽优先） |
| datetime | String | — | 时间描述 |

插槽：`avatar`、`author`、`datetime`、`default`（内容）、`actions`、`replies`（嵌套子评论）。
