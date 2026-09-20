# Descriptions 描述列表

以表格化列表展示成组的只读字段，常用于详情页、审计信息等只读场景。字段由 `eb-descriptions-item` 声明（结构性子件，由父级收集渲染），支持边框模式、数字与响应式断点列数、标签冒号、水平 / 垂直排列、跨列与单元格对齐、单元格样式与列宽控制。

## 基础用法

`title` 显示在左上角，`extra`（属性或插槽）放在标题右侧，常用于放置操作按钮；`column` 控制每行列数，`border` 切换带边框模式。

<DemoBlock>
  <eb-descriptions title="订单详情" :column="2" border>
    <template #extra>
      <eb-button size="small">编辑</eb-button>
    </template>
    <eb-descriptions-item label="客户">张三</eb-descriptions-item>
    <eb-descriptions-item label="手机号">13800000000</eb-descriptions-item>
    <eb-descriptions-item label="支付方式">微信支付</eb-descriptions-item>
    <eb-descriptions-item label="状态">已支付</eb-descriptions-item>
  </eb-descriptions>
</DemoBlock>

## 垂直排列

`direction="vertical"` 时标签在上、内容在下（渲染为两个 tbody），适合字段值较长的场景。

<DemoBlock>
  <eb-descriptions title="规格参数" direction="vertical">
    <eb-descriptions-item label="屏幕">6.7 英寸 OLED</eb-descriptions-item>
    <eb-descriptions-item label="电池">5000mAh</eb-descriptions-item>
    <eb-descriptions-item label="重量">198g</eb-descriptions-item>
  </eb-descriptions>
</DemoBlock>

## 跨列

`span` 指定字段占用的列数，超出当前行剩余列时自动收敛；末行不满列时由最后一格补满（与主流组件库相同的填充语义）。

<DemoBlock>
  <eb-descriptions title="售后信息" border>
    <eb-descriptions-item label="售后类型">退货退款</eb-descriptions-item>
    <eb-descriptions-item label="联系人" :span="2">李四 13800000000</eb-descriptions-item>
    <eb-descriptions-item label="原因" :span="3">商品与描述不符，外包装破损。</eb-descriptions-item>
  </eb-descriptions>
</DemoBlock>

## 尺寸

`size` 支持三档，控制标签与内容的内边距密度，可与 `column`、`border` 自由组合。

<DemoBlock>
  <eb-descriptions title="小尺寸" size="small" :column="2" border>
    <eb-descriptions-item label="规格">500g</eb-descriptions-item>
    <eb-descriptions-item label="产地">云南</eb-descriptions-item>
    <eb-descriptions-item label="保质期">12 个月</eb-descriptions-item>
    <eb-descriptions-item label="储存条件">阴凉干燥处</eb-descriptions-item>
  </eb-descriptions>
</DemoBlock>

## 对齐与列宽

`align` 控制内容对齐、`label-align` 单独控制标签对齐；`width` 固定内容列宽、`min-width` 约束标签列最小宽，用于表单化详情的纵向对齐。

<DemoBlock>
  <eb-descriptions title="结算信息" :column="2" border>
    <eb-descriptions-item label="订单号" width="220" align="right">SO-20260801-001</eb-descriptions-item>
    <eb-descriptions-item label="金额" min-width="120" label-align="right" align="right">¥ 12,800.00</eb-descriptions-item>
    <eb-descriptions-item label="备注" :span="2" align="center">全程冷链配送</eb-descriptions-item>
  </eb-descriptions>
</DemoBlock>

## 插槽自定义

`title`、`extra` 插槽分别替换标题与右上区域；`eb-descriptions-item` 的 `#label` 插槽自定义标签（如追加说明），默认插槽放内容。

