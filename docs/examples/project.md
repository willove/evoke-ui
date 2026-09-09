<script setup>
import ProjectConsole from '../../examples/ebui-example-project/src/pages/ProjectConsole.vue'
import projectSource from '../../examples/ebui-example-project/src/pages/ProjectConsole.vue?raw'
</script>

# 项目协作

面向「项目规划 / 进度计划管理 / 数据统计」的协作办公场景：完整后台骨架内三个真实模块 —— 项目总览（组合进度统计）、进度计划（甘特式里程碑 + 任务分解）、团队用量（配额额度墙 + 成员消耗明细）。

<a class="bd-live-link" href="/examples/live/project">在全屏示例中心打开「项目协作」</a>

## 组件构成

| 组件 | 在本场景中的角色 |
| --- | --- |
| AppLayout / Menu | 后台骨架与三模块导航（无 vue-router，index 驱动切换） |
| StatCard | 项目组合 KPI：进行中项目、到期里程碑、成员数、平均交付进度 |
| DataTable + Progress | 项目列表、任务分解、成员用量三张表（进度列内嵌 Progress） |
| **GanttProgress** | 里程碑阶段柱：completed / active / pending 三态高度 + 贯穿连接线 + active 脉冲 |
| **CreditsProgress** | AI Credits / 存储 / API 调用 / 构建时长四类配额额度墙（刷新周期头 + 超额转红） |
| Segmented | 进度计划模块顶部的项目切换器 |
| CellStack + StatusTag | 项目 / 任务 / 成员的双行标识与状态标签 |
| Popconfirm + Message | 席位释放确认与操作反馈 |

## 关键实现说明

**CreditsProgress 表达「配额型资源」**。席位、AI Credits、存储、API 调用这类资源的共同语义是「已用 / 总量 / 刷新周期」，组件按容器宽度自适应栅格根数，剩余不足 20% 高亮、超额自动转红：

```vue
<ev-credits-progress
  :used="q.used"
  :total="q.total"
  :refresh-date="q.refreshDate"
  :refresh-label="q.refreshLabel"
/>
```

**GanttProgress 表达「阶段推进」**。stages 数组声明里程碑（status 三态 + 可选 date），组件自动换算整体推进比例并绘制贯穿连接线，active 阶段脉冲提示当前焦点：

```vue
<ev-gantt-progress :stages="project.stages" />
```

**模块间联动**。项目总览的「进度计划」按钮通过 `defineExpose` 调用进度计划模块的 `selectProject(id)`，实现跨模块选中项目——比事件总线更直观的兄弟模块通信方式。

## 本地运行

```bash
pnpm --filter @wil-works/ebui-example-project dev   # http://localhost:8625
```

```text
examples/ebui-example-project/
  src/
    App.vue
    pages/
      ProjectConsole.vue     # 本页预览的源码（骨架 + 三模块挂载）
      mock.js                # 项目 / 阶段 / 任务 / 配额 / 成员模拟数据
      modules/
        ProjectsOverview.vue # 项目总览（KPI + 组合列表）
        SprintPlan.vue       # 进度计划（里程碑 + 任务分解）
        TeamUsage.vue        # 团队用量（额度墙 + 成员明细）
```

## 接入真实业务

- `mock.js` 的 projects / quotas / memberUsage 分别换成项目管理系统、计费系统、租户服务的接口；
- 「标记完成」「释放席位」等操作替换为真实变更接口后，建议补一条审计留痕（参考详情页示例的 AuditTimeline 用法）；
- 阶段 / 任务的状态枚举建议沉淀为业务常量，与状态标签、筛选下拉共用一份。
