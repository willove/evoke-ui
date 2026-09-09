# DetailDescriptions 详情描述

items 配置式的详情描述：值从 `data` 对象自动取（支持 `'a.b'` 路径），支持 formatter 与按名分发插槽，基于 EvDescriptions 渲染。

取值规则：

- `prop` 支持点路径（如 `user.name`），中间为 null/undefined 时安全返回 undefined；
- 没有配置 `formatter` 与 `slot` 时，值为 null/undefined 显示 `placeholder`（缺省 `-`），其余按原值输出；注意空字符串不算空值，会原样显示为空白；
- `formatter: (value, data) => string` 的第二个参数是整个 `data` 对象，可做跨字段计算。

## 基础用法

<DemoBlock>
  <ev-detail-descriptions
    title="订单详情"
    :column="2"
    :data="{ orderNo: 'A-1001', user: { name: '张三', phone: '13800000000' }, amount: 9900 }"
    :items="[
      { prop: 'orderNo', label: '订单号' },
      { prop: 'user.name', label: '客户' },
      { prop: 'amount', label: '金额', formatter: (v) => '￥' + (v / 100).toFixed(2) },
      { prop: 'remark', label: '备注' },
    ]"
  />
</DemoBlock>

## 插槽自定义

`item.slot` 指定插槽名，作用域携带 `{ item, value }`，适合渲染状态标签、链接、操作按钮等富内容；未命中的字段继续走默认文本渲染。

<DemoBlock>
  <ev-detail-descriptions
    title="支付信息"
    :column="2"
    :data="{ orderNo: 'A-2001', status: 'paid', channel: { name: '支付宝' }, remark: null }"
    :items="[
      { prop: 'orderNo', label: '订单号' },
      { prop: 'status', label: '状态', slot: 'status' },
      { prop: 'channel.name', label: '支付渠道' },
      { prop: 'remark', label: '备注', placeholder: '暂无备注' },
    ]"
  >
    <template #status="{ item, value }">
      <ev-status-tag :value="value" :statuses="[{ value: 'paid', label: '已支付', type: 'success' }, { value: 'pending', label: '待支付', type: 'warning' }]" />
    </template>
  </ev-detail-descriptions>
</DemoBlock>

## 空值与格式化

`remark` 为 null 时显示 `placeholder`；时间戳经 formatter 转为可读文本；`border: false` 切换为无边框模式。

<DemoBlock>
  <ev-detail-descriptions
    :column="1"
    :border="false"
    :data="{ amount: 9900, discount: null, createdAt: 1757032800000 }"
    :items="[
      { prop: 'amount', label: '金额', formatter: (v) => '￥' + (v / 100).toFixed(2) },
      { prop: 'discount', label: '优惠', placeholder: '无优惠' },
      { prop: 'createdAt', label: '创建时间', formatter: (v) => new Date(v).toLocaleString() },
    ]"
  />
</DemoBlock>

## 标题扩展区与跨列

`extra` 插槽渲染在标题行右侧，常放编辑按钮；`span` 让字段占据多列，适合备注类长文本。

<DemoBlock>
  <ev-detail-descriptions
    title="用户资料"
    :column="2"
    :data="{ name: '张三', role: '管理员', email: 'zhang@example.com', remark: '内部账号，勿外传' }"
    :items="[
      { prop: 'name', label: '姓名' },
      { prop: 'email', label: '邮箱' },
      { prop: 'role', label: '角色' },
      { prop: 'remark', label: '备注', span: 2 },
    ]"
  >
    <template #extra>
      <ev-button size="small">编辑资料</ev-button>
    </template>
  </ev-detail-descriptions>
</DemoBlock>

## API

<ApiTable title="DetailDescriptions Props" :rows="[
  { name: 'data', desc: '数据源对象', type: 'object', default: '{}' },
  { name: 'items', desc: '字段配置', type: 'Item[]', default: '[]' },
  { name: 'column', desc: '每行列数', type: 'number', default: '3' },
  { name: 'border', desc: '边框模式', type: 'boolean', default: 'true' },
  { name: 'size', desc: '尺寸', type: 'small | default | large', default: 'default' },
  { name: 'title', desc: '标题', type: 'string', default: '' },
  { name: 'direction', desc: '排列方向', type: 'horizontal | vertical', default: 'horizontal' },
]" />

<ApiTable title="Item" :rows="[
  { name: 'prop', desc: '取值路径（支持 a.b）', type: 'string', default: '—' },
  { name: 'label', desc: '标签', type: 'string', default: '' },
  { name: 'span', desc: '占列数', type: 'number', default: '1' },
  { name: 'slot', desc: '内容插槽名，作用域 { item, value }', type: 'string', default: '—' },
  { name: 'formatter', desc: '格式化', type: '(value, data) => string', default: '—' },
  { name: 'placeholder', desc: '空值占位（仅 null / undefined 生效）', type: 'string', default: '-' },
]" />

<ApiTable title="Slots" :rows="[
  { name: 'title', desc: '标题区域', type: '—', default: 'title prop' },
  { name: 'extra', desc: '标题行右侧扩展区', type: '—', default: '—' },
  { name: 'item.slot', desc: '字段内容插槽，作用域 { item, value }', type: '—', default: '—' },
]" />

本组件无事件与实例方法，纯展示。
