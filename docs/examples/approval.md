<script setup>
import ApprovalConsole from '../../examples/ebui-example-approval/src/pages/ApprovalConsole.vue'
import approvalSource from '../../examples/ebui-example-approval/src/pages/ApprovalConsole.vue?raw'
</script>

# 报销审批

面向「报销审批、申请流转」的协作办公场景：双视角演示 —— 「我的申请」（提交、跟踪、撤回）与「审批中心」（待审队列 + 审批工作区）。审批流节点（提交 → 部门经理 → 财务 → 出纳）贯穿两个视角，Steps 可视化进度、AuditTimeline 留痕可追溯。

<a class="bd-live-link" href="/examples/live/approval">在全屏示例中心打开「报销审批」</a>

## 组件构成

| 组件 | 在本场景中的角色 |
| --- | --- |
| AppLayout / Menu | 后台骨架与双视角导航（菜单项带待办计数） |
| StatCard | 我的申请 KPI：累计提交 / 审批中 / 已通过 / 被驳回 |
| DataTable + CellStack + StatusTag | 申请单列表（单号双行标识、金额右对齐、状态列） |
| **Steps** | 审批流节点可视化（提交 → 部门经理 → 财务 → 出纳），驳回时当前节点转 error |
| **AuditTimeline** | 审批记录留痕：操作人 / 时间 / 意见，单据的所有流转均可追溯 |
| Dialog + Form + Select + InputNumber | 发起报销的**动态费用明细行**：增删行、实时合计、自定义行级校验 |
| Segmented | 状态筛选（全部 / 审批中 / 已通过 / 已驳回） |
| Popconfirm + Textarea | 撤回二次确认、驳回意见（必填校验） |
| DetailDescriptions + Table | 单据要素回显与费用明细 |

## 关键实现说明

**审批流建模**。节点定义收敛在 `FLOW_NODES` 常量；单据用两个字段描述进度——`currentStep`（已到达节点下标，驱动 Steps）与 `flow[]`（留痕数组，驱动 AuditTimeline）。状态机简单可靠：

- 「同意」→ currentStep 前进 + 追加留痕；最后一个节点通过即整单 `approved`；
- 「驳回」→ 状态转 `rejected` + Steps 当前节点 `error` + 必填意见写入留痕；
- 「撤回」→ 仅 `pending` 可撤回，转 `withdrawn`。

**双视角共享数据**。我的申请与审批中心读取同一份 reactive 单据集合：在审批中心「同意」后切回我的申请，KPI 与列表即时联动；我在「我的申请」新提交的单据也会出现在审批中心队列（演示以登录人为部门经理视角做了简化）。

**动态费用明细表单**。明细行是可增删的对象数组，合计为 computed；行级校验（金额 > 0 且说明非空）通过 Form rules 的自定义 validator 挂在明细字段上，提交前整体拦截。

## 本地运行

```bash
pnpm --filter @wil-works/ebui-example-approval dev   # http://localhost:8626
```

```text
examples/ebui-example-approval/
  src/
    App.vue
    pages/
      ApprovalConsole.vue   # 本页预览的源码（骨架 + 双视角挂载）
      mock.js               # 单据 / 审批流 / 待审队列模拟数据
      modules/
        MyExpenses.vue      # 我的申请（KPI + 列表 + 发起报销 + 详情）
        ApproveCenter.vue   # 审批中心（待审队列 + 审批工作区）
```

## 接入真实业务

- `approveQueue` 换成「待我审批」接口；同意 / 驳回换成流转接口，`flow[]` 由后端流水渲染；
- 审批人身份用真实登录态判断，而非演示里的固定角色；
- 更复杂的会签 / 或签 / 条件分支流程，可在 `FLOW_NODES` 基础上扩展节点类型，Steps 仍按 `currentStep` 驱动。
