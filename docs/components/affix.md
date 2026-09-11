# Affix 图钉

将页面元素钉在可视区间：滚动越过后固定在 `offset` 指定的距顶/距底位置，常用于表格工具栏、操作条的常驻。

## 基础用法

<DemoBlock>
  <eb-alert type="info" :closable="false" style="margin-bottom: 12px;">
    向下滚动页面，观察工具条钉在距顶部 12px 处；滚回原位后自动还原。
  </eb-alert>
  <eb-affix :offset="12">
    <div style="background: var(--eb-bg-color-overlay); border: 1px solid var(--eb-border-color-light); border-radius: 8px; padding: 10px 16px; display: flex; gap: 8px; align-items: center;">
      <eb-button size="small" type="primary">新建订单</eb-button>
      <eb-button size="small">批量导出</eb-button>
      <span style="font-size: 12px; color: var(--eb-text-color-secondary);">已选择 3 项</span>
    </div>
  </eb-affix>
</DemoBlock>

## 指定滚动容器

默认监听 window；钉在内部滚动容器时传 `target`：

```vue
<eb-affix :offset="0" target="#detail-scroll-container">
  <section-card>区块操作条</section-card>
</eb-affix>
```

## Affix API

| 名称 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| offset | Number | `0` | 距顶/距底的偏移（px） |
| position | String | `top` | 钉住方向：top / bottom |
| target | String | window | 滚动容器选择器 |
| z-index | Number | `100` | 固定态层级 |

事件：`change(affixed)`。
