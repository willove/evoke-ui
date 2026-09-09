# Alert 公告

`EwAlert` 有两种形态：`pill` 横幅胶囊用于页面顶部的全站通告（黑色圆形图标块 + 文案 + 动作位），
常规形态为语义色提示卡，用于区块级的状态说明。`closable` 可关闭。

## 横幅胶囊

<DemoBlock title="pill 形态" description="全站通告位：版本发布、活动入口等；action 插槽放跳转链接。">

<div style="display:flex; flex-direction:column; gap:12px;">
  <EwAlert pill>
    <span>Nimbus 2.0 发布：全新编辑器与团队空间</span>
    <template #action>
      <a href="#" style="display:inline-flex; align-items:center; gap:2px;">查看<EwIcon name="arrow-right" :size="14" /></a>
    </template>
  </EwAlert>
</div>

```vue
<EwAlert pill>
  <span>Nimbus 2.0 发布：全新编辑器与团队空间</span>
  <template #action><a href="#">查看</a></template>
</EwAlert>
```

</DemoBlock>

## 提示卡

<DemoBlock title="语义色调与关闭" description="success / warning / danger / neutral 语义色；closable 后隐藏由组件内部管理。">

<div style="display:flex; flex-direction:column; gap:12px;">
  <EwAlert tone="success" icon="check">已保存，所有改动即刻同步。</EwAlert>
  <EwAlert tone="warning" icon="warning" title="即将废弃" closable>
    该 API 将在下个大版本移除，请尽快迁移。
  </EwAlert>
</div>

```vue
<EwAlert tone="success" icon="check">已保存。</EwAlert>
<EwAlert tone="warning" icon="warning" title="即将废弃" closable>…</EwAlert>
```

</DemoBlock>

## API

### Props

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| title | 加粗标题 | string | — |
| icon | 图标名 | string | — |
| tone | 语义色 | `'primary' \| 'success' \| 'warning' \| 'danger' \| 'neutral'` | `'primary'` |
| pill | 横幅胶囊形态 | boolean | `false` |
| closable | 可关闭 | boolean | `false` |

### 插槽

| 插槽 | 说明 |
| --- | --- |
| icon | 图标覆写 |
| title | 标题覆写 |
| default | 正文内容 |
| action | 右侧动作位 |
