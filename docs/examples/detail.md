<script setup>
import OrderDetailPage from '../../examples/ebui-example-detail/src/pages/OrderDetailPage.vue'
import orderDetailSource from '../../examples/ebui-example-detail/src/pages/OrderDetailPage.vue?raw'
</script>

# 订单详情页

实体详情的标准骨架：页头（标题 + 状态 + 按状态渲染的操作）、进度条、配置式详情描述、多页签组织明细 / 履约 / 审计日志，右侧栏放参与方与结算摘要。此示例演示 DetailDescriptions 的点路径与插槽取值、AuditTimeline 的字段级变更对比，以及「页面状态可变」的详情页如何同步刷新所有视图。

<a class="bd-live-link" href="/examples/live/detail">在全屏示例中心打开「详情页」</a>

## 在线预览

试试：「修改备注」保存后基础信息与审计日志同步更新（含字段级 diff）；「取消订单」后页头状态标签、进度条与支付状态一起流转。

<DocExample :code="orderDetailSource">
  <OrderDetailPage />
</DocExample>

## 组件构成

| 组件 | 在本场景中的角色 |
| --- | --- |
| PageHeader | 页头（`title` 必填；返回按钮与操作放 `#actions`，本组件没有内置返回键） |
| StatusTag | 页头 / 基础信息 / 支付状态共用同一份 `statuses` 字典 |
| Steps / Step | 订单进度（取消态把当前步覆盖为 `status="error"`） |
| DetailDescriptions | 基础信息、买家、收货信息三处复用：`data` 源对象 + `items` 配置（`buyer.nickname` 点路径） |
| Tabs + TabPane | 商品明细 / 发货记录 / 审计日志分区（审计日志开启 `lazy` 首次激活才渲染） |
| DataTable + CellStack | 商品明细（名称 + 规格双行）、发货记录（运单号链接列） |
| AuditTimeline | 操作留痕：`operator / action / createdAt / detail`，`diff` 数组展示字段级 before/after |
| Avatar / Link / Tag / Divider | 买家卡片、会员档案入口、包裹状态、结算摘要分隔 |
| Dialog + Form + Textarea | 修改备注弹窗（非空校验） |
| Message / Popconfirm | 提醒发货反馈、取消订单二次确认（仅未付款 / 待发货可点） |

## 关键实现说明

**详情描述的取值分层**。`items` 里 `prop` 支持点路径（`buyer.nickname`），复杂单元格用 `slot` 拿 `{ value }` 自行渲染（状态列套 StatusTag），纯文本转换用 `formatter: (value, data) => string` —— 三层覆盖从简单到复杂。

**页面状态可变的详情页**。订单对象是响应式的，任何操作只改数据源：状态标签、进度条、操作按钮可用性（`canCancel` computed）全部自动联动；同时向 `auditLogs` 头部插入一条留痕，审计页签打开即最新。

**审计时间线的稳定 id**。`items` 的 `id` 必须稳定（示例用 `log-N` 递增），否则头部插入新记录后展开态会错位到别的条目上；字段级变更直接给 `diff: [{ field, before, after }]`。

**弹窗改数据的标准姿势**。`openRemark` 打开前把当前值拷进表单模型，保存校验通过后才写回数据源并关弹窗 —— 避免用户点取消时已改了一半。

## 本地运行

```bash
pnpm example:ebui-detail   # http://localhost:8624
```

```text
examples/ebui-example-detail/
  src/
    App.vue
    pages/
      OrderDetailPage.vue    # 本页预览的源码
      mock.js                # 订单 / 商品 / 发货 / 审计日志模拟数据
```

## 接入真实业务

- 页面挂载时按路由参数请求订单详情；`order / goods / auditLogs` 换成接口数据即可，组件层无需改动；
- 状态字典（`ORDER_STATUS / PAY_STATUS`）与列表页共用一份常量模块；
- 长表单类操作（退款、改价）建议复用本示例的「弹窗表单 + 审计留痕」模式。