<DemoBlock>
  <eb-descriptions :column="2" border>
    <template #title>
      <span style="font-weight: 600;">账户信息</span>
    </template>
    <template #extra>
      <eb-link type="primary" href="#">查看全部</eb-link>
    </template>
    <eb-descriptions-item><template #label>手机号（已验证）</template>138****0000</eb-descriptions-item>
    <eb-descriptions-item><template #label>邮箱</template>wil@example.com</eb-descriptions-item>
  </eb-descriptions>
</DemoBlock>

## 标签冒号与单元格样式

`colon` 开启后在每个标签后渲染冒号（次要文本色；antd 默认 true，本组件默认 false 保持既有视觉）；`label-style` / `content-style` 为容器级单元格样式，item 级同名属性可逐项覆盖，与 `width` / `min-width` 自由叠加。

<DemoBlock>
  <eb-descriptions title="容器信息" colon :column="2" :label-style="{ color: 'var(--eb-text-color-secondary)' }">
    <eb-descriptions-item label="渠道" :content-style="{ fontWeight: 600 }">Web 控制台</eb-descriptions-item>
    <eb-descriptions-item label="环境">生产</eb-descriptions-item>
    <eb-descriptions-item label="负责人" :label-style="{ color: 'var(--eb-color-primary)' }" :content-style="{ fontWeight: 600 }">运营组</eb-descriptions-item>
    <eb-descriptions-item label="值班">7 x 24</eb-descriptions-item>
  </eb-descriptions>
</DemoBlock>

## 响应式列数

`column` 除数字外支持 `{ xs, sm, md, lg }` 对象形态（min-width 断点 0 / 576 / 768 / 992，由小到大命中）：窄屏自动降为单列阅读，宽屏恢复多列，服务端渲染按最小档输出。

<DemoBlock>
  <eb-descriptions title="订单快照" border :column="{ xs: 1, md: 2 }">
    <eb-descriptions-item label="订单号">SO-20260920-001</eb-descriptions-item>
    <eb-descriptions-item label="金额">¥ 399.00</eb-descriptions-item>
    <eb-descriptions-item label="支付方式">支付宝</eb-descriptions-item>
    <eb-descriptions-item label="状态">已发货</eb-descriptions-item>
  </eb-descriptions>
</DemoBlock>

## API

<ApiTable title="Descriptions Props" :rows="[
  { name: 'title', desc: '标题文本', type: 'string', default: '' },
  { name: 'extra', desc: '标题右侧附加文本', type: 'string', default: '' },
  { name: 'column', desc: '每行列数（数字向下取整最小 1）；或响应式对象 { xs, sm, md, lg }，由小到大命中断点，全不命中回退最小已声明档', type: 'number | { xs, sm, md, lg }', default: '3' },
  { name: 'colon', desc: '标签后显示冒号（antd 默认 true，本组件默认 false 保持既有视觉）', type: 'boolean', default: 'false' },
  { name: 'labelStyle', desc: '容器级标签单元格样式，item 同名属性可覆盖', type: 'object', default: '—' },
  { name: 'contentStyle', desc: '容器级内容单元格样式，item 同名属性可覆盖', type: 'object', default: '—' },
  { name: 'border', desc: '边框模式', type: 'boolean', default: 'false' },
  { name: 'direction', desc: '排列方向：horizontal 标签左内容右，vertical 标签上内容下', type: 'horizontal | vertical', default: 'horizontal' },
  { name: 'size', desc: '尺寸', type: 'large | default | small', default: 'default' },
]" />

<ApiTable title="Descriptions Slots" :rows="[
  { name: 'default', desc: 'eb-descriptions-item 列表', type: '—', default: '—' },
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
  { name: 'labelStyle', desc: '标签单元格样式对象，覆盖容器级 label-style', type: 'object', default: '—' },
  { name: 'contentStyle', desc: '内容单元格样式对象，覆盖容器级 content-style', type: 'object', default: '—' },
]" />

<ApiTable title="DescriptionsItem Slots" :rows="[
  { name: 'default', desc: '内容文本', type: '—', default: '—' },
  { name: 'label', desc: '自定义标签', type: '—', default: '—' },
]" />
