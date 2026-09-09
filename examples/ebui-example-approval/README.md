# 报销与审批中心示例

面向「报销审批、申请流转」的协作办公场景基础 case：双视角演示 —— 「我的申请」（提交、跟踪、撤回）与「审批中心」（待审队列 + 审批工作区），审批流节点（提交 → 部门经理 → 财务 → 出纳）贯穿两个视角，操作留痕可追溯。

## 运行

```bash
# 在 monorepo 根目录
pnpm --filter @wil-works/ebui-example-approval dev
# http://localhost:8626
```

## 覆盖组件

| 组件 | 用途 |
| --- | --- |
| AppLayout / Menu | 后台骨架与双视角导航（菜单项带待办计数） |
| StatCard / Row / Col | 我的申请 KPI（累计 / 审批中 / 已通过 / 被驳回） |
| DataTable + CellStack + StatusTag | 申请单列表、费用明细表 |
| **Steps** | 审批流节点（提交 → 部门经理 → 财务 → 出纳），驳回态 error |
| **AuditTimeline** | 审批记录留痕（操作人 / 时间 / 意见） |
| Dialog + Form + Select + InputNumber | 发起报销：**动态费用明细行**（增删行 + 实时合计 + 自定义校验） |
| Segmented | 状态筛选（全部 / 审批中 / 已通过 / 已驳回） |
| Popconfirm / Textarea | 撤回确认、驳回意见（必填） |
| DetailDescriptions | 单据要素回显 |

## 业务模块

| 菜单 | 模块 | 交互 |
| --- | --- | --- |
| 我的申请 | `modules/MyExpenses.vue` | 发起报销（动态明细 + 合计 + 校验）、状态筛选、详情（流程 + 明细 + 记录）、撤回 |
| 审批中心 | `modules/ApproveCenter.vue` | 待审队列（master-detail）、Steps 流程可视化、同意流转至财务、驳回必填意见、记录追加 |

## 审批流设计

- 节点定义收敛在 `FLOW_NODES` 常量，单据通过 `currentStep`（已到达节点下标）与 `flow[]`（留痕）描述进度；
- 「同意」= currentStep 前进 + 追加记录；最后一个节点通过即整单 approved；「驳回」= 状态转 rejected + Steps 当前节点 error + 必填意见入留痕；
- 我的申请与审批中心共享同一份 reactive 单据数据，任一视角操作另一视角立即可见。

## 结构

```
src/
  App.vue            # 独立运行外壳（标题栏 + 暗色切换）
  pages/
    ApprovalConsole.vue  # 控制台（自包含，可被文档站源码级引入预览）
    mock.js              # 单据 / 审批流 / 队列模拟数据
    modules/
      MyExpenses.vue     # 我的申请（KPI + 列表 + 发起 + 详情）
      ApproveCenter.vue  # 审批中心（队列 + 工作区 + 同意/驳回）
```

## 与文档站的关系

`pages/ApprovalConsole.vue` 被 `evoke-business-ui-docs/examples/approval.md` 与全屏子站点 `/examples/live/approval` 直接 import 作为在线预览，文档页同时展示完整源码。
