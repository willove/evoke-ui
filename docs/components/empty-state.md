# EmptyState 统一空态

列表、搜索、详情等场景的统一空态：图标 + 标题 + 描述 + 动作区。`default` 纵向适合页面级空态，`compact` 横向适合卡片/列表内嵌。

## 基础用法

<DemoBlock>
  <eb-empty-state
    title="暂无订单"
    description="当前筛选条件下没有匹配的订单，调整筛选后重试"
  />
</DemoBlock>

## 紧凑模式

size 取 `compact` 时横向排布，高度更小，适合嵌在表格和卡片内：

<DemoBlock>
  <div style="border:1px solid var(--eb-border-color);border-radius:8px;padding:16px">
    <eb-empty-state size="compact" title="暂无审批记录" />
  </div>
</DemoBlock>

## 语义色调

tone 决定图标底色，用于区分普通空态与告警、出错：

<DemoBlock>
  <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px">
    <eb-empty-state icon="search" tone="primary" title="没有找到结果" description="换个关键词试试" />
    <eb-empty-state icon="inbox" tone="warning" title="库存不足" description="以下 3 个商品需要补货" />
  </div>
</DemoBlock>

## 动作区与自定义图标

`actions` 插槽放后续动作，`icon` 插槽可完全替换图标区：

<DemoBlock>
  <eb-empty-state icon="inbox" tone="danger" title="加载失败" description="网络异常，请稍后重试">
    <template #actions>
      <eb-button size="small" type="primary">重新加载</eb-button>
      <eb-button size="small">返回列表</eb-button>
    </template>
  </eb-empty-state>
</DemoBlock>

<ApiTable title="EmptyState Props" :rows="[
  { name: 'icon', desc: '图标名', type: 'string', default: 'box' },
  { name: 'title', desc: '空态标题', type: 'string', default: '' },
  { name: 'description', desc: '补充描述', type: 'string', default: '' },
  { name: 'size', desc: 'default 纵向页面级 / compact 横向紧凑', type: 'default | compact', default: 'default' },
  { name: 'tone', desc: '图标底色语义', type: 'default | primary | success | warning | danger', default: 'default' },
]" />

<ApiTable title="EmptyState Slots" :rows="[
  { name: 'icon', desc: '自定义图标区', type: '—', default: '—' },
  { name: 'title', desc: '自定义标题', type: '—', default: '—' },
  { name: 'description', desc: '自定义描述', type: '—', default: '—' },
  { name: 'actions', desc: '动作区', type: '—', default: '—' },
]" />
