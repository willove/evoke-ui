# 订单详情页示例

企业中后台「实体详情页」场景的基础 case：页头返回 + 状态流转操作、基础信息与收货信息的配置式详情描述、多页签组织商品明细 / 审计日志 / 发货记录，操作留痕带字段级变更对比。

## 运行

```bash
# 在 monorepo 根目录
pnpm --filter @wil-works/ebui-example-detail dev
# http://localhost:8624
```

## 覆盖组件

| 组件 | 用途 |
| --- | --- |
| PageHeader | 页头（返回 + 标题 + 状态 + 操作区） |
| DetailDescriptions | 基础信息 / 收货信息 / 支付信息（items 配置式，点路径取值、slot 定制） |
| Tabs | 商品明细 / 审计日志 / 发货记录 |
| DataTable + CellStack | 商品明细表格（双行单元格、金额右对齐、合计摘要行） |
| AuditTimeline | 操作留痕（操作人、时间、字段级 diff 展开） |
| StatusTag | 订单状态 / 支付状态 |
| Descriptions | 卖家卡片 |
| Dialog + Form + Input + Textarea | 「修改备注」弹窗 |
| Message / Popconfirm | 操作反馈、取消订单确认 |
| Steps | 订单进度条（待付款 → 待发货 → 已发货 → 已完成） |
| Card / SectionCard / Tag / Link | 版面组织 |

## 业务交互

1. 顶部操作区按状态渲染：「修改备注」（Dialog 表单，提交后更新基础信息并追加审计记录）、「取消订单」（Popconfirm，仅待付款可点）、「提醒发货」。
2. 审计日志用 AuditTimeline，`diff` 数组展示字段级 before/after，展开互不影响（稳定 id）。
3. 商品明细 Table 合计行用 `show-summary` 模拟方式（页脚固定金额行）。

## 结构

```
src/
  App.vue                  # 独立运行外壳
  pages/
    OrderDetailPage.vue    # 详情页（自包含，可被文档站源码级引入预览）
    mock.js                # 订单数据 / 商品明细 / 审计日志
```

## 与文档站的关系

`pages/OrderDetailPage.vue` 被 `evoke-business-ui-docs/examples/detail.md` 直接 import 作为在线实时预览，文档页同时展示该文件完整源码。
