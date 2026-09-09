# Descriptions 描述列表

以表格化列表展示成组的只读字段，常用于详情页、审计信息等只读场景。字段由 `ev-descriptions-item` 声明（结构性子件，由父级收集渲染），支持边框模式、自定义列数、水平 / 垂直排列、跨列与单元格对齐、列宽控制。

## 基础用法

`title` 显示在左上角，`extra`（属性或插槽）放在标题右侧，常用于放置操作按钮；`column` 控制每行列数，`border` 切换带边框模式。

<DemoBlock>
  <ev-descriptions title="订单详情" :column="2" border>
    <template #extra>
      <ev-button size="small">编辑</ev-button>
    </template>
    <ev-descriptions-item label="客户">张三</ev-descriptions-item>
    <ev-descriptions-item label="手机号">13800000000</ev-descriptions-item>
    <ev-descriptions-item label="支付方式">微信支付</ev-descriptions-item>
    <ev-descriptions-item label="状态">已支付</ev-descriptions-item>
  </ev-descriptions>
</DemoBlock>

## 垂直排列

`direction="vertical"` 时标签在上、内容在下（渲染为两个 tbody），适合字段值较长的场景。

<DemoBlock>
  <ev-descriptions title="规格参数" direction="vertical">
    <ev-descriptions-item label="屏幕">6.7 英寸 OLED</ev-descriptions-item>
    <ev-descriptions-item label="电池">5000mAh</ev-descriptions-item>
    <ev-descriptions-item label="重量">198g</ev-descriptions-item>
  </ev-descriptions>
</DemoBlock>

## 跨列

`span` 指定字段占用的列数，超出当前行剩余列时自动收敛；末行不满列时由最后一格补满（与主流组件库相同的填充语义）。

<DemoBlock>
  <ev-descriptions title="售后信息" border>
    <ev-descriptions-item label="售后类型">退货退款</ev-descriptions-item>
    <ev-descriptions-item label="联系人" :span="2">李四 13800000000</ev-descriptions-item>
    <ev-descriptions-item label="原因" :span="3">商品与描述不符，外包装破损。</ev-descriptions-item>
  </ev-descriptions>
</DemoBlock>

## 尺寸

`size` 支持三档，控制标签与内容的内边距密度，可与 `column`、`border` 自由组合。

<DemoBlock>
  <ev-descriptions title="小尺寸" size="small" :column="2" border>
    <ev-descriptions-item label="规格">500g</ev-descriptions-item>
    <ev-descriptions-item label="产地">云南</ev-descriptions-item>
    <ev-descriptions-item label="保质期">12 个月</ev-descriptions-item>
    <ev-descriptions-item label="储存条件">阴凉干燥处</ev-descriptions-item>
  </ev-descriptions>
</DemoBlock>

## 对齐与列宽

`align` 控制内容对齐、`label-align` 单独控制标签对齐；`width` 固定内容列宽、`min-width` 约束标签列最小宽，用于表单化详情的纵向对齐。

<DemoBlock>
  <ev-descriptions title="结算信息" :column="2" border>
    <ev-descriptions-item label="订单号" width="220" align="right">SO-20260801-001</ev-descriptions-item>
    <ev-descriptions-item label="金额" min-width="120" label-align="right" align="right">¥ 12,800.00</ev-descriptions-item>
    <ev-descriptions-item label="备注" :span="2" align="center">全程冷链配送</ev-descriptions-item>
  </ev-descriptions>
</DemoBlock>

## 插槽自定义

`title`、`extra` 插槽分别替换标题与右上区域；`ev-descriptions-item` 的 `#label` 插槽自定义标签（如追加说明），默认插槽放内容。

<DemoBlock>
  <ev-descriptions :column="2" border>
    <template #title>
      <span style="font-weight: 600;">账户信息</span>
    </template>
    <template #extra>
      <ev-link type="primary" href="#">查看全部</ev-link>
    </template>
    <ev-descriptions-item><template #label>手机号（已验证）</template>138****0000</ev-descriptions-item>
    <ev-descriptions-item><template #label>邮箱</template>wil@example.com</ev-descriptions-item>
  </ev-descriptions>
</DemoBlock>

## API

<ApiTable title="Descriptions Props" :rows="[
  { name: 'title', desc: '标题文本', type: 'string', default: '' },
  { name: 'extra', desc: '标题右侧附加文本', type: 'string', default: '' },
  { name: 'column', desc: '每行列数（向下取整，最小 1）', type: 'number', default: '3' },
  { name: 'border', desc: '边框模式', type: 'boolean', default: 'false' },
  { name: 'direction', desc: '排列方向：horizontal 标签左内容右，vertical 标签上内容下', type: 'horizontal | vertical', default: 'horizontal' },
  { name: 'size', desc: '尺寸', type: 'large | default | small', default: 'default' },
]" />

<ApiTable title="Descriptions Slots" :rows="[
  { name: 'default', desc: 'ev-descriptions-item 列表', type: '—', default: '—' },
  { name: 'title', desc: '自定义标题', type: '—', default: '—' },
  { name: 'extra', desc: '自定义标题右侧区域', type: '—', default: '—' },
]" />

<ApiTable title="DescriptionsItem Props" :rows="[
  { name: 'label', desc: '标签文本（优先级低于 label 插槽）', type: 'string', default: '' },
  { name: 'span', desc: '占用列数，超出当前行剩余列时自动收敛', type: 'number', default: '1' },
  { name: 'width', desc: '内容列固定宽度（按 px 渲染）', type: 'string | number', default: '' },
  { name: 'minWidth', desc: '标签列最小宽度（按 px 渲染）', type: 'string | number', default: '' },
  { name: 'align', desc: '内容对齐', type: 'left | center | right', default: 'left' },
  { name: 'labelAlign', desc: '标签对齐，缺省跟随 align', type: 'left | center | right', default: '' },
  { name: 'className', desc: '内容单元格类名（也接受 class-name 形式）', type: 'string', default: '' },
  { name: 'labelClassName', desc: '标签单元格类名（也接受 label-class-name 形式）', type: 'string', default: '' },
]" />

<ApiTable title="DescriptionsItem Slots" :rows="[
  { name: 'default', desc: '内容文本', type: '—', default: '—' },
  { name: 'label', desc: '自定义标签', type: '—', default: '—' },
]" />
